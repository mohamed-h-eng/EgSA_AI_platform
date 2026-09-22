<<<<<<< HEAD
import React, { useRef, useState } from 'react';
=======
import React, { useState } from 'react';
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
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
<<<<<<< HEAD
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
=======
  CheckIcon,
  AlertCircleIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
} from '../ui/Icons';
import { useDocumentStore } from '../../stores/documentStore';
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
import { SourceCard } from './SourceCard';
import { FilterSelect } from './FilterSelect';
import { useIsMobile } from '../../hooks/useMediaQuery';
import type { DocumentIndexStatus, KnowledgeDocument } from '../../types';

<<<<<<< HEAD
// Glyph + word, same language as Health (ADM-004); never colour alone.
const STATUS_CONFIG: Record<DocumentIndexStatus, { label: string; tone: StatusTone }> = {
  pending: { label: 'Queued', tone: 'muted' },
  indexing: { label: 'Indexing…', tone: 'progress' },
  indexed: { label: 'Indexed', tone: 'success' },
  error: { label: 'Failed', tone: 'danger' },
  disabled: { label: 'Disabled', tone: 'muted' },
=======
const STATUS_CONFIG: Record<DocumentIndexStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Queued', color: 'var(--text-muted)', bg: 'var(--bg-tertiary)' },
  indexing: { label: 'Indexing…', color: 'var(--accent-text)', bg: 'var(--accent-surface)' },
  indexed: { label: 'Indexed', color: 'var(--success)', bg: 'rgba(52, 199, 89, 0.12)' },
  error: { label: 'Error', color: 'var(--danger)', bg: 'rgba(255, 59, 48, 0.1)' },
  disabled: { label: 'Disabled', color: 'var(--text-muted)', bg: 'var(--bg-tertiary)' },
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
};

