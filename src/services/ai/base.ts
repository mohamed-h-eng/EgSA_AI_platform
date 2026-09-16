import type { LLMRequestParams, StreamChunk } from '../../types';

export interface LLMProvider {
  id: string;
  name: string;
  generateStream(
    params: LLMRequestParams,
    onChunk: (chunk: StreamChunk) => void,
    onError: (error: Error) => void
  ): Promise<() => void>;
}
