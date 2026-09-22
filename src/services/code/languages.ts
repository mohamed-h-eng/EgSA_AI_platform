// Languages the code blocks support (highlighting + checks). Kept free of highlight.js so it can be
// imported eagerly; the highlighter itself (highlight.ts) is loaded on demand.
export const CODE_LANGUAGES = ['python', 'c', 'cpp', 'typescript', 'javascript', 'java', 'matlab', 'sql', 'bash', 'json'] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

const ALIASES: Record<string, CodeLanguage> = {
  py: 'python',
  python3: 'python',
  h: 'c',
  'c++': 'cpp',
  cc: 'cpp',
  hpp: 'cpp',
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  m: 'matlab',
  octave: 'matlab',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  console: 'bash',
  postgresql: 'sql',
  mysql: 'sql',
  jsonc: 'json',
};

const DISPLAY: Record<CodeLanguage, string> = {
  python: 'Python',
  c: 'C',
  cpp: 'C++',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  java: 'Java',
  matlab: 'MATLAB',
  sql: 'SQL',
  bash: 'Bash',
  json: 'JSON',
};

/** Normalises a fence label ("py", "C++", "ts") to a supported language, or undefined. */
export function resolveLanguage(label: string | undefined): CodeLanguage | undefined {
  const key = (label || '').trim().toLowerCase();
  if (!key) return undefined;
  if ((CODE_LANGUAGES as readonly string[]).includes(key)) return key as CodeLanguage;
  return ALIASES[key];
}

export const languageDisplayName = (lang: CodeLanguage | undefined, label?: string) => (lang ? DISPLAY[lang] : label || 'Code');
