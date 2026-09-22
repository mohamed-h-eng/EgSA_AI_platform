import type { LLMProvider } from './base';
import { MockLLMProvider } from './mockProvider';
import { CustomAPIProvider } from './apiProvider';
import type { AIConfiguration } from '../../types';
import type { ModelTarget } from './modelProfiles';

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

  // The target comes from the conversation's model profile (resolveModelTarget, CHAT-006);
  // credentials and proxy settings come from the platform configuration.
  getProvider(target: ModelTarget, config: AIConfiguration): LLMProvider {
    if (target.mode === 'live') {
      return new CustomAPIProvider({
        endpointUrl: target.endpointUrl,
        apiKey: config.apiKey,
        modelId: target.modelId,
        useProxy: config.useProxy ?? false,
      });
    }
    return this.providers.get('mock') || new MockLLMProvider();
  }
}

export const providerRegistry = new ProviderRegistry();
