import { describe, expect, it } from 'vitest';
import { ANSWER_LENGTHS, buildSystemPrompt, resolveInstructions, spotlightUserContent } from './prompt';
import type { AIPersona } from '../../types';

const persona = (id: string, systemPrompt: string) => ({ id, systemPrompt }) as AIPersona;
const personas = [persona('space', 'You are a space specialist.'), persona('coder', 'You are an architect.')];

describe('system prompt (§4)', () => {
  it('puts the platform rules above the persona and ends with the length rule', () => {
    const prompt = buildSystemPrompt({ instructions: 'You are a space specialist.', length: 'concise' });
    expect(prompt.startsWith('You are the EgSA AI assistant')).toBe(true);
    expect(prompt.indexOf('space specialist')).toBeGreaterThan(prompt.indexOf('<user_content>'));
    expect(prompt.endsWith(ANSWER_LENGTHS.concise.line)).toBe(true);
  });

  it('defaults to the balanced length', () => {
    expect(buildSystemPrompt({}).endsWith(ANSWER_LENGTHS.balanced.line)).toBe(true);
  });

  it('resolves the persona live, so changing it reaches existing conversations (D8)', () => {
    expect(resolveInstructions(personas, 'coder')).toBe('You are an architect.');
    // A conversation's own instructions win.
    expect(resolveInstructions(personas, 'coder', 'Only answer in Arabic.')).toBe('Only answer in Arabic.');
    // Unknown persona falls back to the first one.
    expect(resolveInstructions(personas, 'gone')).toBe('You are a space specialist.');
  });
});

describe('pasted-content spotlighting (§4)', () => {
  it('wraps long pasted material as data, leaves ordinary questions alone', () => {
    expect(spotlightUserContent('What is the ADCS safe mode?')).toBe('What is the ADCS safe mode?');
    const long = 'x'.repeat(1500);
    expect(spotlightUserContent(long)).toBe(`<user_content>\n${long}\n</user_content>`);
  });
});
