import React, { useRef, useState } from 'react';
import {
  XIcon,
  SearchIcon,
  UploadCloudIcon,
  FileTextIcon,
  FolderIcon,
  FilterIcon,
  RefreshCwIcon,
  EyeIcon,
  EyeOffIcon,
  TrashIcon,
  AlertCircleIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  ActivityIcon,
  FolderIcon as ProjectsIcon,
  ThumbsUpIcon,
} from '../ui/Icons';
import { Menu } from '../ui/Menu';
import { StatusGlyph, type StatusTone } from '../admin/StatusGlyph';
import { useDocumentStore, isDocumentAccessible, type AdminSection } from '../../stores/documentStore';
import { HealthPanel } from '../admin/HealthPanel';
import { useDialog } from '../../hooks/useDialog';
import { useRoleStore } from '../../stores/roleStore';
import { ProjectAccessPanel } from '../admin/ProjectAccessPanel';
import { FeedbackPanel } from '../admin/FeedbackPanel';
import { SourceCard } from './SourceCard';
import { FilterSelect } from './FilterSelect';
import { useIsMobile } from '../../hooks/useMediaQuery';
import type { DocumentIndexStatus, KnowledgeDocument } from '../../types';

// Glyph + word, same language as Health (ADM-004); never colour alone.
const STATUS_CONFIG: Record<DocumentIndexStatus, { label: string; tone: StatusTone }> = {
  pending: { label: 'Queued', tone: 'muted' },
  indexing: { label: 'Indexing…', tone: 'progress' },
  indexed: { label: 'Indexed', tone: 'success' },
  error: { label: 'Failed', tone: 'danger' },
  disabled: { label: 'Disabled', tone: 'muted' },
};

