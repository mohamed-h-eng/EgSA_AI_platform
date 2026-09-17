export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageStatus = 'sending' | 'streaming' | 'complete' | 'error';

export interface TokenStats {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
  charsPerSec?: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  status: MessageStatus;
  modelId?: string;
  stats?: TokenStats;
  error?: string;
}

export interface ConversationSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  pinned?: boolean;
  modelId: string;
  personaId?: string;
  systemPrompt?: string;
  temperature?: number;
}

export interface AIPersona {
  id: string;
  name: string;
  avatar: string;
  tagline: string;
  description: string;
  systemPrompt: string;
  defaultModelId: string;
  temperature: number;
  starterPrompts: string[];
  category: 'general' | 'engineering' | 'space' | 'analysis' | 'creative';
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'mock' | 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'egsa-custom';
  contextWindow: string;
  description: string;
  badge?: string;
  isAvailable: boolean;
}

export type ThemeMode = 'system' | 'light' | 'dark';
export type FontSizeOption = 'sm' | 'md' | 'lg';
export type ChatDensity = 'comfortable' | 'compact';
export type BubbleStyle = 'modern' | 'minimal' | 'bordered';

export interface UserPreferences {
  theme: ThemeMode;
  customAccentColor?: string;
  fontSize: FontSizeOption;
  chatDensity: ChatDensity;
  bubbleStyle: BubbleStyle;
  soundEffects: boolean;
  autoScroll: boolean;
  sendOnEnter: boolean;
}

export interface AIConfiguration {
  activeModelId: string;
  activePersonaId: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  streamResponse: boolean;
  providerType: 'mock' | 'custom-api' | 'openai-compatible';
  customEndpointUrl?: string;
  apiKey?: string;
  customModelId?: string;
  providerPreset?: string;
  useProxy?: boolean;
}

export interface StreamChunk {
  content: string;
  done: boolean;
  stats?: TokenStats;
}

export interface LLMRequestParams {
  messages: Array<{ role: MessageRole; content: string }>;
  modelId: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}
