import { describe, expect, it } from 'vitest';
import { normalizeEndpointUrl } from './apiProvider';

describe('normalizeEndpointUrl', () => {
  it('adds the OpenAI-compatible path to a bare host:port (Ollama, LM Studio)', () => {
    expect(normalizeEndpointUrl('http://localhost:11434')).toBe('http://localhost:11434/v1/chat/completions');
    expect(normalizeEndpointUrl(' http://10.0.0.5:1234/ ')).toBe('http://10.0.0.5:1234/v1/chat/completions');
  });

  it('completes a /v1 base URL', () => {
    expect(normalizeEndpointUrl('http://gpu-box:8000/v1')).toBe('http://gpu-box:8000/v1/chat/completions');
  });

  it('keeps URLs that already point at a chat endpoint', () => {
    expect(normalizeEndpointUrl('http://localhost:11434/api/chat')).toBe('http://localhost:11434/api/chat');
    expect(normalizeEndpointUrl('https://host/v1/chat/completions/')).toBe('https://host/v1/chat/completions');
  });

  it('returns an empty string for empty input', () => {
    expect(normalizeEndpointUrl('   ')).toBe('');
  });
});
