import type { LLMProvider } from './base';
import type { LLMRequestParams, StreamChunk, TokenStats } from '../../types';

export interface APIProviderOptions {
  endpointUrl: string;
  apiKey?: string;
  modelId?: string;
  useProxy?: boolean;
  customHeaders?: Record<string, string>;
}

export interface ConnectionTestResult {
  ok: boolean;
  status?: number;
  latencyMs?: number;
  message: string;
  modelUsed?: string;
}

/**
 * Normalizes user-input endpoint URLs:
 * - Trims trailing slashes
 * - Automatically resolves missing `/v1/chat/completions` or `/chat/completions`
 */
export function normalizeEndpointUrl(url: string): string {
  const clean = url.trim().replace(/\/+$/, '');
  if (!clean) return '';

  // If already ends in standard chat completion paths or Ollama native chat, keep it
  if (
    clean.endsWith('/chat/completions') ||
    clean.endsWith('/api/chat') ||
    clean.endsWith('/completions')
  ) {
    return clean;
  }

  // Bare domain or port (e.g. http://localhost:11434, http://localhost:1234)
  if (/:\d{4,5}$/.test(clean)) {
    return `${clean}/v1/chat/completions`;
  }

  // If ends in /v1, append /chat/completions
  if (clean.endsWith('/v1')) {
    return `${clean}/chat/completions`;
  }

  // DeepSeek root
  if (clean === 'https://api.deepseek.com') {
    return `${clean}/chat/completions`;
  }

  // Default to standard OpenAI chat completions endpoint
  return `${clean}/chat/completions`;
}

/**
 * Resolves request URL, routing through dev server proxy if requested.
 * Note: Does not mutate the path of targetUrl so both chat and models endpoints are respected.
 */
export function resolveRequestUrl(targetUrl: string, useProxy?: boolean): string {
  if (useProxy && typeof window !== 'undefined') {
    return `/api/ai-proxy?target=${encodeURIComponent(targetUrl)}`;
  }
  return targetUrl;
}

/**
 * Builds prioritized candidate URLs for live model discovery based on provider conventions.
 */
export function buildModelCandidateUrls(rawUrl: string): string[] {
  const clean = rawUrl.trim().replace(/\/+$/, '');
  if (!clean) return [];

  const candidates: string[] = [];

  // If user entered a chat completions endpoint (e.g. .../v1/chat/completions or .../chat/completions)
  if (clean.includes('/chat/completions')) {
    candidates.push(clean.replace(/\/chat\/completions.*$/, '/models'));
  } else if (clean.includes('/completions')) {
    candidates.push(clean.replace(/\/completions.*$/, '/models'));
  }

  // If ends in /v1
  if (clean.endsWith('/v1')) {
    candidates.push(`${clean}/models`);
  }

  try {
    const parsed = new URL(clean);
    const origin = parsed.origin;

    // Ollama detection (port 11434 or hostname containing ollama)
    if (parsed.port === '11434' || parsed.hostname.includes('ollama')) {
      candidates.push(`${origin}/api/tags`);
      candidates.push(`${origin}/v1/models`);
    }

    // Groq detection
    if (parsed.hostname.includes('groq.com')) {
      candidates.push(`${origin}/openai/v1/models`);
    }

    // OpenRouter detection
    if (parsed.hostname.includes('openrouter.ai')) {
      candidates.push(`${origin}/api/v1/models`);
    }

    // DeepSeek detection
    if (parsed.hostname.includes('deepseek.com')) {
      candidates.push(`${origin}/models`);
      candidates.push(`${origin}/v1/models`);
    }

    // LM Studio or local port 1234
    if (parsed.port === '1234') {
      candidates.push(`${origin}/v1/models`);
      candidates.push(`${origin}/models`);
    }

    // General common fallbacks
    candidates.push(`${origin}/v1/models`);
    candidates.push(`${origin}/api/v1/models`);
    candidates.push(`${origin}/openai/v1/models`);
    candidates.push(`${origin}/models`);
    candidates.push(`${origin}/api/tags`);
  } catch {
    candidates.push(clean.replace(/\/chat\/completions.*$/, '/models'));
    candidates.push(`${clean}/models`);
    candidates.push(`${clean}/v1/models`);
  }

  return Array.from(new Set(candidates)).filter(Boolean);
}

