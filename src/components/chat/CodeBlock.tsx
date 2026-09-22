import React, { useEffect, useId, useMemo, useState } from 'react';
import { CopyIcon, CheckIcon } from '../ui/Icons';
import { languageDisplayName, resolveLanguage } from '../../services/code/languages';
import { checkCode, type CodeIssue } from '../../services/code/codeCheck';

// highlight.js is loaded on first use (its own chunk), keeping it out of the main bundle.
type Highlighter = typeof import('../../services/code/highlight');
let highlighter: Highlighter | null = null;
let loadingHighlighter: Promise<Highlighter> | null = null;
const loadHighlighter = () =>
  (loadingHighlighter ??= import('../../services/code/highlight').then((mod) => (highlighter = mod)));

// A code block in an answer (plan: agent/CODE_BLOCKS_PLAN.md): language label, syntax highlighting,
// line numbers, lightweight checks and copy. While the answer is still streaming (`live`) it stays
// plain text, so nothing flickers; highlighting and checks run once the block is complete.
export const CodeBlock: React.FC<{ language: string; code: string; live?: boolean }> = ({ language, code, live }) => {
  const [copied, setCopied] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  const issuesId = useId();

  const [hl, setHl] = useState<Highlighter | null>(highlighter);
  useEffect(() => {
    if (hl || live) return;
    let cancelled = false;
    void loadHighlighter().then((mod) => {
      if (!cancelled) setHl(mod);
    });
    return () => {
      cancelled = true;
    };
  }, [hl, live]);

  const result = useMemo(() => {
    if (live) return null;
    // Unlabelled blocks get their language from highlight.js auto-detection once it has loaded.
    const highlighted = hl?.highlightCode(code, language);
    const resolved = highlighted?.language ?? resolveLanguage(language);
    return { html: highlighted?.html, resolved, issues: checkCode(code, resolved) };
  }, [code, language, live, hl]);

  const lineCount = code.split('\n').length;
  const issuesByLine = new Map<number, CodeIssue[]>();
  for (const issue of result?.issues || []) issuesByLine.set(issue.line, [...(issuesByLine.get(issue.line) || []), issue]);
  const warnings = result?.issues.filter((i) => i.severity === 'warning').length ?? 0;
  const notes = (result?.issues.length ?? 0) - warnings;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-lang">{languageDisplayName(result?.resolved ?? resolveLanguage(language), language)}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {result &&
            (result.issues.length === 0 ? (
              <span className="code-check" data-state="clean" title="Quick checks: brackets, indentation, conditions, style. Not a compiler.">
                <CheckIcon size={12} /> No issues
              </span>
            ) : (
              <button
                type="button"
                className="code-check code-action"
                data-state={warnings > 0 ? 'warning' : 'info'}
                aria-expanded={showIssues}
                aria-controls={issuesId}
                onClick={() => setShowIssues((v) => !v)}
                title="Quick checks: brackets, indentation, conditions, style. Not a compiler."
              >
                <span aria-hidden="true">{warnings > 0 ? '▲' : '●'}</span>
                {[warnings > 0 && `${warnings} warning${warnings === 1 ? '' : 's'}`, notes > 0 && `${notes} note${notes === 1 ? '' : 's'}`]
                  .filter(Boolean)
                  .join(' · ')}
              </button>
            ))}
          <button type="button" className="code-action" onClick={handleCopy} aria-label={copied ? 'Copied' : 'Copy code'}>
            {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </span>
      </div>

      <div className="code-body">
        <pre className="code-gutter" aria-hidden="true">
          {Array.from({ length: lineCount }, (_, i) => {
            const lineIssues = issuesByLine.get(i + 1);
            const level = lineIssues?.some((x) => x.severity === 'warning') ? 'warning' : lineIssues ? 'info' : undefined;
            return (
              <span key={i} data-issue={level} title={lineIssues?.map((x) => x.message).join('\n')}>
                {i + 1}
                {'\n'}
              </span>
            );
          })}
        </pre>
        <pre className="code-block-content">
          {result?.html !== undefined ? <code className="hljs" dangerouslySetInnerHTML={{ __html: result.html }} /> : <code>{code}</code>}
        </pre>
      </div>

      {result && showIssues && result.issues.length > 0 && (
        <ul id={issuesId} className="code-issues" aria-label="Code check results">
          {result.issues.map((issue, i) => (
            <li key={i} data-severity={issue.severity}>
              <span className="code-issue-line">Line {issue.line}</span>
              <span className="code-issue-kind">{issue.severity === 'warning' ? 'Warning' : 'Note'}</span>
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