const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export const DocumentManagerModal: React.FC = () => {
  const isMobile = useIsMobile(720);
  const isOpen = useDocumentStore((s) => s.isManagerOpen);
  const documents = useDocumentStore((s) => s.documents);
  const projects = useDocumentStore((s) => s.projects);
<<<<<<< HEAD
  const isAdminMode = useRoleStore((s) => s.isAdmin);
  const adminSection = useDocumentStore((s) => s.adminSection);
=======
  const isAdminMode = useDocumentStore((s) => s.isAdminMode);
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
  const projectFilter = useDocumentStore((s) => s.projectFilter);
  const subsystemFilter = useDocumentStore((s) => s.subsystemFilter);
  const searchQuery = useDocumentStore((s) => s.searchQuery);

  const closeManager = useDocumentStore((s) => s.closeManager);
  const openUploadModal = useDocumentStore((s) => s.openUploadModal);
<<<<<<< HEAD
  const toggleAdmin = useRoleStore((s) => s.toggleAdmin);
  const setAdminSection = useDocumentStore((s) => s.setAdminSection);
  // Leaving Admin View also leaves the admin-only sections.
  const toggleAdminMode = () => {
    toggleAdmin();
    setAdminSection('documents');
  };
=======
  const toggleAdminMode = useDocumentStore((s) => s.toggleAdminMode);
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
  const setProjectFilter = useDocumentStore((s) => s.setProjectFilter);
  const setSubsystemFilter = useDocumentStore((s) => s.setSubsystemFilter);
  const setSearchQuery = useDocumentStore((s) => s.setSearchQuery);
  const reindexDocument = useDocumentStore((s) => s.reindexDocument);
  const toggleDocumentEnabled = useDocumentStore((s) => s.toggleDocumentEnabled);
  const deleteDocument = useDocumentStore((s) => s.deleteDocument);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
<<<<<<< HEAD
  const dialogRef = useRef<HTMLDivElement>(null);

  // Esc dismisses the inline delete confirmation first, then the modal.
  useDialog(isOpen, () => (pendingDeleteId ? setPendingDeleteId(null) : closeManager()), dialogRef);
=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af

  if (!isOpen) return null;

  const selectedProject = projects.find((p) => p.id === projectFilter);

  const filteredDocuments = documents.filter((d) => {
<<<<<<< HEAD
    // ADM-007: normal users don't see documents in switched-off projects/subsystems.
    if (!isAdminMode && !isDocumentAccessible(d, projects)) return false;
=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
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

<<<<<<< HEAD
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

=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
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
<<<<<<< HEAD
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
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
<<<<<<< HEAD
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
=======
          <div>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Engineering Knowledge Base
            </h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>
              {documents.length} document{documents.length === 1 ? '' : 's'} · pilot document management
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <button
              type="button"
              onClick={toggleAdminMode}
              title="Toggle admin vs. normal-user view (ADM-001) — demo control, real auth pending backend integration"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${isAdminMode ? 'var(--accent-primary)' : 'var(--hairline)'}`,
                backgroundColor: isAdminMode ? 'var(--accent-surface)' : 'var(--bg-tertiary)',
                color: isAdminMode ? 'var(--accent-text)' : 'var(--text-muted)',
                fontSize: '0.68rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ShieldCheckIcon size={12} />
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
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

<<<<<<< HEAD
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
=======
        {/* Toolbar: search + filters + upload */}
        <div style={{ padding: '0.65rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', borderBottom: '1px solid var(--hairline)', backgroundColor: 'var(--bg-secondary)', flexShrink: 0 }}>
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-tertiary)', minWidth: '160px', flex: '1 1 180px' }}>
            <SearchIcon size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, doc ID…"
<<<<<<< HEAD
              aria-label="Search documents"
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
=======
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
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
<<<<<<< HEAD
              style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', fontWeight: 600, flexShrink: 0 }}
            >
              <UploadCloudIcon size={14} />
              Upload document
=======
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 600, flexShrink: 0 }}
            >
              <UploadCloudIcon size={13} />
              Upload Document
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
            </button>
          )}
        </div>

        {/* Document list */}
<<<<<<< HEAD
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 'var(--space-2) var(--space-4)' : 'var(--space-2) var(--space-6)' }}>
          {filteredDocuments.length === 0 ? (
            <p style={{ padding: 'var(--space-7) var(--space-4)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              No documents match the current filters.
            </p>
=======
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.6rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filteredDocuments.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileTextIcon size={28} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
              <div style={{ fontSize: 'var(--text-sm)' }}>No documents match the current filters.</div>
            </div>
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
          ) : (
            filteredDocuments.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                projectLabel={projectName(doc.project)}
                isAdminMode={isAdminMode}
<<<<<<< HEAD
                isMobile={isMobile}
                isAccessible={isDocumentAccessible(doc, projects)}
=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
                isExpanded={expandedId === doc.id}
                onToggleExpand={() => setExpandedId((cur) => (cur === doc.id ? null : doc.id))}
                onReindex={() => reindexDocument(doc.id)}
                onToggleEnabled={() => toggleDocumentEnabled(doc.id)}
                onDeleteRequest={() => setPendingDeleteId(doc.id)}
              />
            ))
          )}
        </div>
<<<<<<< HEAD
        </>
        )}
=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af

        {/* Inline delete confirmation */}
        {pendingDeleteId && (
          <div
            onClick={() => setPendingDeleteId(null)}
<<<<<<< HEAD
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
=======
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: 'min(320px, 88vw)', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)', boxShadow: 'var(--shadow-modal)', padding: '1.1rem' }}
            >
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Remove document?</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.9rem' }}>
                This removes it from the pilot knowledge base and active retrieval. This does not affect the original source file outside the platform.
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={() => setPendingDeleteId(null)} className="apple-button" style={{ flex: 1, padding: '0.45rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', fontSize: 'var(--text-xs)' }}>
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteDocument(pendingDeleteId);
                    setPendingDeleteId(null);
                  }}
                  className="apple-button"
<<<<<<< HEAD
                  style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger)', color: 'var(--text-on-color)', border: 'none', fontSize: 'var(--text-sm)', fontWeight: 600 }}
=======
                  style={{ flex: 1, padding: '0.45rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger)', color: '#fff', border: 'none', fontSize: 'var(--text-xs)', fontWeight: 600 }}
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
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
<<<<<<< HEAD
  isMobile: boolean;
  isAccessible: boolean;
=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
  isExpanded: boolean;
  onToggleExpand: () => void;
  onReindex: () => void;
  onToggleEnabled: () => void;
  onDeleteRequest: () => void;
<<<<<<< HEAD
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
=======
}> = ({ doc, projectLabel, isAdminMode, isExpanded, onToggleExpand, onReindex, onToggleEnabled, onDeleteRequest }) => {
  const status = STATUS_CONFIG[doc.status];
  const isDisabled = doc.status === 'disabled';

  return (
    <div style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--hairline)', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
      <div
        onClick={onToggleExpand}
        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', cursor: 'pointer', opacity: isDisabled ? 0.6 : 1 }}
      >
        <FileTextIcon size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {doc.title}
            </span>
            {doc.documentId && (
              <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--text-muted)', flexShrink: 0 }}>{doc.documentId}</span>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.3rem' }}>
            <Tag label={projectLabel} />
            {doc.subsystem && <Tag label={doc.subsystem} />}
            <Tag label={doc.documentType} />
            <Tag label={`Rev ${doc.revision}`} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', flexShrink: 0 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', color: status.color, backgroundColor: status.bg }}>
            {doc.status === 'indexed' && <CheckIcon size={10} />}
            {doc.status === 'error' && <AlertCircleIcon size={10} />}
            {doc.status === 'indexing' && <RefreshCwIcon size={10} style={{ animation: 'spin 1s linear infinite' }} />}
            {status.label}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{formatDate(doc.uploadedAt)}</span>
        </div>

        {isAdminMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
            <RowAction title="Re-index" onClick={onReindex} disabled={isDisabled}>
              <RefreshCwIcon size={13} />
            </RowAction>
            <RowAction title={isDisabled ? 'Enable in retrieval' : 'Disable from retrieval'} onClick={onToggleEnabled}>
              {isDisabled ? <EyeOffIcon size={13} /> : <EyeIcon size={13} />}
            </RowAction>
            <RowAction title="Remove" onClick={onDeleteRequest} danger>
              <TrashIcon size={13} />
            </RowAction>
          </div>
        )}

        <ChevronDownIcon size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }} />
      </div>

      {isExpanded && (
        <div style={{ padding: '0 0.8rem 0.8rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px solid var(--hairline)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem', paddingTop: '0.65rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            <DetailField label="Classification" value={doc.classification || '—'} />
            <DetailField label="Approval Status" value={doc.approvalStatus || '—'} />
            <DetailField label="Pages" value={doc.pageCount ? String(doc.pageCount) : '—'} />
            <DetailField label="File" value={doc.fileName} />
          </div>

          {doc.status === 'error' && doc.errorMessage && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-xs)', backgroundColor: 'rgba(255, 59, 48, 0.08)', border: '1px solid rgba(255, 59, 48, 0.2)', fontSize: '0.7rem', color: 'var(--danger)' }}>
              <AlertCircleIcon size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{doc.errorMessage}</span>
            </div>
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
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

<<<<<<< HEAD
const DetailField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <dt style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{label}</dt>
    <dd style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500, wordBreak: 'break-word' }}>{value}</dd>
  </div>
);
=======
const Tag: React.FC<{ label: string }> = ({ label }) => (
  <span style={{ fontSize: '0.65rem', padding: '0.05rem 0.4rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
    {label}
  </span>
);

const DetailField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '1px' }}>{label}</div>
    <div style={{ color: 'var(--text-primary)', fontWeight: 500, wordBreak: 'break-word' }}>{value}</div>
  </div>
);

const RowAction: React.FC<{ title: string; onClick: () => void; danger?: boolean; disabled?: boolean; children: React.ReactNode }> = ({ title, onClick, danger, disabled, children }) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onClick={onClick}
    className="apple-button"
    style={{
      width: '24px',
      height: '24px',
      padding: 0,
      borderRadius: 'var(--radius-xs)',
      color: danger ? 'var(--danger)' : 'var(--text-secondary)',
      opacity: disabled ? 0.4 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
  >
    {children}
  </button>
);
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
