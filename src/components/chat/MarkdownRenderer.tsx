import React, { useState } from 'react';
import { CopyIcon, CheckIcon } from '../ui/Icons';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  direction?: 'ltr' | 'rtl' | 'auto';
}

function sanitizeStreamingMarkdown(text: string, isStreaming?: boolean): string {
  if (!isStreaming || !text) return text;

  let sanitized = text;

  // 1. Auto-close dangling code fence ```
  const codeBlockCount = (sanitized.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    sanitized += '\n```';
  } else {
    // 2. Auto-close dangling inline code `
    const remainingTicks = (sanitized.replace(/```[\s\S]*?```/g, '').match(/`/g) || []).length;
    if (remainingTicks % 2 !== 0) {
      sanitized += '`';
    }
  }

  // 3. Auto-close dangling bold **
  const remainingStars = (sanitized.replace(/```[\s\S]*?```/g, '').match(/\*\*/g) || []).length;
  if (remainingStars % 2 !== 0) {
    sanitized += '**';
  }

  // 4. Stabilize streaming table (prevent constant unmounting and re-parsing of tables)
  const lines = sanitized.split('\n');
  const lastLine = lines[lines.length - 1].trim();

  // If currently streaming inside a table row
  if (lastLine.startsWith('|')) {
    // Ensure the in-flight row ends with '|' so it doesn't drop out of table mode into paragraph mode
    if (!lastLine.endsWith('|')) {
      sanitized += ' |';
    }

    // If the table currently only has the header row (1 line), auto-complete the delimiter row
    let tableStartIdx = lines.length - 1;
    while (tableStartIdx >= 0 && lines[tableStartIdx].trim().startsWith('|')) {
      tableStartIdx--;
    }
    tableStartIdx++;

    const tableLines = lines.slice(tableStartIdx);
    if (tableLines.length === 1) {
      const headerCols = tableLines[0].trim().slice(1, -1).split('|').filter(Boolean).length;
      if (headerCols > 0) {
        sanitized += '\n| ' + Array(headerCols).fill('---').join(' | ') + ' |';
      }
    }
  }

  return sanitized;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming, direction = 'auto' }) => {
  const safeContent = sanitizeStreamingMarkdown(content, isStreaming);
  return (
    <div
      className={`prose ${isStreaming ? 'is-streaming' : ''}`}
      dir={direction}
      style={{
        direction: direction === 'auto' ? undefined : direction,
      }}
    >
      {parseMarkdown(safeContent, direction)}
      {isStreaming && <span className="stream-cursor" title="Streaming..." />}
    </div>
  );
};

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.2rem 0.5rem',
            borderRadius: 'var(--radius-xs)',
            fontSize: 'var(--text-xs)',
            background: copied ? 'var(--accent-surface)' : 'rgba(255, 255, 255, 0.05)',
            color: copied ? 'var(--accent-primary)' : 'inherit',
          }}
        >
          {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="code-block-content">
        <code>{code}</code>
      </pre>
    </div>
  );
};

