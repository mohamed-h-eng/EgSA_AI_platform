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
  direction?: TextDirection;
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
export type TextDirection = 'auto' | 'ltr' | 'rtl';
export type ArabicFontOption = 'ibm-plex' | 'cairo' | 'readex' | 'system';

export interface UserPreferences {
  theme: ThemeMode;
  customAccentColor?: string;
  fontSize: FontSizeOption;
  chatDensity: ChatDensity;
  bubbleStyle: BubbleStyle;
  soundEffects: boolean;
  autoScroll: boolean;
  sendOnEnter: boolean;
  textDirection: TextDirection;
  arabicFont: ArabicFontOption;
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

// --- Engineering Knowledge Copilot: documents & citations (KB-*, ADM-* requirements) ---

export type DocumentType = 'TRS' | 'SRS' | 'ICD' | 'Design' | 'Test' | 'Report' | 'Other';

export type ApprovalStatus = 'Draft' | 'In Review' | 'Approved' | 'Obsolete';

export type DocumentClassification = 'Public' | 'Internal' | 'Project Restricted' | 'Confidential';

export type DocumentIndexStatus = 'pending' | 'indexing' | 'indexed' | 'error' | 'disabled';

export interface KnowledgeDocument {
  id: string;
  title: string;
  fileName: string;
  fileSizeBytes: number;
  project: string;
  subsystem?: string;
  documentId?: string;
  revision: string;
  documentType: DocumentType;
  approvalStatus?: ApprovalStatus;
  classification?: DocumentClassification;
  pageCount?: number;
  status: DocumentIndexStatus;
  disabledFromStatus?: DocumentIndexStatus;
  errorMessage?: string;
  uploadedAt: number;
  updatedAt: number;
  indexedAt?: number;
}

export interface SourceReference {
  documentId: string;
  documentTitle: string;
  revision: string;
  page: number;
  section?: string;
  requirementId?: string;
  excerpt?: string;
}

// --- Knowledge Copilot (KB-009..KB-012). Request/response mirror the planned POST /api/knowledge/query. ---

export type KnowledgeGrounding = 'grounded' | 'insufficient';

export type KnowledgeDepth = 'quick' | 'deep';

export interface KnowledgeScope {
  project?: string;
  subsystem?: string;
}

export interface ResearchStep {
  id: string;
  label: string;
  detail?: string;
  status: 'running' | 'done' | 'empty';
}

export interface KnowledgeQueryRequest {
  question: string;
  scope: KnowledgeScope;
  depth: KnowledgeDepth;
}

export interface KnowledgeQueryResponse {
  grounding: KnowledgeGrounding;
  answer: string;
  sources: SourceReference[];
  steps: ResearchStep[];
  searchedDocumentCount: number;
  consultedDocumentIds: string[];
  // Deep research: sub-questions the indexed documents could not support (KB-011 per sub-question).
  uncovered: string[];
}

export type KnowledgeTurnStatus = 'running' | 'complete' | 'stopped' | 'error';

export interface KnowledgeTurn {
  id: string;
  question: string;
  depth: KnowledgeDepth;
  scope: KnowledgeScope;
  createdAt: number;
  status: KnowledgeTurnStatus;
  answer: string;
  sources: SourceReference[];
  grounding?: KnowledgeGrounding;
  steps: ResearchStep[];
  consultedDocumentIds: string[];
  uncovered: string[];
  latencyMs?: number;
  error?: string;
}

export interface KnowledgeThread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  turns: KnowledgeTurn[];
}

export interface ProjectDefinition {
  id: string;
  name: string;
  subsystems: string[];
}
