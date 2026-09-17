import type { AIModel, AIPersona, UserPreferences, AIConfiguration } from '../types';

export const DEFAULT_MODELS: AIModel[] = [
  {
    id: 'egsa-space-intelligence',
    name: 'EgSA Orbit-1 AI',
    provider: 'egsa-custom',
    contextWindow: '128k tokens',
    description: 'Customized Egyptian Space Agency AI for orbital telemetry & remote sensing.',
    badge: 'Specialized',
    isAvailable: true,
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: '200k tokens',
    description: 'State-of-the-art coding, architecture, and multi-step reasoning.',
    badge: 'Flagship',
    isAvailable: true,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o Omnimodel',
    provider: 'openai',
    contextWindow: '128k tokens',
    description: 'Versatile multimodal model optimized for chat and data structuring.',
    isAvailable: true,
  },
  {
    id: 'gemini-2-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    contextWindow: '1M tokens',
    description: 'Extremely fast real-time streaming model with ultra-long context.',
    badge: 'Fast',
    isAvailable: true,
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3 (Reasoning)',
    provider: 'deepseek',
    contextWindow: '64k tokens',
    description: 'High efficiency open-weights model for code generation and mathematical analysis.',
    isAvailable: true,
  },
];

export const DEFAULT_PERSONAS: AIPersona[] = [
  {
    id: 'space-specialist',
    name: 'EgSA Space Specialist',
    avatar: '🛰️',
    tagline: 'Satellite telemetry, orbital mechanics, remote sensing',
    description: 'Expert assistant calibrated for Egyptian Space Agency mission operations, satellite telemetry review, and geospatial data processing.',
    systemPrompt: 'You are an advanced AI specialist at the Egyptian Space Agency (EgSA). You provide precise, rigorous technical answers on satellite subsystems, orbital mechanics, remote sensing payloads, and space engineering.',
    defaultModelId: 'egsa-space-intelligence',
    temperature: 0.3,
    category: 'space',
    starterPrompts: [
      'Show telemetry status for our low Earth orbit satellite',
      'Explain ADCS reaction wheel desaturation maneuvers',
      'How do we calibrate multispectral sensors against atmospheric scattering?',
    ],
  },
  {
    id: 'software-architect',
    name: 'Senior Software Architect',
    avatar: '💻',
    tagline: 'Scalable system design, React, distributed systems',
    description: 'Disciplined engineering mentor focused on production-grade modularity, clean architecture, performance, and maintainability.',
    systemPrompt: 'You are a pragmatic, senior software architect. Provide clear, modular code examples with architectural rationale, trade-offs, and maintainability best practices.',
    defaultModelId: 'claude-3-5-sonnet',
    temperature: 0.2,
    category: 'engineering',
    starterPrompts: [
      'Design a scalable state management architecture for a real-time app',
      'Review React performance bottlenecks in large data lists',
      'Provide a pluggable adapter pattern in TypeScript',
    ],
  },
  {
    id: 'general-assistant',
    name: 'Cosmic Assistant',
    avatar: '✨',
    tagline: 'Concise, articulate, general intelligence',
    description: 'Everyday helpful assistant capable of summarizing, brainstorming, coding, and answering general questions clearly.',
    systemPrompt: 'You are an articulate, friendly, and precise AI assistant. Format your answers cleanly with Markdown, bullet points, and code snippets where helpful.',
    defaultModelId: 'gemini-2-flash',
    temperature: 0.7,
    category: 'general',
    starterPrompts: [
      'Give me an overview of modern web design principles',
      'How does streaming HTTP chunked transfer encoding work?',
      'Help me draft a project architecture proposal',
    ],
  },
  {
    id: 'data-scientist',
    name: 'Data & ML Scientist',
    avatar: '📊',
    tagline: 'Python, statistical modeling, neural networks',
    description: 'Analytical partner specializing in data pipelines, machine learning models, telemetry anomalies, and mathematical logic.',
    systemPrompt: 'You are a meticulous Data Scientist. Explain analytical methods clearly and provide production-ready Python or SQL scripts when requested.',
    defaultModelId: 'deepseek-v3',
    temperature: 0.4,
    category: 'analysis',
    starterPrompts: [
      'Write an anomaly detection algorithm for time-series telemetry',
      'Compare PCA vs t-SNE for high-dimensional feature spaces',
      'Draft a Python script using pandas to parse streaming JSON lines',
    ],
  },
];

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  fontSize: 'md',
  chatDensity: 'comfortable',
  bubbleStyle: 'modern',
  soundEffects: false,
  autoScroll: true,
  sendOnEnter: true,
};

