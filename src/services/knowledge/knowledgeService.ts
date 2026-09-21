import type {
  KnowledgeDocument,
  KnowledgeQueryRequest,
  KnowledgeQueryResponse,
  KnowledgeScope,
  ResearchStep,
  SourceReference,
} from '../../types';
import { useDocumentStore } from '../../stores/documentStore';
import { MOCK_DOCUMENT_PASSAGES, type MockPassage } from './mockPassages';

export interface KnowledgeQueryOptions {
  signal?: AbortSignal;
  // Progress for the research-steps UI; receives the full step list on every change.
  onStep?: (steps: ResearchStep[]) => void;
}

// Single swap-in point for Knowledge Copilot queries (KB-009..KB-012). Everything above this
// function (knowledgeStore, the Copilot page) only depends on KnowledgeQueryRequest/Response, so
// the real backend replaces the body with `POST /api/knowledge/query` (streaming steps if it can)
// and nothing else changes.
//
// Mock grounding policy (KB-012 applies to the mock too): only documents whose status is
// 'indexed' are searched, every source returned points at a real document in documentStore, and
// when nothing clears the relevance threshold the answer is 'insufficient' (KB-011) rather than a
// forced citation. Deep research applies the same rule per sub-question.
export async function queryKnowledgeBase(
  request: KnowledgeQueryRequest,
  options: KnowledgeQueryOptions = {}
): Promise<KnowledgeQueryResponse> {
  const { signal, onStep } = options;
  const steps: ResearchStep[] = [];
  const pushStep = (step: ResearchStep) => {
    steps.push(step);
    onStep?.([...steps]);
  };
  const finishStep = (id: string, patch: Partial<ResearchStep>) => {
    const idx = steps.findIndex((s) => s.id === id);
    if (idx >= 0) steps[idx] = { ...steps[idx], ...patch };
    onStep?.([...steps]);
  };

  const { documents, projects } = useDocumentStore.getState();
  const inScope = documents.filter((d) => matchesScope(d, request.scope));
  const searchable = inScope.filter((d) => d.status === 'indexed');
  const unavailableCount = inScope.length - searchable.length;
  const scopeLabel = describeScope(request.scope, projects);

  pushStep({ id: 'scope', label: 'Scoping the search', status: 'running' });
  await delay(250, signal);
  finishStep('scope', {
    status: searchable.length > 0 ? 'done' : 'empty',
    detail: `${plural(searchable.length, 'indexed document')}${scopeLabel}${unavailableCount > 0 ? ` · ${unavailableCount} not searchable yet` : ''}`,
  });

  const subQuestions = request.depth === 'deep' ? splitQuestion(request.question) : [request.question];
  const perQuestionLimit = request.depth === 'deep' ? (subQuestions.length > 1 ? 3 : 6) : 3;

  const sources: SourceReference[] = [];
  const sourceKeys = new Map<string, number>();
  const sections: Array<{ heading: string; lines: string[] }> = [];
  const uncovered: string[] = [];
  const consulted = new Set<string>();

  for (let i = 0; i < subQuestions.length; i++) {
    const sub = subQuestions[i];
    const stepId = `search-${i}`;
    pushStep({ id: stepId, label: request.depth === 'deep' ? `Searching “${sub}”` : 'Searching the knowledge base', status: 'running' });
    await delay(request.depth === 'deep' ? 350 : 300, signal);

    const terms = tokenize(sub);
    const hits = terms.length === 0 ? [] : rankPassages(searchable, terms, perQuestionLimit);
    if (hits.length === 0) {
      uncovered.push(sentenceCase(sub.replace(/^(the|a|an)\s+/i, '')));
      finishStep(stepId, { status: 'empty', detail: 'No supporting passages' });
      continue;
    }

    const lines = hits.map(({ doc, passage }) => {
      consulted.add(doc.id);
      const key = `${doc.id}|${passage.page}|${passage.requirementId || passage.section || ''}`;
      let n = sourceKeys.get(key);
      if (n === undefined) {
        sources.push({
          documentId: doc.id,
          documentTitle: doc.title,
          revision: doc.revision,
          page: passage.page,
          section: passage.section,
          requirementId: passage.requirementId,
          excerpt: passage.text,
        });
        n = sources.length;
        sourceKeys.set(key, n);
      }
      const label = passage.requirementId
        ? `**${passage.requirementId}**${passage.section ? ` (${passage.section})` : ''}`
        : `**${passage.section || `Page ${passage.page}`}**`;
      return `- ${label}: ${passage.text} [${n}]`;
    });
    sections.push({ heading: sentenceCase(sub), lines });
    finishStep(stepId, { status: 'done', detail: `${plural(hits.length, 'passage')} in ${plural(new Set(hits.map((h) => h.doc.id)).size, 'document')}` });
  }

  const base = {
    steps,
    searchedDocumentCount: searchable.length,
    consultedDocumentIds: Array.from(consulted),
  };

  if (sources.length === 0) {
    return {
      ...base,
      grounding: 'insufficient',
      answer: buildInsufficientAnswer(searchable.length, unavailableCount, scopeLabel),
      sources: [],
      uncovered: request.depth === 'deep' && subQuestions.length > 1 ? uncovered : [],
    };
  }

  pushStep({ id: 'compose', label: request.depth === 'deep' ? `Cross-checking ${plural(sources.length, 'source')}` : 'Composing the answer', status: 'running' });
  await delay(200, signal);
  finishStep('compose', { status: 'done' });

  const useHeadings = sections.length > 1;
  const body = sections.flatMap((s) => (useHeadings ? [`### ${s.heading}`, ...s.lines, ''] : [...s.lines, '']));
  return {
    ...base,
    grounding: 'grounded',
    answer: [
      `Found ${plural(sources.length, 'relevant passage')} in ${plural(consulted.size, 'indexed document')}${scopeLabel}.`,
      '',
      ...body,
      '*This answer only restates the cited passages. Verify against the referenced pages before engineering use.*',
    ].join('\n'),
    sources,
    uncovered,
  };
}

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'at', 'by', 'with', 'from', 'as', 'is', 'are', 'was', 'were',
  'be', 'been', 'it', 'its', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
  'do', 'does', 'did', 'can', 'could', 'should', 'would', 'shall', 'will', 'may', 'must', 'there', 'their', 'about', 'any',
  'me', 'my', 'we', 'our', 'you', 'your', 'tell', 'give', 'show', 'explain', 'describe', 'please', 'document', 'doc', 'also',
]);