const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export const DocumentManagerModal: React.FC = () => {
  const isMobile = useIsMobile(720);
  const isOpen = useDocumentStore((s) => s.isManagerOpen);
  const documents = useDocumentStore((s) => s.documents);
  const projects = useDocumentStore((s) => s.projects);
  const isAdminMode = useRoleStore((s) => s.isAdmin);
  const adminSection = useDocumentStore((s) => s.adminSection);
  const projectFilter = useDocumentStore((s) => s.projectFilter);
  const subsystemFilter = useDocumentStore((s) => s.subsystemFilter);
  const searchQuery = useDocumentStore((s) => s.searchQuery);

  const closeManager = useDocumentStore((s) => s.closeManager);
  const openUploadModal = useDocumentStore((s) => s.openUploadModal);
  const toggleAdmin = useRoleStore((s) => s.toggleAdmin);
  const setAdminSection = useDocumentStore((s) => s.setAdminSection);
  // Leaving Admin View also leaves the admin-only sections.
  const toggleAdminMode = () => {
    toggleAdmin();
    setAdminSection('documents');
  };
  const setProjectFilter = useDocumentStore((s) => s.setProjectFilter);
  const setSubsystemFilter = useDocumentStore((s) => s.setSubsystemFilter);
  const setSearchQuery = useDocumentStore((s) => s.setSearchQuery);
  const reindexDocument = useDocumentStore((s) => s.reindexDocument);
  const toggleDocumentEnabled = useDocumentStore((s) => s.toggleDocumentEnabled);
  const deleteDocument = useDocumentStore((s) => s.deleteDocument);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Esc dismisses the inline delete confirmation first, then the modal.
  useDialog(isOpen, () => (pendingDeleteId ? setPendingDeleteId(null) : closeManager()), dialogRef);

  if (!isOpen) return null;

  const selectedProject = projects.find((p) => p.id === projectFilter);

  const filteredDocuments = documents.filter((d) => {
    // ADM-007: normal users don't see documents in switched-off projects/subsystems.
    if (!isAdminMode && !isDocumentAccessible(d, projects)) return false;
    if (projectFilter && d.project !== projectFilter) return false;
    if (subsystemFilter && d.subsystem !== subsystemFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const haystack = `${d.title} ${d.documentId || ''} ${d.fileName}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name || id;

  // Health is admin-only (ADM-005); User View always shows documents.
  const section: AdminSection = isAdminMode ? adminSection : 'documents';
  const sectionSwitch = isAdminMode && (
    <div className="segmented" role="radiogroup" aria-label="Administration section">
      <button type="button" role="radio" aria-checked={section === 'documents'} className="segmented-option" onClick={() => setAdminSection('documents')}>
        <FileTextIcon size={12} />
        Documents
      </button>
      <button type="button" role="radio" aria-checked={section === 'projects'} className="segmented-option" onClick={() => setAdminSection('projects')}>
        <ProjectsIcon size={12} />
        Projects
      </button>
      <button type="button" role="radio" aria-checked={section === 'health'} className="segmented-option" onClick={() => setAdminSection('health')}>
        <ActivityIcon size={12} />
        Health
      </button>
      <button type="button" role="radio" aria-checked={section === 'feedback'} className="segmented-option" onClick={() => setAdminSection('feedback')}>
        <ThumbsUpIcon size={12} />
        Feedback
      </button>
    </div>
  );

  return (
    <div
      onClick={closeManager}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? 0 : '1.5rem',
        animation: 'fadeIn 0.18s ease-out',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: isMobile ? '100vw' : '900px',
          height: isMobile ? '100dvh' : '640px',
          maxHeight: isMobile ? '100dvh' : '90vh',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: isMobile ? 0 : '16px',
          boxShadow: isMobile ? 'none' : 'var(--shadow-modal)',
          border: isMobile ? 'none' : '1px solid var(--hairline)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          animation: 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div style={{ padding: isMobile ? 'calc(0.65rem + var(--safe-area-top)) 1rem 0.65rem' : '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--hairline)', flexShrink: 0, gap: '0.75rem' }}>
          {/* Title and controls share the width equally so the section switch stays centred. */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 id="admin-dialog-title" style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {isAdminMode ? 'Administration' : 'Engineering Knowledge Base'}
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '1px' }}>
              {section === 'health'
                ? 'Model and service health'
                : section === 'feedback'
                  ? 'What people think of the answers'
                  : section === 'projects'
                  ? 'Project and subsystem access'
                  : `${documents.length} document${documents.length === 1 ? '' : 's'} · pilot document management`}
            </p>
          </div>

          {!isMobile && sectionSwitch}

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              type="button"
              className="text-action is-muted"
              aria-pressed={isAdminMode}
              onClick={toggleAdminMode}
              title="Demo control for admin vs. normal-user view (ADM-001). Real roles need backend sign-in."
            >
              <ShieldCheckIcon size={13} />
              {isAdminMode ? 'Admin View' : 'User View'}
            </button>

            <button
              onClick={closeManager}
              className="apple-button"
              style={{ width: '26px', height: '26px', padding: 0, borderRadius: '50%', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}
              title="Close (Esc)"
            >
              <XIcon size={13} />
            </button>
          </div>
        </div>

        {isMobile && sectionSwitch && (
          <div style={{ padding: 'var(--space-2) var(--space-4)', borderBottom: '1px solid var(--hairline)', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
            {sectionSwitch}
          </div>
        )}

        {section === 'health' ? (
          <HealthPanel />
        ) : section === 'projects' ? (
          <ProjectAccessPanel />
        ) : section === 'feedback' ? (
          <FeedbackPanel />
        ) : (
        <>
        {/* Toolbar: search + filters + upload */}
        <div style={{ padding: isMobile ? 'var(--space-3) var(--space-4)' : 'var(--space-4) var(--space-6)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center', borderBottom: '1px solid var(--hairline)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-tertiary)', minWidth: '160px', flex: '1 1 180px' }}>
            <SearchIcon size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, doc ID…"
              aria-label="Search documents"
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
            />
          </div>

          <FilterSelect
            icon={<FolderIcon size={12} />}
            value={projectFilter}
            onChange={setProjectFilter}
            allLabel="All Projects"
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />

          <FilterSelect
            icon={<FilterIcon size={12} />}
            value={subsystemFilter}
            onChange={setSubsystemFilter}
            allLabel="All Subsystems"
            disabled={!selectedProject}
            options={(selectedProject?.subsystems || []).map((s) => ({ value: s, label: s }))}
          />

          {isAdminMode && (
            <button
              type="button"
              onClick={openUploadModal}
              className="apple-button apple-button-primary"
              style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', fontWeight: 600, flexShrink: 0 }}
            >
              <UploadCloudIcon size={14} />
              Upload document
            </button>
          )}
        </div>

        {/* Document list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 'var(--space-2) var(--space-4)' : 'var(--space-2) var(--space-6)' }}>
          {filteredDocuments.length === 0 ? (
            <p style={{ padding: 'var(--space-7) var(--space-4)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              No documents match the current filters.
            </p>
          ) : (
            filteredDocuments.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                projectLabel={projectName(doc.project)}
                isAdminMode={isAdminMode}
                isMobile={isMobile}
                isAccessible={isDocumentAccessible(doc, projects)}
                isExpanded={expandedId === doc.id}
                onToggleExpand={() => setExpandedId((cur) => (cur === doc.id ? null : doc.id))}
                onReindex={() => reindexDocument(doc.id)}
                onToggleEnabled={() => toggleDocumentEnabled(doc.id)}
                onDeleteRequest={() => setPendingDeleteId(doc.id)}
              />
            ))
          )}
        </div>
        </>
        )}

        {/* Inline delete confirmation */}
        {pendingDeleteId && (
          <div
            onClick={() => setPendingDeleteId(null)}
            className="confirm-backdrop"
          >
            <div
              role="alertdialog"
              aria-labelledby="remove-doc-title"
              onClick={(e) => e.stopPropagation()}
              className="confirm-card"
            >
              <div id="remove-doc-title" style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>Remove document?</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-4)' }}>
                This removes it from the pilot knowledge base and active retrieval. This does not affect the original source file outside the platform.
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" autoFocus onClick={() => setPendingDeleteId(null)} className="apple-button" style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', fontSize: 'var(--text-sm)' }}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteDocument(pendingDeleteId);
                    setPendingDeleteId(null);
                  }}
                  className="apple-button"
                  style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger)', color: 'var(--text-on-color)', border: 'none', fontSize: 'var(--text-sm)', fontWeight: 600 }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DocumentRow: React.FC<{
  doc: KnowledgeDocument;
  projectLabel: string;
  isAdminMode: boolean;
  isMobile: boolean;
  isAccessible: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onReindex: () => void;
  onToggleEnabled: () => void;
  onDeleteRequest: () => void;
}> = ({ doc, projectLabel, isAdminMode, isMobile, isAccessible, isExpanded, onToggleExpand, onReindex, onToggleEnabled, onDeleteRequest }) => {
  const status = STATUS_CONFIG[doc.status];
  const isDisabled = doc.status === 'disabled';
  const detailId = `doc-detail-${doc.id}`;
  // One quiet metadata line instead of pill tags; "Project off" is a word, not a badge (ADM-007).
  const meta = [
    doc.documentId,
    doc.subsystem ? `${projectLabel} / ${doc.subsystem}` : projectLabel,
    doc.documentType,
    `Rev ${doc.revision}`,
    formatDate(doc.uploadedAt),
    !isAccessible ? 'Project off' : undefined,
  ].filter(Boolean);

  const statusEl = (
    <span className="doc-status">
      <StatusGlyph tone={status.tone} />
      {status.label}
    </span>
  );

  return (
    <div className="doc-row" data-inactive={isDisabled || !isAccessible || undefined}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <button type="button" className="doc-row-trigger" aria-expanded={isExpanded} aria-controls={detailId} onClick={onToggleExpand}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="doc-title">{doc.title}</span>
            <span className="doc-meta" title={!isAccessible ? 'Its project or subsystem is switched off in Administration → Projects, so the Copilot doesn’t search it.' : undefined}>
              {meta.join(' · ')}
            </span>
            {isMobile && <span style={{ display: 'block', marginTop: 'var(--space-1)' }}>{statusEl}</span>}
          </span>
          {!isMobile && statusEl}
          <ChevronDownIcon size={14} className="doc-chevron" />
        </button>

        {isAdminMode && (
          <Menu
            label={`Actions for ${doc.title}`}
            title="Document actions"
            triggerClassName="icon-button"
            trigger={<span aria-hidden="true" style={{ fontSize: '1.1rem', lineHeight: 1, letterSpacing: '0.05em' }}>⋯</span>}
          >
            {(close) => (
              <>
                <button type="button" role="menuitem" className="menu-item" disabled={isDisabled} onClick={() => { onReindex(); close(); }}>
                  <RefreshCwIcon size={14} />
                  Re-index
                </button>
                <button type="button" role="menuitem" className="menu-item" onClick={() => { onToggleEnabled(); close(); }}>
                  {isDisabled ? <EyeIcon size={14} /> : <EyeOffIcon size={14} />}
                  {isDisabled ? 'Enable in retrieval' : 'Disable from retrieval'}
                </button>
                <div className="menu-separator" role="separator" />
                <button type="button" role="menuitem" className="menu-item is-danger" onClick={() => { close(); onDeleteRequest(); }}>
                  <TrashIcon size={14} />
                  Remove…
                </button>
              </>
            )}
          </Menu>
        )}
      </div>

      {isExpanded && (
        <div id={detailId} className="doc-detail">
          <dl className="doc-fields">
            <DetailField label="Classification" value={doc.classification || '—'} />
            <DetailField label="Approval status" value={doc.approvalStatus || '—'} />
            <DetailField label="Pages" value={doc.pageCount ? String(doc.pageCount) : '—'} />
            <DetailField label="File" value={doc.fileName} />
          </dl>

          {doc.status === 'error' && doc.errorMessage && (
            <p role="status" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--danger)', lineHeight: 1.5 }}>
              <AlertCircleIcon size={14} style={{ flexShrink: 0, marginTop: '3px' }} />
              <span>{doc.errorMessage}</span>
            </p>
          )}

          {doc.status === 'indexed' && (
            <SourceCard
              source={{
                documentId: doc.id,
                documentTitle: doc.title,
                revision: doc.revision,
                page: 1,
                section: doc.documentType,
                requirementId: doc.documentId,
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

const DetailField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <dt style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{label}</dt>
    <dd style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500, wordBreak: 'break-word' }}>{value}</dd>
  </div>
);
