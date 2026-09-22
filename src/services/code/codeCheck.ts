import type { CodeLanguage } from './languages';

// Lightweight code checks for code blocks in answers (plan: agent/CODE_BLOCKS_PLAN.md §2).
// Fast, common problems only; not a compiler or a full linter. Every rule is conservative, so a
// clean result means "nothing obvious", never "correct".

export interface CodeIssue {
  line: number; // 1-based
  severity: 'warning' | 'info';
  message: string;
}

const C_LIKE: CodeLanguage[] = ['c', 'cpp', 'java', 'javascript', 'typescript'];
const LINE_LIMIT = 120;

interface Syntax {
  line?: string; // line comment
  block?: [string, string]; // block comment
  quotes: string[];
}

function syntaxOf(lang: CodeLanguage | undefined): Syntax {
  switch (lang) {
    case 'python':
      return { line: '#', quotes: ['"""', "'''", '"', "'"] };
    case 'bash':
      return { line: '#', quotes: ['"', "'"] };
    case 'matlab':
      return { line: '%', quotes: ['"', "'"] };
    case 'sql':
      return { line: '--', block: ['/*', '*/'], quotes: ["'", '"'] };
    case 'json':
      return { quotes: ['"'] };
    default:
      return { line: '//', block: ['/*', '*/'], quotes: ['"', "'", '`'] };
  }
}

/**
 * Removes comments and string contents (keeping line structure), so bracket and pattern checks
 * don't trip over "(" inside a string or a commented-out line.
 */
export function stripCommentsAndStrings(code: string, lang: CodeLanguage | undefined): string {
  const { line, block, quotes } = syntaxOf(lang);
  let out = '';
  let i = 0;
  while (i < code.length) {
    if (block && code.startsWith(block[0], i)) {
      const end = code.indexOf(block[1], i + block[0].length);
      const stop = end < 0 ? code.length : end + block[1].length;
      out += code.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
      continue;
    }
    if (line && code.startsWith(line, i)) {
      const end = code.indexOf('\n', i);
      const stop = end < 0 ? code.length : end;
      out += ' '.repeat(stop - i);
      i = stop;
      continue;
    }
    // MATLAB's ' is also the transpose operator: only a quote when it can't follow a value.
    const q = quotes.find((qq) => code.startsWith(qq, i) && !(lang === 'matlab' && qq === "'" && /[\w)\].']$/.test(out)));
    if (q) {
      let j = i + q.length;
      while (j < code.length && !code.startsWith(q, j)) {
        if (code[j] === '\\') j++;
        else if (code[j] === '\n' && q.length === 1 && q !== '`') break; // unterminated single-line string
        j++;
      }
      // Stop at the closing quote, or just before the newline of an unterminated string (keeping it).
      const closed = j < code.length && code.startsWith(q, j);
      out += q + code.slice(i + q.length, j).replace(/[^\n]/g, ' ') + (closed ? q : '');
      i = closed ? j + q.length : j;
      continue;
    }
    out += code[i];
    i++;
  }
  return out;
}

function checkBrackets(clean: string): CodeIssue[] {
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  const stack: Array<{ ch: string; line: number }> = [];
  const issues: CodeIssue[] = [];
  let line = 1;
  for (const ch of clean) {
    if (ch === '\n') line++;
    else if (ch === '(' || ch === '[' || ch === '{') stack.push({ ch, line });
    else if (ch in pairs) {
      const top = stack[stack.length - 1];
      if (top && top.ch === pairs[ch]) stack.pop();
      else {
        issues.push({ line, severity: 'warning', message: top ? `'${ch}' closes '${top.ch}' opened on line ${top.line}` : `Unmatched '${ch}'` });
        if (top) stack.pop();
      }
    }
  }
  for (const open of stack.slice(0, 3)) issues.push({ line: open.line, severity: 'warning', message: `'${open.ch}' is never closed` });
  return issues;
}

function checkJson(code: string): CodeIssue[] {
  try {
    JSON.parse(code);
    return [];
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid JSON';
    const pos = /position (\d+)/.exec(msg);
    const lineMatch = /line (\d+)/.exec(msg);
    const line = lineMatch ? Number(lineMatch[1]) : pos ? code.slice(0, Number(pos[1])).split('\n').length : 1;
    return [{ line, severity: 'warning', message: `Invalid JSON: ${msg.replace(/^JSON\.parse: /, '').replace(/ in JSON at .*$/, '')}` }];
  }
}

export function checkCode(code: string, lang: CodeLanguage | undefined): CodeIssue[] {
  const issues: CodeIssue[] = [];
  const lines = code.split('\n');
  const clean = stripCommentsAndStrings(code, lang);
  const cleanLines = clean.split('\n');

  if (lang === 'json') issues.push(...checkJson(code));
  else issues.push(...checkBrackets(clean));

  // Indentation: tabs and spaces mixed across the block (reported once, at the first switch).
  let indentKind: 'tab' | 'space' | undefined;
  for (let i = 0; i < lines.length; i++) {
    const indent = /^[ \t]*/.exec(lines[i])![0];
    if (!indent || !lines[i].trim()) continue;
    const kind = indent.includes('\t') ? (indent.includes(' ') ? 'mixed' : 'tab') : 'space';
    if (kind === 'mixed' || (indentKind && kind !== indentKind)) {
      issues.push({ line: i + 1, severity: 'warning', message: 'Indentation mixes tabs and spaces' });
      break;
    }
    indentKind = kind;
  }

  lines.forEach((raw, i) => {
    const n = i + 1;
    const cleanLine = cleanLines[i] ?? '';

    if (lang === 'python') {
      const indent = /^ */.exec(raw)![0].length;
      if (raw.trim() && indent % 4 !== 0 && !/^\s*[)\]}]/.test(raw)) {
        issues.push({ line: n, severity: 'info', message: `Indentation of ${indent} spaces (PEP 8 uses multiples of 4)` });
      }
      if (/[=!]=\s*None\b/.test(cleanLine)) issues.push({ line: n, severity: 'info', message: "Compare with None using 'is' / 'is not'" });
    }

    if (lang && C_LIKE.includes(lang) && /\b(if|while)\s*\((?:[^()=!<>]|\([^()]*\))*[^=!<>]=[^=](?:[^()]|\([^()]*\))*\)/.test(cleanLine)) {
      issues.push({ line: n, severity: 'warning', message: "Assignment '=' inside a condition; did you mean '=='?" });
    }

    if (/[ \t]+$/.test(raw)) issues.push({ line: n, severity: 'info', message: 'Trailing whitespace' });
    if (raw.length > LINE_LIMIT) issues.push({ line: n, severity: 'info', message: `Line is ${raw.length} characters (over ${LINE_LIMIT})` });
    if (/\b(TODO|FIXME|XXX)\b/.test(raw)) issues.push({ line: n, severity: 'info', message: `${/\b(TODO|FIXME|XXX)\b/.exec(raw)![1]} left in the code` });
  });

  return issues.sort((a, b) => a.line - b.line || (a.severity === 'warning' ? -1 : 1));
}
