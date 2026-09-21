import React, { useState } from 'react';
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
  CheckIcon,
  AlertCircleIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
} from '../ui/Icons';
import { useDocumentStore } from '../../stores/documentStore';
import { SourceCard } from './SourceCard';
import { FilterSelect } from './FilterSelect';
import { useIsMobile } from '../../hooks/useMediaQuery';
import type { DocumentIndexStatus, KnowledgeDocument } from '../../types';

const STATUS_CONFIG: Record<DocumentIndexStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Queued', color: 'var(--text-muted)', bg: 'var(--bg-tertiary)' },
  indexing: { label: 'Indexing…', color: 'var(--accent-text)', bg: 'var(--accent-surface)' },
  indexed: { label: 'Indexed', color: 'var(--success)', bg: 'rgba(52, 199, 89, 0.12)' },
  error: { label: 'Error', color: 'var(--danger)', bg: 'rgba(255, 59, 48, 0.1)' },
  disabled: { label: 'Disabled', color: 'var(--text-muted)', bg: 'var(--bg-tertiary)' },
};

const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export const DocumentManagerModal: React.FC = () => {
  const isMobile = useIsMobile(720);
  const isOpen = useDocumentStore((s) => s.isManagerOpen);
  const documents = useDocumentStore((s) => s.documents);
  const projects = useDocumentStore((s) => s.projects);
  const isAdminMode = useDocumentStore((s) => s.isAdminMode);
  const projectFilter = useDocumentStore((s) => s.projectFilter);
  const subsystemFilter = useDocumentStore((s) => s.subsystemFilter);
  const searchQuery = useDocumentStore((s) => s.searchQuery);

  const closeManager = useDocumentStore((s) => s.closeManager);
  const openUploadModal = useDocumentStore((s) => s.openUploadModal);
  const toggleAdminMode = useDocumentStore((s) => s.toggleAdminMode);
  const setProjectFilter = useDocumentStore((s) => s.setProjectFilter);
  const setSubsystemFilter = useDocumentStore((s) => s.setSubsystemFilter);
  const setSearchQuery = useDocumentStore((s) => s.setSearchQuery);
  const reindexDocument = useDocumentStore((s) => s.reindexDocument);
  const toggleDocumentEnabled = useDocumentStore((s) => s.toggleDocumentEnabled);
  const deleteDocument = useDocumentStore((s) => s.deleteDocument);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedProject = projects.find((p) => p.id === projectFilter);

  const filteredDocuments = documents.filter((d) => {
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

        {/* Toolbar: search + filters + upload */}
        <div style={{ padding: '0.65rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', borderBottom: '1px solid var(--hairline)', backgroundColor: 'var(--bg-secondary)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-tertiary)', minWidth: '160px', flex: '1 1 180px' }}>
            <SearchIcon size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, doc ID…"
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}
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
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 600, flexShrink: 0 }}
            >
              <UploadCloudIcon size={13} />
              Upload Document
            </button>
          )}
        </div>

        {/* Document list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.6rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filteredDocuments.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileTextIcon size={28} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
              <div style={{ fontSize: 'var(--text-sm)' }}>No documents match the current filters.</div>
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                projectLabel={projectName(doc.project)}
                isAdminMode={isAdminMode}
                isExpanded={expandedId === doc.id}
                onToggleExpand={() => setExpandedId((cur) => (cur === doc.id ? null : doc.id))}
                onReindex={() => reindexDocument(doc.id)}
                onToggleEnabled={() => toggleDocumentEnabled(doc.id)}
                onDeleteRequest={() => setPendingDeleteId(doc.id)}
              />
            ))
          )}
        </div>

        {/* Inline delete confirmation */}
        {pendingDeleteId && (
          <div
            onClick={() => setPendingDeleteId(null)}
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
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteDocument(pendingDeleteId);
                    setPendingDeleteId(null);
                  }}
                  className="apple-button"
                  style={{ flex: 1, padding: '0.45rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger)', color: '#fff', border: 'none', fontSize: 'var(--text-xs)', fontWeight: 600 }}
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
  isExpanded: boolean;
  onToggleExpand: () => void;
  onReindex: () => void;
  onToggleEnabled: () => void;
  onDeleteRequest: () => void;
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
