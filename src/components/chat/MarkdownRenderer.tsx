import React, { useState } from 'react';
import { CopyIcon, CheckIcon } from '../ui/Icons';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming }) => {
  return (
    <div className="prose">
      {parseMarkdown(content)}
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

function parseMarkdown(text: string): React.ReactNode[] {
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
          <p key={key}>
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
          <ul key={key}>
            {listItems.map((item, idx) => (
              <li key={idx}>{renderInline(item)}</li>
            ))}
          </ul>
        );
        inList = false;
        listItems = [];
      }
    };

    const flushTable = (key: string) => {
      if (inTable && tableRows.length > 0) {
        const header = tableRows[0];
        const body = tableRows.slice(2); // skip separator row
        elements.push(
          <div key={key} style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  {header.map((col, idx) => (
                    <th key={idx}>{renderInline(col.trim())}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((col, cIdx) => (
                      <td key={cIdx}>{renderInline(col.trim())}</td>
                    ))}
                  </tr>
                ))}
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
        elements.push(<h1 key={`h1-${partIndex}-${lineIdx}`}>{renderInline(trimmed.slice(2))}</h1>);
        return;
      }
      if (trimmed.startsWith('## ')) {
        flushParagraph(`fp-${partIndex}-${lineIdx}`);
        flushList(`fl-${partIndex}-${lineIdx}`);
        flushTable(`ft-${partIndex}-${lineIdx}`);
        elements.push(<h2 key={`h2-${partIndex}-${lineIdx}`}>{renderInline(trimmed.slice(3))}</h2>);
        return;
      }
      if (trimmed.startsWith('### ')) {
        flushParagraph(`fp-${partIndex}-${lineIdx}`);
        flushList(`fl-${partIndex}-${lineIdx}`);
        flushTable(`ft-${partIndex}-${lineIdx}`);
        elements.push(<h3 key={`h3-${partIndex}-${lineIdx}`}>{renderInline(trimmed.slice(4))}</h3>);
        return;
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        flushParagraph(`fp-${partIndex}-${lineIdx}`);
        flushList(`fl-${partIndex}-${lineIdx}`);
        flushTable(`ft-${partIndex}-${lineIdx}`);
        elements.push(
          <blockquote key={`bq-${partIndex}-${lineIdx}`}>
            {renderInline(trimmed.slice(2))}
          </blockquote>
        );
        return;
      }

      // Table line
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushParagraph(`fp-${partIndex}-${lineIdx}`);
        flushList(`fl-${partIndex}-${lineIdx}`);
        inTable = true;
        const cols = trimmed.slice(1, -1).split('|');
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
      return <code key={idx}>{token.slice(1, -1)}</code>;
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
