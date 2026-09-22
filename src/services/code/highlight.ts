import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import java from 'highlight.js/lib/languages/java';
import matlab from 'highlight.js/lib/languages/matlab';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import { resolveLanguage, type CodeLanguage } from './languages';

// Syntax highlighting for code blocks in answers (plan: agent/CODE_BLOCKS_PLAN.md). Only the
// languages the pilot needs are registered, keeping the bundle small; everything ships with the app
// (no CDN), so it works offline (CHAT-003).
// Loaded on demand by CodeBlock (dynamic import), so highlight.js isn't in the main bundle.
const LANGUAGES = { python, c, cpp, typescript, javascript, java, matlab, sql, bash, json };
for (const [name, def] of Object.entries(LANGUAGES)) hljs.registerLanguage(name, def);

/**
 * Highlighted HTML for `code` (highlight.js escapes the input). Unlabelled blocks are auto-detected
 * among the registered languages; unknown labels fall back to plain escaped text.
 */
export function highlightCode(code: string, label: string | undefined): { html: string; language: CodeLanguage | undefined } {
  const lang = resolveLanguage(label);
  if (lang) return { html: hljs.highlight(code, { language: lang, ignoreIllegals: true }).value, language: lang };
  if (label?.trim()) return { html: escapeHtml(code), language: undefined };
  const auto = hljs.highlightAuto(code, Object.keys(LANGUAGES));
  return { html: auto.value, language: (auto.language as CodeLanguage | undefined) ?? undefined };
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
