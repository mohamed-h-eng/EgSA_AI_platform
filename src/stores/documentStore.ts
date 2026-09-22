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

<<<<<<< HEAD
// Sections of the Administration modal; all but 'documents' are admin-only (ADM-007, ADM-005, feedback).
export type AdminSection = 'documents' | 'projects' | 'health' | 'feedback';

// ADM-007: a document is reachable (Copilot search, User View list) only when neither its project
// nor its subsystem has been switched off. Unknown projects count as accessible.
export const isDocumentAccessible = (doc: Pick<KnowledgeDocument, 'project' | 'subsystem'>, projects: ProjectDefinition[]) => {
  const project = projects.find((p) => p.id === doc.project);
  if (!project) return true;
  if (project.disabled) return false;
  return !(doc.subsystem && project.disabledSubsystems?.includes(doc.subsystem));
};

export const isProjectAccessible = (projectId: string, subsystem: string | undefined, projects: ProjectDefinition[]) =>
  isDocumentAccessible({ project: projectId, subsystem }, projects);

=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
interface DocumentState {
  documents: KnowledgeDocument[];
  projects: ProjectDefinition[];
  isUploadModalOpen: boolean;
  isManagerOpen: boolean;
<<<<<<< HEAD
  adminSection: AdminSection;
=======
  isAdminMode: boolean;
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
  projectFilter: string;
  subsystemFilter: string;
  searchQuery: string;

  openUploadModal: () => void;
  closeUploadModal: () => void;
  openManager: () => void;
  closeManager: () => void;
<<<<<<< HEAD
  setAdminSection: (section: AdminSection) => void;
=======
  toggleAdminMode: () => void;
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
  setProjectFilter: (project: string) => void;
  setSubsystemFilter: (subsystem: string) => void;
  setSearchQuery: (query: string) => void;

  uploadDocument: (input: UploadDocumentInput) => string;
  reindexDocument: (id: string) => void;
  toggleDocumentEnabled: (id: string) => void;
  deleteDocument: (id: string) => void;
<<<<<<< HEAD

  setProjectEnabled: (projectId: string, enabled: boolean) => void;
  setSubsystemEnabled: (projectId: string, subsystem: string, enabled: boolean) => void;
=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
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
<<<<<<< HEAD
    adminSection: 'documents',
=======
    isAdminMode: true,
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
    projectFilter: '',
    subsystemFilter: '',
    searchQuery: '',

    openUploadModal: () => set({ isUploadModalOpen: true }),
    closeUploadModal: () => set({ isUploadModalOpen: false }),
<<<<<<< HEAD
    openManager: () => set({ isManagerOpen: true, adminSection: 'documents' }),
    closeManager: () => set({ isManagerOpen: false }),
    setAdminSection: (adminSection) => set({ adminSection }),
=======
    openManager: () => set({ isManagerOpen: true }),
    closeManager: () => set({ isManagerOpen: false }),
    toggleAdminMode: () => set((s) => ({ isAdminMode: !s.isAdminMode })),
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
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
<<<<<<< HEAD

    // ADM-007 — client-side until the backend owns project visibility (and audits it, ADM-006).
    setProjectEnabled: (projectId, enabled) => {
      set((s) => ({ projects: s.projects.map((p) => (p.id === projectId ? { ...p, disabled: !enabled } : p)) }));
    },

    setSubsystemEnabled: (projectId, subsystem, enabled) => {
      set((s) => ({
        projects: s.projects.map((p) => {
          if (p.id !== projectId) return p;
          const others = (p.disabledSubsystems || []).filter((x) => x !== subsystem);
          return { ...p, disabledSubsystems: enabled ? others : [...others, subsystem] };
        }),
      }));
    },
  };
}, 'egsa_ai_documents', {
  rehydrate: (loaded) => ({ ...loaded, projects: reconcileProjects(loaded.projects, DEFAULT_PROJECTS) }),
});

// Saved arrays replace defaults wholesale, so without this a browser that saved the project list
// once (e.g. after an ADM-007 switch) would never see projects/subsystems added to DEFAULT_PROJECTS.
// Seed definitions win for name/subsystems; saved access switches and any extra saved projects are kept.
export function reconcileProjects(saved: ProjectDefinition[] | undefined, seed: ProjectDefinition[]): ProjectDefinition[] {
  const savedById = new Map((saved || []).map((p) => [p.id, p]));
  const merged = seed.map((def) => {
    const prev = savedById.get(def.id);
    if (!prev) return def;
    return {
      ...def,
      disabled: prev.disabled,
      disabledSubsystems: prev.disabledSubsystems?.filter((sub) => def.subsystems.includes(sub)),
    };
  });
  const extras = (saved || []).filter((p) => !seed.some((def) => def.id === p.id));
  return [...merged, ...extras];
}
=======
  };
}, 'egsa_ai_documents');
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