const tokenize = (text: string): string[] => {
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t))
    .map((t) => (t.length > 4 && t.endsWith('s') ? t.slice(0, -1) : t));
  return Array.from(new Set(tokens));
};

// Deep research: break a compound question into sub-questions on "?", ";", "," and "and/also".
const splitQuestion = (question: string): string[] => {
  const parts = question
    .split(/[?;,\n]|\band\b|\balso\b/i)
    .map((p) => p.trim())
    .filter((p) => tokenize(p).length > 0);
  const unique = Array.from(new Set(parts));
  return unique.length > 0 ? unique : [question.trim()];
};

const sentenceCase = (text: string) => {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

const matchesScope = (doc: KnowledgeDocument, scope: KnowledgeScope) =>
  (!scope.project || doc.project === scope.project) && (!scope.subsystem || doc.subsystem === scope.subsystem);

// Documents uploaded through the UI have no mock chunks (the browser can't parse the PDF), so
// the only honest passage available is their own metadata on the title page.
const passagesFor = (doc: KnowledgeDocument): MockPassage[] =>
  MOCK_DOCUMENT_PASSAGES[doc.id] || [
    {
      page: 1,
      section: 'Document identification (metadata only)',
      text: `${doc.title}${doc.documentId ? ` (${doc.documentId})` : ''}, ${doc.documentType} revision ${doc.revision}${doc.subsystem ? `, ${doc.subsystem} subsystem` : ''}.`,
    },
  ];

// Term-overlap relevance: a passage must match at least half of the question's significant
// terms (and at least two when the question has two or more). Matches in the passage body
// weigh double so specific passages outrank ones that only share the document title.
const rankPassages = (docs: KnowledgeDocument[], terms: string[], limit: number) => {
  const minMatches = Math.min(2, terms.length);
  const scored: Array<{ doc: KnowledgeDocument; passage: MockPassage; score: number }> = [];

  for (const doc of docs) {
    const metaTokens = new Set(tokenize(`${doc.title} ${doc.documentId || ''} ${doc.subsystem || ''} ${doc.documentType}`));
    for (const passage of passagesFor(doc)) {
      const bodyTokens = new Set(tokenize(`${passage.text} ${passage.section || ''} ${passage.requirementId || ''}`));
      let matched = 0;
      let score = 0;
      for (const term of terms) {
        if (bodyTokens.has(term)) {
          matched++;
          score += 2;
        } else if (metaTokens.has(term)) {
          matched++;
          score += 1;
        }
      }
      if (matched >= minMatches && matched / terms.length >= 0.5) {
        scored.push({ doc, passage, score });
      }
    }
  }

  if (scored.length === 0) return [];
  scored.sort((a, b) => b.score - a.score);
  const cutoff = scored[0].score * 0.67;
  return scored.filter((s) => s.score >= cutoff).slice(0, limit);
};

const describeScope = (scope: KnowledgeScope, projects: Array<{ id: string; name: string }>) => {
  if (!scope.project) return '';
  const name = projects.find((p) => p.id === scope.project)?.name || scope.project;
  return ` in ${name}${scope.subsystem ? ` / ${scope.subsystem}` : ''}`;
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const buildInsufficientAnswer = (searchedCount: number, unavailableCount: number, scopeLabel: string) => {
  const lines = [
    '**Insufficient information in the knowledge base.**',
    '',
    searchedCount === 0
      ? `There are no indexed documents${scopeLabel} to search, so I can't answer this from approved sources.`
      : searchedCount === 1
        ? `The only indexed document${scopeLabel} doesn't contain passages that support an answer, so I won't guess.`
        : `None of the ${plural(searchedCount, 'indexed document')}${scopeLabel} contain passages that support an answer, so I won't guess.`,
    '',
  ];
  if (unavailableCount > 0) {
    lines.push(`- ${plural(unavailableCount, 'document')}${scopeLabel} ${unavailableCount === 1 ? 'is' : 'are'} not searchable yet (still indexing, failed, or disabled).`);
  }
  lines.push(
    '- Try widening the project/subsystem scope or rephrasing with document terms (subsystem names, requirement IDs).',
    '- If the relevant document is missing, ask an administrator to upload and index it.'
  );
  return lines.join('\n');
};

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
