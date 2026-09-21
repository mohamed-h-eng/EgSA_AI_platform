import { createStore } from './createStore';
import type { DocumentIndexStatus, DocumentType, ApprovalStatus, DocumentClassification, KnowledgeDocument, ProjectDefinition } from '../types';
import { DEFAULT_PROJECTS, DEFAULT_DOCUMENTS } from '../constants/defaults';

export interface UploadDocumentInput {
  fileName: string;
  fileSizeBytes: number;
  title: string;
  project: string;
  subsystem?: string;
  documentId?: string;
  revision: string;
  documentType: DocumentType;
  approvalStatus?: ApprovalStatus;
  classification?: DocumentClassification;
}

interface DocumentState {
  documents: KnowledgeDocument[];
  projects: ProjectDefinition[];
  isUploadModalOpen: boolean;
  isManagerOpen: boolean;
  isAdminMode: boolean;
  projectFilter: string;
  subsystemFilter: string;
  searchQuery: string;

  openUploadModal: () => void;
  closeUploadModal: () => void;
  openManager: () => void;
  closeManager: () => void;
  toggleAdminMode: () => void;
  setProjectFilter: (project: string) => void;
  setSubsystemFilter: (subsystem: string) => void;
  setSearchQuery: (query: string) => void;

  uploadDocument: (input: UploadDocumentInput) => string;
  reindexDocument: (id: string) => void;
  toggleDocumentEnabled: (id: string) => void;
  deleteDocument: (id: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

export const useDocumentStore = createStore<DocumentState>((set, get) => {
  // Simulates the async ingestion pipeline (KB-001..KB-005: parse -> chunk -> embed -> index)
  // entirely client-side until a real ingestion API/backend exists. Keeps the same document
  // shape and status transitions the real pipeline will use, so the manager UI plugs into
  // the real API later without changes (see EGSA_AI plan: item 7, backend gateway migration).
  const simulateIndexing = (id: string) => {
    setTimeout(() => {
      set((s) => ({
        documents: s.documents.map((d) => (d.id === id ? { ...d, status: 'indexing' as DocumentIndexStatus } : d)),
      }));
    }, 450);

    setTimeout(() => {
      const doc = get().documents.find((d) => d.id === id);
      if (!doc || doc.status === 'disabled') return;

      // Filenames ending in .scan.pdf simulate a poor-quality OCR scan failing ingestion,
      // so the error/status UI (ADM-004, KB data-quality rules) has something real to show.
      const shouldFail = doc.fileName.toLowerCase().endsWith('.scan.pdf');

      set((s) => ({
        documents: s.documents.map((d) => {
          if (d.id !== id) return d;
          if (shouldFail) {
            return {
              ...d,
              status: 'error' as DocumentIndexStatus,
              errorMessage: 'OCR quality too low to index reliably — scanned document needs re-submission.',
            };
          }
          return {
            ...d,
            status: 'indexed' as DocumentIndexStatus,
            indexedAt: Date.now(),
            pageCount: d.pageCount ?? Math.max(1, Math.round(d.fileSizeBytes / 45_000)),
          };
        }),
      }));
    }, 2000);
  };

  return {
    documents: DEFAULT_DOCUMENTS,
    projects: DEFAULT_PROJECTS,
    isUploadModalOpen: false,
    isManagerOpen: false,
    isAdminMode: true,
    projectFilter: '',
    subsystemFilter: '',
    searchQuery: '',

    openUploadModal: () => set({ isUploadModalOpen: true }),
    closeUploadModal: () => set({ isUploadModalOpen: false }),
    openManager: () => set({ isManagerOpen: true }),
    closeManager: () => set({ isManagerOpen: false }),
    toggleAdminMode: () => set((s) => ({ isAdminMode: !s.isAdminMode })),
    setProjectFilter: (projectFilter) => set({ projectFilter, subsystemFilter: '' }),
    setSubsystemFilter: (subsystemFilter) => set({ subsystemFilter }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),

    uploadDocument: (input) => {
      const id = generateId();
      const doc: KnowledgeDocument = {
        id,
        title: input.title.trim() || input.fileName,
        fileName: input.fileName,
        fileSizeBytes: input.fileSizeBytes,
        project: input.project,
        subsystem: input.subsystem,
        documentId: input.documentId,
        revision: input.revision,
        documentType: input.documentType,
        approvalStatus: input.approvalStatus,
        classification: input.classification,
        status: 'pending',
        uploadedAt: Date.now(),
        updatedAt: Date.now(),
      };

      set((s) => ({ documents: [doc, ...s.documents] }));
      simulateIndexing(id);
      return id;
    },

    reindexDocument: (id) => {
      set((s) => ({
        documents: s.documents.map((d) =>
          d.id === id ? { ...d, status: 'pending' as DocumentIndexStatus, errorMessage: undefined, updatedAt: Date.now() } : d
        ),
      }));
      simulateIndexing(id);
    },

    toggleDocumentEnabled: (id) => {
      set((s) => ({
        documents: s.documents.map((d) => {
          if (d.id !== id) return d;
          if (d.status === 'disabled') {
            return { ...d, status: d.disabledFromStatus || 'indexed', disabledFromStatus: undefined, updatedAt: Date.now() };
          }
          return { ...d, status: 'disabled' as DocumentIndexStatus, disabledFromStatus: d.status, updatedAt: Date.now() };
        }),
      }));
    },

    deleteDocument: (id) => {
      set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
    },
  };
}, 'egsa_ai_documents');
