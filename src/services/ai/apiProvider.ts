import type { LLMProvider } from './base';
import type { LLMRequestParams, StreamChunk, TokenStats } from '../../types';

export interface APIProviderOptions {
  endpointUrl: string;
  apiKey?: string;
  customHeaders?: Record<string, string>;
}

export class CustomAPIProvider implements LLMProvider {
  id = 'custom-api';
  name = 'Custom Endpoint / OpenAI Compatible';
  private options: APIProviderOptions;

  constructor(options: APIProviderOptions) {
    this.options = options;
  }

  async generateStream(
    params: LLMRequestParams,
    onChunk: (chunk: StreamChunk) => void,
    onError: (error: Error) => void
  ): Promise<() => void> {
    const controller = new AbortController();
    const startTime = Date.now();
    let accumulated = '';

    const execute = async () => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...this.options.customHeaders,
        };

        if (this.options.apiKey) {
          headers['Authorization'] = `Bearer ${this.options.apiKey}`;
        }

        const body = JSON.stringify({
          model: params.modelId,
          messages: params.messages,
          temperature: params.temperature ?? 0.7,
          max_tokens: params.maxTokens ?? 2048,
          stream: true,
        });

        const response = await fetch(this.options.endpointUrl, {
          method: 'POST',
          headers,
          body,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`API returned HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('ReadableStream not supported in response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;

            if (trimmed === 'data: [DONE]') {
              const latencyMs = Date.now() - startTime;
              const stats: TokenStats = {
                completionTokens: Math.ceil(accumulated.length / 4),
                latencyMs,
              };
              onChunk({ content: '', done: true, stats });
              return;
            }

            if (trimmed.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const textChunk = parsed.choices?.[0]?.delta?.content || '';
                if (textChunk) {
                  accumulated += textChunk;
                  onChunk({ content: textChunk, done: false });
                }
              } catch {
                // Ignore parse errors on partial frames
              }
            }
          }
        }

        const latencyMs = Date.now() - startTime;
        onChunk({
          content: '',
          done: true,
          stats: {
            completionTokens: Math.ceil(accumulated.length / 4),
            latencyMs,
          },
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          onError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    };

    execute();

    return () => controller.abort();
  }
}
