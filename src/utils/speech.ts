const EXCERPT_CHARS = 300;

/** Plain-text start of an answer for screen readers: Markdown symbols and [n] markers removed. */
export function speakableExcerpt(markdown: string, max = EXCERPT_CHARS): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' (code) ')
    .replace(/\[(\d+)\]/g, '')
    .replace(/[#*_>`|~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, '')}…` : text;
}