export interface ProviderPreset {
  id: string;
  name: string;
  badge: string;
  endpointUrl: string;
  defaultModel: string;
  popularModels: string[];
  placeholderKey: string;
  keyHelp: string;
  requiresKey: boolean;
  notes: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    badge: 'Cloud',
    endpointUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    popularModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'o1-mini'],
    placeholderKey: 'sk-proj-...',
    keyHelp: 'API Key from platform.openai.com/api-keys',
    requiresKey: true,
    notes: 'Official OpenAI Chat Completions endpoint.',
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    badge: 'Ultra Fast',
    endpointUrl: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'llama-3.3-70b-versatile',
    popularModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    placeholderKey: 'gsk_...',
    keyHelp: 'Free / high-speed API keys from console.groq.com',
    requiresKey: true,
    notes: 'Near-instant LPU inference. Compatible with OpenAI format.',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    badge: 'Local Offline',
    endpointUrl: 'http://localhost:11434/v1/chat/completions',
    defaultModel: 'llama3.2',
    popularModels: ['llama3.2', 'llama3', 'deepseek-r1:latest', 'mistral', 'qwen2.5', 'phi3'],
    placeholderKey: 'Optional (e.g. ollama)',
    keyHelp: 'No API key required by default for local Ollama.',
    requiresKey: false,
    notes: 'Ensure Ollama is running. For browser CORS, launch with OLLAMA_ORIGINS="*" or keep Proxy enabled.',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'Multi-Model',
    endpointUrl: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'openai/gpt-4o-mini',
    popularModels: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'deepseek/deepseek-chat', 'meta-llama/llama-3.3-70b-instruct'],
    placeholderKey: 'sk-or-v1-...',
    keyHelp: 'API Key from openrouter.ai/keys',
    requiresKey: true,
    notes: 'Single API key giving access to 200+ models with native CORS support.',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    badge: 'Reasoning',
    endpointUrl: 'https://api.deepseek.com/chat/completions',
    defaultModel: 'deepseek-chat',
    popularModels: ['deepseek-chat', 'deepseek-reasoner'],
    placeholderKey: 'sk-...',
    keyHelp: 'API Key from platform.deepseek.com',
    requiresKey: true,
    notes: 'High-intelligence DeepSeek V3 and R1 reasoning models.',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio (Local)',
    badge: 'Local GUI',
    endpointUrl: 'http://localhost:1234/v1/chat/completions',
    defaultModel: 'local-model',
    popularModels: ['local-model'],
    placeholderKey: 'Not required',
    keyHelp: 'Start the Local Server tab inside LM Studio.',
    requiresKey: false,
    notes: 'Local server running on port 1234 with OpenAI-compatible API.',
  },
  {
    id: 'custom',
    name: 'Custom Endpoint',
    badge: 'Custom',
    endpointUrl: '',
    defaultModel: '',
    popularModels: [],
    placeholderKey: 'Bearer token or API key',
    keyHelp: 'Any OpenAI-compatible server or proxy.',
    requiresKey: false,
    notes: 'Supports any custom `/v1/chat/completions` endpoint.',
  },
];

export const DEFAULT_AI_CONFIG: AIConfiguration = {
  activeModelId: 'egsa-space-intelligence',
  activePersonaId: 'space-specialist',
  systemPrompt: DEFAULT_PERSONAS[0].systemPrompt,
  temperature: 0.4,
  maxTokens: 2048,
  streamResponse: true,
  providerType: 'mock',
  customEndpointUrl: '',
  apiKey: '',
  customModelId: 'gpt-4o-mini',
  providerPreset: 'openai',
  useProxy: true,
};

