import { describe, expect, it } from 'vitest';
import { createThinkSplitter } from './reasoning';

const feed = (chunks: string[]) => {
  const splitter = createThinkSplitter();
  let content = '';
  let reasoning = '';
  for (const c of chunks) {
    const out = splitter.push(c);
    content += out.content;
    reasoning += out.reasoning;
  }
  const rest = splitter.flush();
  return { content: content + rest.content, reasoning: reasoning + rest.reasoning };
};

describe('inline <think> splitting (§6)', () => {
  it('leaves an ordinary answer alone', () => {
    expect(feed(['Telemetry ', 'is nominal.'])).toEqual({ content: 'Telemetry is nominal.', reasoning: '' });
  });

  it('separates a complete think block from the answer', () => {
    expect(feed(['<think>weighing options</think>The answer.'])).toEqual({
      content: 'The answer.',
      reasoning: 'weighing options',
    });
  });

  it('handles a tag split across chunk boundaries', () => {
    expect(feed(['<thi', 'nk>step one', ' step two</th', 'ink>Done.'])).toEqual({
      content: 'Done.',
      reasoning: 'step one step two',
    });
  });

  it('treats an unclosed block as reasoning, so it never leaks into the answer', () => {
    expect(feed(['before <think>still going'])).toEqual({ content: 'before ', reasoning: 'still going' });
  });
});
