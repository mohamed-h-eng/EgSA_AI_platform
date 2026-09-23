// Reasoning models (plan: PROMPTING_CONTEXT_PLAN.md §6).
//
// DeepSeek-R1, Qwen3 and others either stream their thinking in a separate field
// (delta.reasoning / delta.reasoning_content) or inline it in the answer inside <think>…</think>.
// Either way it is kept apart from the answer: shown collapsed, never copied, and never sent back
// as history (it wastes context and makes answers ramble).

const OPEN = '<think>';
const CLOSE = '</think>';

export interface SplitChunk {
  content: string;
  reasoning: string;
}

/**
 * Splits inline <think> blocks out of a stream, across chunk boundaries. A tag can arrive split in
 * two ("<thi" then "nk>"), so a partial tag at the end of a chunk is held back until the next one.
 */
export function createThinkSplitter() {
  let inside = false;
  let pending = '';

  const partialTagAt = (text: string, tag: string) => {
    const max = Math.min(tag.length - 1, text.length);
    for (let n = max; n > 0; n--) {
      if (text.slice(-n) === tag.slice(0, n)) return n;
    }
    return 0;
  };

  return {
    /** Feed one streamed chunk; returns the answer text and the reasoning text inside it. */
    push(chunk: string): SplitChunk {
      let text = pending + chunk;
      pending = '';
      let content = '';
      let reasoning = '';

      while (text) {
        const tag = inside ? CLOSE : OPEN;
        const at = text.indexOf(tag);
        if (at >= 0) {
          const before = text.slice(0, at);
          if (inside) reasoning += before;
          else content += before;
          inside = !inside;
          text = text.slice(at + tag.length);
          continue;
        }
        // No complete tag: hold back anything that could be the start of one.
        const held = partialTagAt(text, tag);
        const usable = held ? text.slice(0, -held) : text;
        pending = held ? text.slice(-held) : '';
        if (inside) reasoning += usable;
        else content += usable;
        break;
      }

      return { content, reasoning };
    },

    /** Whatever was held back at the end of the stream (an unclosed or partial tag). */
    flush(): SplitChunk {
      const rest = pending;
      pending = '';
      return inside ? { content: '', reasoning: rest } : { content: rest, reasoning: '' };
    },
  };
}
