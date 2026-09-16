import type { LLMProvider } from './base';
import { MockLLMProvider } from './mockProvider';
import { CustomAPIProvider } from './apiProvider';
import type { AIConfiguration } from '../../types';

class ProviderRegistry {
  private providers = new Map<string, LLMProvider>();

  constructor() {
    this.register(new MockLLMProvider());
  }

  register(provider: LLMProvider) {
    this.providers.set(provider.id, provider);
  }

  get(id: string): LLMProvider | undefined {
    return this.providers.get(id);
  }

  getActiveProvider(config: AIConfiguration): LLMProvider {
    if (config.providerType === 'custom-api' || config.providerType === 'openai-compatible') {
      if (config.customEndpointUrl) {
        return new CustomAPIProvider({
          endpointUrl: config.customEndpointUrl,
          apiKey: config.apiKey,
        });
      }
    }
    return this.providers.get('mock') || new MockLLMProvider();
  }
}

export const providerRegistry = new ProviderRegistry();