/**
 * Fetches the live list of available models directly from the provider's endpoint
 */
export async function fetchAvailableModels(options: {
  endpointUrl: string;
  apiKey?: string;
  useProxy?: boolean;
}): Promise<{ ok: boolean; models: string[]; error?: string }> {
  const rawUrl = options.endpointUrl.trim().replace(/\/+$/, '');
  if (!rawUrl) {
    return { ok: false, models: [], error: 'Please enter an endpoint URL first.' };
  }

  const candidateUrls = buildModelCandidateUrls(rawUrl);
  let lastError = '';
  let authError = '';

  for (const candidate of candidateUrls) {
    try {
      const target = resolveRequestUrl(candidate, options.useProxy);
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (options.apiKey?.trim()) {
        headers['Authorization'] = `Bearer ${options.apiKey.trim()}`;
        headers['x-api-key'] = options.apiKey.trim();
        headers['api-key'] = options.apiKey.trim();
      }
      if (candidate.includes('openrouter.ai') && typeof window !== 'undefined') {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'EgSA AI Platform';
      }
      if (candidate.includes('anthropic.com')) {
        headers['anthropic-version'] = '2023-06-01';
      }

      const res = await fetch(target, { method: 'GET', headers });
      if (!res.ok) {
        let errText = '';
        try {
          const json = await res.json();
          errText = json.error?.message || json.message || '';
        } catch {
          errText = await res.text().catch(() => '');
        }

        if (res.status === 401 || res.status === 403) {
          authError = `HTTP ${res.status}: ${errText || 'Authentication required'}. Please enter your API Key below to retrieve models.`;
        }
        lastError = `HTTP ${res.status}: ${errText || res.statusText}`;
        continue;
      }

      const json = await res.json();
      let modelList: string[] = [];

      // Standard OpenAI / OpenRouter format: { data: [{ id: "..." }, ...] }
      if (Array.isArray(json.data)) {
        modelList = json.data
          .map((m: any) => (typeof m === 'string' ? m : m.id || m.name || m.model))
          .filter(Boolean);
      }
      // Ollama format: { models: [{ name: "..." }, ...] }
      else if (Array.isArray(json.models)) {
        modelList = json.models
          .map((m: any) => (typeof m === 'string' ? m : m.name || m.model || m.id))
          .filter(Boolean);
      }
      // Cloudflare / Azure format: { result: [{ id: "..." }, ...] }
      else if (Array.isArray(json.result)) {
        modelList = json.result
          .map((m: any) => (typeof m === 'string' ? m : m.id || m.name || m.model))
          .filter(Boolean);
      }
      // Flat array
      else if (Array.isArray(json)) {
        modelList = json
          .map((m: any) => (typeof m === 'string' ? m : m.id || m.name || m.model))
          .filter(Boolean);
      }

      if (modelList.length > 0) {
        modelList.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
        return { ok: true, models: modelList };
      }
    } catch (err: any) {
      lastError = err.message || 'Network request failed';
    }
  }

  return {
    ok: false,
    models: [],
    error: authError || lastError || 'Could not retrieve models from endpoint. Verify the URL and API key.',
  };
}

/**
 * Probes the target LLM endpoint with diagnostic feedback on latency, HTTP status, and error messages
 */
