import { beforeEach, describe, expect, it } from 'vitest';
import { queryKnowledgeBase } from './knowledgeService';
import { useDocumentStore } from '../../stores/documentStore';
import { DEFAULT_DOCUMENTS, DEFAULT_PROJECTS } from '../../constants/defaults';

const indexedIds = new Set(DEFAULT_DOCUMENTS.filter((d) => d.status === 'indexed').map((d) => d.id));
const ADCS_QUESTION = 'What is the ADCS pointing accuracy requirement?';

describe('queryKnowledgeBase grounding (KB-011, KB-012)', () => {
  beforeEach(() => {
    useDocumentStore.setState({ documents: DEFAULT_DOCUMENTS, projects: DEFAULT_PROJECTS });
  });

  it('answers from indexed documents only, with citations', async () => {
    const res = await queryKnowledgeBase({ question: ADCS_QUESTION, scope: {}, depth: 'quick' });
    expect(res.grounding).not.toBe('insufficient');
    expect(res.sources.length).toBeGreaterThan(0);
    for (const s of res.sources) expect(indexedIds.has(s.documentId)).toBe(true);
    expect(res.answer).toContain('[1]');
  });

  it('reports each source’s relevance (0–1) and when its document was indexed', async () => {
    const res = await queryKnowledgeBase({ question: ADCS_QUESTION, scope: {}, depth: 'quick' });
    for (const s of res.sources) {
      expect(s.relevance).toBeGreaterThan(0);
      expect(s.relevance).toBeLessThanOrEqual(1);
      expect(s.indexedAt).toBe(DEFAULT_DOCUMENTS.find((d) => d.id === s.documentId)?.indexedAt);
    }
  });

  it('says it has insufficient information instead of guessing', async () => {
    const res = await queryKnowledgeBase({ question: 'Who won the 1998 football world cup final?', scope: {}, depth: 'quick' });
    expect(res.grounding).toBe('insufficient');
    expect(res.sources).toEqual([]);
  });

  it('lists unsupported sub-questions under deep research', async () => {
    const res = await queryKnowledgeBase({
      question: 'What are the ADCS safe mode rules and the EPS primary bus voltage?',
      scope: {},
      depth: 'deep',
    });
    expect(res.sources.length).toBeGreaterThan(0);
    expect(res.uncovered.some((u) => /EPS/i.test(u))).toBe(true);
  });

  it('does not search a project an administrator switched off (ADM-007)', async () => {
    useDocumentStore.getState().setProjectEnabled('orbit-1-sat', false);

    const res = await queryKnowledgeBase({ question: ADCS_QUESTION, scope: {}, depth: 'quick' });
    expect(res.grounding).toBe('insufficient');
    expect(res.sources).toEqual([]);

    const scoped = await queryKnowledgeBase({ question: ADCS_QUESTION, scope: { project: 'orbit-1-sat' }, depth: 'quick' });
    expect(scoped.answer).toContain('disabled by an administrator');
  });
});
