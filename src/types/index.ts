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
  /** CHAT-009: profile that produced this answer. */
  profileName?: string;
  /** The user stopped this answer while it was being written. */
  stopped?: boolean;
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
  /** CHAT-006: model profile this conversation uses. Missing on older sessions = default general. */
  profileId?: string;
  /** Legacy (pre-profiles) model label; kept so old exports still read. */
  modelId?: string;
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
  temperature: number;
  starterPrompts: string[];
  category: 'general' | 'engineering' | 'space' | 'analysis' | 'creative';
}

// CHAT-006: an admin-managed pairing of role + model (+ optional endpoint). Conversations pick a
// profile; the runtime model name lives here, not in the UI. Shape proposed for GET /api/models.
export type ModelRole = 'general' | 'coding';

export interface ModelProfile {
  id: string;
  name: string;
  role: ModelRole;
  /** Model name the runtime knows (e.g. "qwen2.5:14b"). Empty = the endpoint's default model. */
  modelId: string;
  /** Empty = the platform endpoint configured in Engine & API. */
  endpointUrl?: string;
  description?: string;
  /** Exactly one default per role. */
  isDefault?: boolean;
  /**
   * Who keeps the conversation history: 'app' sends a cleaned history with each request (needed for
   * stateless OpenAI-compatible endpoints); 'server' sends only the new message plus conversation
   * and message ids, for a gateway that stores conversations. Default 'app'.
   */
  contextMode?: 'app' | 'server';
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
  /** Astronaut + model status docked above the message box while answers are produced (default on). */
  statusCompanion?: boolean;
  sendOnEnter: boolean;
  textDirection: TextDirection;
  arabicFont: ArabicFontOption;
}

export interface AIConfiguration {
  activePersonaId: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  /** Conversation memory: how many recent messages are sent to the model (0 = all). */
  historyLimit: number;
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
  /**
   * Server-managed context only (ModelProfile.contextMode 'server'): the gateway keeps the
   * conversation, so `messages` holds just the new question and these ids tell it where it goes.
   */
  conversation?: {
    conversationId: string;
    messageId: string;
    /** Retry / edit: the server should discard this message and everything after it first. */
    replacesMessageId?: string;
  };
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
  /** When the document was last indexed (source freshness). */
  indexedAt?: number;
  /** Retrieval relevance, 0–1 (the mock's term-match score; the backend's retrieval score later). */
  relevance?: number;
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
  pinned?: boolean;
}

export interface ProjectDefinition {
  id: string;
  name: string;
  subsystems: string[];
  // ADM-007: access switches. Undefined = enabled. Documents are never touched; access is
  // gated at query/list time so switching back on needs no re-indexing.
  disabled?: boolean;
  disabledSubsystems?: string[];
}

// ---------- Service health (ADM-005, NFR-OPS-005) ----------
// Also the shape proposed for the gateway's GET /api/health response.

export type ServiceStatus = 'operational' | 'degraded' | 'down' | 'unknown';

export interface ServiceHealth {
  id: string;
  name: string;
  status: ServiceStatus;
  /** Overrides the default status word, e.g. "Demo mode" or "Not connected". */
  statusLabel?: string;
  latencyMs?: number;
  detail: string;
  checkedAt: number;
}

export interface SystemHealthReport {
  overall: ServiceStatus;
  services: ServiceHealth[];
  checkedAt: number;
}

// ---------- Answer feedback (PRODUCTIVITY_UX_PLAN §2) ----------
// Also the shape proposed for POST /api/feedback; feeds the pilot evaluation report (D-14).

export type FeedbackRating = 'up' | 'down';
export type FeedbackReason = 'inaccurate' | 'wrong-source' | 'not-relevant' | 'incomplete' | 'unclear';

export interface AnswerFeedback {
  /** The rated answer: chat message id or Copilot turn id. */
  answerId: string;
  surface: 'chat' | 'copilot';
  rating: FeedbackRating;
  reasons: FeedbackReason[];
  comment?: string;
  question: string;
  answerExcerpt: string;
  /** Chat: profile · model. Copilot: depth · scope · grounding. */
  context: string;
  /** Copilot only: cited document ids. */
  sourceDocumentIds?: string[];
  createdAt: number;
  updatedAt: number;
}
