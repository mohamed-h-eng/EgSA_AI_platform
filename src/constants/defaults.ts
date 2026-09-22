import type {
  FeedbackReason,
  ModelProfile,
  AIPersona,
  UserPreferences,
  AIConfiguration,
  ProjectDefinition,
  KnowledgeDocument,
  DocumentType,
  ApprovalStatus,
  DocumentClassification,
  KnowledgeDepth,
} from '../types';

// CHAT-006 seeds: one general and one coding profile on the platform endpoint. Model names are
// left empty on purpose until the pilot models are chosen; an admin fills them in under
// Settings → Models (empty = the endpoint's default model, or demo mode with no endpoint).
export const DEFAULT_MODEL_PROFILES: ModelProfile[] = [
  {
    id: 'general',
    name: 'General assistant',
    role: 'general',
    modelId: '',
    description: 'Everyday questions, writing, and engineering explanations.',
    isDefault: true,
  },
  {
    id: 'coding',
    name: 'Coding assistant',
    role: 'coding',
    modelId: '',
    description: 'Code generation, review, and debugging.',
    isDefault: true,
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
    temperature: 0.3,
    category: 'space',
    starterPrompts: [
      'Show telemetry status for our low Earth orbit satellite',
      'Explain ADCS reaction wheel desaturation maneuvers',
      'ما هي أحدث مهام وكالة الفضاء المصرية في مراقبة الأرض وتطوير الأقمار الصناعية؟',
    ],
  },
  {
    id: 'software-architect',
    name: 'Senior Software Architect',
    avatar: '💻',
    tagline: 'Scalable system design, React, distributed systems',
    description: 'Disciplined engineering mentor focused on production-grade modularity, clean architecture, performance, and maintainability.',
    systemPrompt: 'You are a pragmatic, senior software architect. Provide clear, modular code examples with architectural rationale, trade-offs, and maintainability best practices.',
    temperature: 0.2,
    category: 'engineering',
    starterPrompts: [
      'Design a scalable state management architecture for a real-time app',
      'Write a CRC-16 function in C for telemetry frames',
      'Review this Python telemetry filter for bugs',
    ],
  },
  {
    id: 'general-assistant',
    name: 'Cosmic Assistant',
    avatar: '✨',
    tagline: 'Concise, articulate, general intelligence',
    description: 'Everyday helpful assistant capable of summarizing, brainstorming, coding, and answering general questions clearly.',
    systemPrompt: 'You are an articulate, friendly, and precise AI assistant. Format your answers cleanly with Markdown, bullet points, and code snippets where helpful.',
    temperature: 0.7,
    category: 'general',
    starterPrompts: [
      'Give me an overview of modern web design principles',
      'How does streaming HTTP chunked transfer encoding work?',
      'اشرح لي بلغة بسيطة كيفية عمل مدارات الأقمار الصناعية المتزامنة مع الشمس',
    ],
  },
  {
    id: 'data-scientist',
    name: 'Data & ML Scientist',
    avatar: '📊',
    tagline: 'Python, statistical modeling, neural networks',
    description: 'Analytical partner specializing in data pipelines, machine learning models, telemetry anomalies, and mathematical logic.',
    systemPrompt: 'You are a meticulous Data Scientist. Explain analytical methods clearly and provide production-ready Python or SQL scripts when requested.',
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
  statusCompanion: true,
  sendOnEnter: true,
  textDirection: 'auto',
  arabicFont: 'ibm-plex',
};

export interface ProviderPreset {
  id: string;
  name: string;
  badge: string;
  endpointUrl: string;
  placeholderKey: string;
  keyHelp: string;
  requiresKey: boolean;
  notes: string;
}

// Local-only presets (CHAT-002 local models, CHAT-003 no Internet). The EgSA gateway goes under Custom.
export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    badge: 'Local Offline',
    endpointUrl: 'http://localhost:11434/v1/chat/completions',
    placeholderKey: 'Optional (e.g. ollama)',
    keyHelp: 'No API key required by default for local Ollama.',
    requiresKey: false,
    notes: 'Local Ollama server. Retrieves models installed via `ollama pull`.',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio (Local)',
    badge: 'Local GUI',
    endpointUrl: 'http://localhost:1234/v1/chat/completions',
    placeholderKey: 'Not required',
    keyHelp: 'Start the Local Server tab inside LM Studio.',
    requiresKey: false,
    notes: 'Local server running on port 1234 with OpenAI-compatible API.',
  },
  {
    id: 'custom',
    name: 'EgSA Gateway / Custom',
    badge: 'On-premises',
    endpointUrl: '',
    placeholderKey: 'Bearer token or API key',
    keyHelp: 'The EgSA gateway or any OpenAI-compatible server on the local network.',
    requiresKey: false,
    notes: 'Any OpenAI-compatible `/v1/chat/completions` endpoint on the EgSA network.',
  },
];