function parseMarkdown(text: string, direction: 'ltr' | 'rtl' | 'auto' = 'auto'): React.ReactNode[] {
  if (!text) return [];

  const elements: React.ReactNode[] = [];
  // Split into code blocks and non-code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);

  parts.forEach((part, partIndex) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const match = part.match(/^```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```$/);
      const language = match ? match[1] : '';
      const code = match ? match[2] : part.slice(3, -3);
      elements.push(<CodeBlock key={`code-${partIndex}`} language={language} code={code.trimEnd()} />);
      return;
    }

    // Process regular text paragraphs, headers, tables, blockquotes, lists
    const lines = part.split('\n');
    let currentParagraph: string[] = [];
    let inList = false;
    let listItems: string[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    const flushParagraph = (key: string) => {
      if (currentParagraph.length > 0) {
        elements.push(
          <p key={key} dir={direction}>
            {currentParagraph.map((pLine, i) => (
              <React.Fragment key={i}>
                {renderInline(pLine)}
                {i < currentParagraph.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
        currentParagraph = [];
      }
    };

    const flushList = (key: string) => {
      if (inList && listItems.length > 0) {
        elements.push(
          <ul key={key} dir={direction}>
            {listItems.map((item, idx) => (
              <li key={idx} dir={direction}>{renderInline(item)}</li>
            ))}
          </ul>
        );
        inList = false;
        listItems = [];
      }
    };

    const isDelimiterRow = (cols: string[]) =>
      cols.length > 0 && cols.every((c) => /^[\s:-]+$/.test(c.trim()));

    const flushTable = (key: string) => {
      if (inTable && tableRows.length > 0) {
        let headerCols: string[] = [];
        let bodyRows: string[][] = [];

        // Identify header and body rows
        if (tableRows.length >= 2 && isDelimiterRow(tableRows[1])) {
          headerCols = tableRows[0];
          bodyRows = tableRows.slice(2);
        } else if (isDelimiterRow(tableRows[0])) {
          headerCols = tableRows[0];
          bodyRows = tableRows.slice(1);
        } else {
          headerCols = tableRows[0];
          bodyRows = tableRows.slice(1);
        }

        const colCount = Math.max(headerCols.length, 1);

        elements.push(
          <div key={key} className="table-wrapper">
            <table dir={direction}>
              <thead>
                <tr>
                  {headerCols.map((col, idx) => (
                    <th key={`th-${idx}`}>{renderInline(col.trim())}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rIdx) => {
                  if (isDelimiterRow(row)) return null;

                  // Pad cells to match header column count to eliminate horizontal width shifts
                  const cells = [...row];
                  while (cells.length < colCount) {
                    cells.push('');
                  }

                  return (
                    <tr key={`tr-${rIdx}`}>
                      {cells.slice(0, colCount).map((col, cIdx) => (
                        <td key={`td-${rIdx}-${cIdx}`}>{renderInline(col.trim())}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
        tableRows = [];
      }
    };

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();

      // Headers
      if (trimmed.startsWith('# ')) {
        flushParagraph(`fp-${partIndex}-${lineIdx}`);
        flushList(`fl-${partIndex}-${lineIdx}`);
        flushTable(`ft-${partIndex}-${lineIdx}`);
        elements.push(<h1 key={`h1-${partIndex}-${lineIdx}`} dir={direction}>{renderInline(trimmed.slice(2))}</h1>);
        return;
      }
      if (trimmed.startsWith('## ')) {
        flushParagraph(`fp-${partIndex}-${lineIdx}`);
        flushList(`fl-${partIndex}-${lineIdx}`);
        flushTable(`ft-${partIndex}-${lineIdx}`);
        elements.push(<h2 key={`h2-${partIndex}-${lineIdx}`} dir={direction}>{renderInline(trimmed.slice(3))}</h2>);
        return;
      }
      if (trimmed.startsWith('### ')) {
        flushParagraph(`fp-${partIndex}-${lineIdx}`);
        flushList(`fl-${partIndex}-${lineIdx}`);
        flushTable(`ft-${partIndex}-${lineIdx}`);
        elements.push(<h3 key={`h3-${partIndex}-${lineIdx}`} dir={direction}>{renderInline(trimmed.slice(4))}</h3>);
        return;
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        flushParagraph(`fp-${partIndex}-${lineIdx}`);
        flushList(`fl-${partIndex}-${lineIdx}`);
        flushTable(`ft-${partIndex}-${lineIdx}`);
        elements.push(
          <blockquote key={`bq-${partIndex}-${lineIdx}`} dir={direction}>
            {renderInline(trimmed.slice(2))}
          </blockquote>
        );
        return;
      }

      // Table line: either fully formatted or in-flight row while already in table
      const isTableLine =
        (trimmed.startsWith('|') && trimmed.endsWith('|')) ||
        (inTable && trimmed.startsWith('|'));

      if (isTableLine) {
        flushParagraph(`fp-${partIndex}-${lineIdx}`);
        flushList(`fl-${partIndex}-${lineIdx}`);
        inTable = true;
        let rowContent = trimmed;
        if (rowContent.startsWith('|')) rowContent = rowContent.slice(1);
        if (rowContent.endsWith('|')) rowContent = rowContent.slice(0, -1);
        const cols = rowContent.split('|');
        tableRows.push(cols);
        return;
      } else if (inTable) {
        flushTable(`table-${partIndex}-${lineIdx}`);
      }

      // Bullet List
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        flushParagraph(`fp-${partIndex}-${lineIdx}`);
        flushTable(`ft-${partIndex}-${lineIdx}`);
        inList = true;
        listItems.push(trimmed.slice(2));
        return;
      } else if (inList) {
        flushList(`list-${partIndex}-${lineIdx}`);
      }

      // Empty line
      if (!trimmed) {
        flushParagraph(`p-${partIndex}-${lineIdx}`);
        flushList(`fl-${partIndex}-${lineIdx}`);
        flushTable(`ft-${partIndex}-${lineIdx}`);
        return;
      }

      currentParagraph.push(line);
    });

    flushParagraph(`fp-end-${partIndex}`);
    flushList(`fl-end-${partIndex}`);
    flushTable(`ft-end-${partIndex}`);
  });

  return elements;
}

function renderInline(text: string): React.ReactNode {
  // Parse inline elements: `code`, **bold**, *italic*
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return tokens.map((token, idx) => {
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return <code key={idx} className="ltr-isolated">{token.slice(1, -1)}</code>;
    }
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return <strong key={idx}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return <em key={idx}>{token.slice(1, -1)}</em>;
    }
    return token;
  });
}