export async function testEndpointConnection(options: {
  endpointUrl: string;
  apiKey?: string;
  modelId?: string;
  useProxy?: boolean;
}): Promise<ConnectionTestResult> {
  const normalizedUrl = normalizeEndpointUrl(options.endpointUrl);
  if (!normalizedUrl) {
    return { ok: false, message: 'Please enter an endpoint URL.' };
  }

  let targetModel = options.modelId?.trim();
  if (!targetModel) {
    const fetched = await fetchAvailableModels({
      endpointUrl: options.endpointUrl,
      apiKey: options.apiKey,
      useProxy: options.useProxy,
    });
    if (fetched.ok && fetched.models.length > 0) {
      targetModel = fetched.models[0];
    } else {
      targetModel = 'gpt-4o-mini';
    }
  }
  const startTime = Date.now();

  const runProbe = async (url: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options.apiKey?.trim()) {
      headers['Authorization'] = `Bearer ${options.apiKey.trim()}`;
    }
    if (normalizedUrl.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'EgSA AI Platform';
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: targetModel,
        messages: [{ role: 'user', content: 'Ping' }],
        max_tokens: 5,
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (res.ok) {
      return {
        ok: true,
        status: res.status,
        latencyMs,
        message: `Connected successfully (${latencyMs}ms)`,
        modelUsed: targetModel,
      };
    }

    let errorDetail = '';
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.error?.message || errorJson.message || JSON.stringify(errorJson);
    } catch {
      errorDetail = await res.text().catch(() => '');
    }

    let userMessage = `HTTP ${res.status}: `;
    if (res.status === 401) {
      userMessage += errorDetail || 'Unauthorized. Please check your API key.';
    } else if (res.status === 404) {
      userMessage += errorDetail || `Not Found. Either model '${targetModel}' or endpoint URL is invalid.`;
    } else if (res.status === 429) {
      userMessage += errorDetail || 'Rate limit or quota exceeded for this API key.';
    } else {
      userMessage += errorDetail || res.statusText || 'Request rejected by server.';
    }

    return {
      ok: false,
      status: res.status,
      latencyMs,
      message: userMessage,
      modelUsed: targetModel,
    };
  };

  const initialUrl = resolveRequestUrl(normalizedUrl, options.useProxy);
  try {
    return await runProbe(initialUrl);
  } catch (err: any) {
    if (!options.useProxy) {
      try {
        const proxyUrl = resolveRequestUrl(normalizedUrl, true);
        const proxyResult = await runProbe(proxyUrl);
        if (proxyResult.ok) {
          return {
            ...proxyResult,
            message: `${proxyResult.message} (via CORS Dev Proxy)`,
          };
        }
      } catch {
        // Fall back to reporting original network error
      }
    }

    const isLikelyCORS = err.message?.includes('Failed to fetch') || err.name === 'TypeError';
    const msg = isLikelyCORS
      ? `Connection blocked (CORS / Network). Enable "Bypass CORS / Dev Proxy" or ensure server allows origin ${window.location.origin}.`
      : `Network Error: ${err.message || 'Unable to reach host'}`;

    return {
      ok: false,
      latencyMs: Date.now() - startTime,
      message: msg,
      modelUsed: targetModel,
    };
  }
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

        if (this.options.apiKey?.trim()) {
          headers['Authorization'] = `Bearer ${this.options.apiKey.trim()}`;
        }

        const normalizedUrl = normalizeEndpointUrl(this.options.endpointUrl);
        if (normalizedUrl.includes('openrouter.ai') && typeof window !== 'undefined') {
          headers['HTTP-Referer'] = window.location.origin;
          headers['X-Title'] = 'EgSA AI Platform';
        }

        const effectiveModel =
          this.options.modelId?.trim() ||
          params.modelId ||
          'gpt-4o-mini';

        const body = JSON.stringify({
          model: effectiveModel,
          messages: params.messages,
          temperature: params.temperature ?? 0.7,
          max_tokens: params.maxTokens ?? 2048,
          stream: true,
        });

        const targetUrl = resolveRequestUrl(this.options.endpointUrl, this.options.useProxy);

        const response = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body,
          signal: controller.signal,
        });

        if (!response.ok) {
          let errorDetail = '';
          try {
            const errJson = await response.json();
            errorDetail = errJson.error?.message || errJson.message || JSON.stringify(errJson);
          } catch {
            errorDetail = await response.text().catch(() => '');
          }
          throw new Error(
            `API returned HTTP ${response.status} (${response.statusText}): ${errorDetail || 'Check endpoint or model ID'}`
          );
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
                const textChunk =
                  parsed.choices?.[0]?.delta?.content ||
                  parsed.choices?.[0]?.text ||
                  '';
                if (textChunk) {
                  accumulated += textChunk;
                  onChunk({ content: textChunk, done: false });
                }
              } catch {
                // Ignore JSON parse errors on partial chunk boundaries
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