export const DEFAULT_AI_CONFIG: AIConfiguration = {
  activePersonaId: 'space-specialist',
  systemPrompt: DEFAULT_PERSONAS[0].systemPrompt,
  temperature: 0.4,
  maxTokens: 2048,
  historyLimit: 30,
  streamResponse: true,
  providerType: 'mock',
  customEndpointUrl: '',
  apiKey: '',
  customModelId: '',
  providerPreset: 'ollama',
  useProxy: true,
};

// --- Engineering Knowledge Copilot: pilot projects & document metadata (Spec Section 12.2) ---

export const DOCUMENT_TYPE_OPTIONS: DocumentType[] = ['TRS', 'SRS', 'ICD', 'Design', 'Test', 'Report', 'Other'];

export const APPROVAL_STATUS_OPTIONS: ApprovalStatus[] = ['Draft', 'In Review', 'Approved', 'Obsolete'];

export const CLASSIFICATION_OPTIONS: DocumentClassification[] = [
  'Public',
  'Internal',
  'Project Restricted',
  'Confidential',
];

// Knowledge Copilot empty-state suggestions. The first two hit the indexed seed ADCS SRS; the deep
// one also asks about the EPS ICD, which is only answerable once it is indexed, so it shows the
// per-sub-question "Not covered" path (KB-011) until then.
export const KNOWLEDGE_SUGGESTIONS: Array<{ question: string; depth: KnowledgeDepth }> = [
  { question: 'What is the ADCS pointing accuracy requirement?', depth: 'quick' },
  { question: 'How does the ADCS detumble after separation?', depth: 'quick' },
  { question: 'What are the ADCS safe mode rules and the EPS primary bus voltage?', depth: 'deep' },
];

export const DEFAULT_PROJECTS: ProjectDefinition[] = [
  {
    id: 'orbit-1-sat',
    name: 'Orbit-1 Satellite Platform',
    subsystems: ['ADCS', 'Power (EPS)', 'Communications', 'Thermal', 'Structure', 'On-Board Computer'],
  },
  {
    id: 'ground-segment',
    name: 'Ground Segment',
    subsystems: ['Mission Control', 'Telemetry & Command', 'Data Processing'],
  },
];

// Seed rows so the Knowledge Base admin view has representative content before real
// ingestion (KB-001..KB-005) is wired up. Replace with API-loaded documents once
// GET /api/documents exists.
export const DEFAULT_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: 'seed-adcs-srs',
    title: 'ADCS Software Requirements Specification',
    fileName: 'ADCS_SRS_RevC.pdf',
    fileSizeBytes: 2_150_000,
    project: 'orbit-1-sat',
    subsystem: 'ADCS',
    documentId: 'EGSA-ADCS-SRS-001',
    revision: 'C',
    documentType: 'SRS',
    approvalStatus: 'Approved',
    classification: 'Project Restricted',
    pageCount: 84,
    status: 'indexed',
    uploadedAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    indexedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'seed-eps-icd',
    title: 'Power Subsystem Interface Control Document',
    fileName: 'EPS_ICD_RevA.pdf',
    fileSizeBytes: 980_000,
    project: 'orbit-1-sat',
    subsystem: 'Power (EPS)',
    documentId: 'EGSA-EPS-ICD-002',
    revision: 'A',
    documentType: 'ICD',
    approvalStatus: 'In Review',
    classification: 'Internal',
    pageCount: 36,
    status: 'indexing',
    uploadedAt: Date.now() - 2 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    id: 'seed-comms-test',
    title: 'Communications Subsystem Test Report',
    fileName: 'COMMS_TestReport_RevB.scan.pdf',
    fileSizeBytes: 4_400_000,
    project: 'orbit-1-sat',
    subsystem: 'Communications',
    documentId: 'EGSA-COMMS-TR-014',
    revision: 'B',
    documentType: 'Test',
    approvalStatus: 'Approved',
    classification: 'Internal',
    status: 'error',
    errorMessage: 'OCR quality too low to index reliably — scanned document needs re-submission.',
    uploadedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
];


// Answer feedback reasons (thumbs down), in display order.
export const FEEDBACK_REASONS: Array<{ id: FeedbackReason; label: string; copilotOnly?: boolean }> = [
  { id: 'inaccurate', label: 'Inaccurate' },
  { id: 'wrong-source', label: 'Wrong source', copilotOnly: true },
  { id: 'not-relevant', label: 'Not relevant' },
  { id: 'incomplete', label: 'Incomplete' },
  { id: 'unclear', label: 'Unclear' },
];
