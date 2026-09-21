import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { UploadCloudIcon, FileTextIcon, XIcon, AlertCircleIcon } from '../ui/Icons';
import { useDocumentStore } from '../../stores/documentStore';
import { DOCUMENT_TYPE_OPTIONS, APPROVAL_STATUS_OPTIONS, CLASSIFICATION_OPTIONS } from '../../constants/defaults';
import type { DocumentType, ApprovalStatus, DocumentClassification } from '../../types';

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const stripExtension = (fileName: string) => fileName.replace(/\.[^/.]+$/, '');

export const DocumentUploadModal: React.FC = () => {
  const isOpen = useDocumentStore((s) => s.isUploadModalOpen);
  const projects = useDocumentStore((s) => s.projects);
  const closeUploadModal = useDocumentStore((s) => s.closeUploadModal);
  const uploadDocument = useDocumentStore((s) => s.uploadDocument);
  const openManager = useDocumentStore((s) => s.openManager);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('');
  const [subsystem, setSubsystem] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [revision, setRevision] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('SRS');
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('Draft');
  const [classification, setClassification] = useState<DocumentClassification>('Internal');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedProject = projects.find((p) => p.id === project);

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setProject('');
    setSubsystem('');
    setDocumentId('');
    setRevision('');
    setDocumentType('SRS');
    setApprovalStatus('Draft');
    setClassification('Internal');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    closeUploadModal();
  };

  const handleFileChange = (selected: File | null) => {
    setFile(selected);
    if (selected && !title.trim()) {
      setTitle(stripExtension(selected.name));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Select a PDF file to upload.');
      return;
    }
    if (!title.trim() || !project || !revision.trim()) {
      setError('Title, Project and Revision are required.');
      return;
    }

    uploadDocument({
      fileName: file.name,
      fileSizeBytes: file.size,
      title,
      project,
      subsystem: subsystem || undefined,
      documentId: documentId || undefined,
      revision: revision.trim(),
      documentType,
      approvalStatus,
      classification,
    });

    resetForm();
    closeUploadModal();
    openManager();
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(0.75rem, 3vw, 1.5rem)',
        animation: 'fadeIn 0.16s ease-out',
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 'min(460px, 94vw)',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--hairline)',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideDown 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '0.9rem 1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--hairline)',
            flexShrink: 0,
          }}
        >
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Upload Engineering Document
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="apple-button"
            style={{ width: '26px', height: '26px', padding: 0, borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            title="Close"
          >
            <XIcon size={13} />
          </button>
        </div>

        {/* Scrollable form body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* File picker / dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) handleFileChange(dropped);
            }}
            style={{
              border: `1.5px dashed ${file ? 'var(--accent-primary)' : 'var(--border-muted)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '1.1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              backgroundColor: file ? 'var(--accent-surface)' : 'var(--bg-secondary)',
              textAlign: 'center',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
            {file ? (
              <>
                <FileTextIcon size={22} style={{ color: 'var(--accent-primary)' }} />
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{formatBytes(file.size)} — click to replace</div>
              </>
            ) : (
              <>
                <UploadCloudIcon size={22} style={{ color: 'var(--text-muted)' }} />
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-primary)' }}>Click to browse or drop a PDF</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Engineering documents only (KB-001)</div>
              </>
            )}
          </div>

          <FormField label="Title" required>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ADCS Software Requirements Specification" style={inputStyle} />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
            <FormField label="Project" required>
              <select
                value={project}
                onChange={(e) => {
                  setProject(e.target.value);
                  setSubsystem('');
                }}
                style={inputStyle}
              >
                <option value="" disabled>Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Subsystem">
              <select value={subsystem} onChange={(e) => setSubsystem(e.target.value)} style={inputStyle} disabled={!selectedProject}>
                <option value="">{selectedProject ? 'Select subsystem' : 'Choose a project first'}</option>
                {selectedProject?.subsystems.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
            <FormField label="Document ID">
              <input type="text" value={documentId} onChange={(e) => setDocumentId(e.target.value)} placeholder="EGSA-ADCS-SRS-001" style={{ ...inputStyle, fontFamily: 'monospace' }} />
            </FormField>

            <FormField label="Revision" required>
              <input type="text" value={revision} onChange={(e) => setRevision(e.target.value)} placeholder="A" style={inputStyle} />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
            <FormField label="Document Type">
              <select value={documentType} onChange={(e) => setDocumentType(e.target.value as DocumentType)} style={inputStyle}>
                {DOCUMENT_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Approval Status">
              <select value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value as ApprovalStatus)} style={inputStyle}>
                {APPROVAL_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Classification">
            <select value={classification} onChange={(e) => setClassification(e.target.value as DocumentClassification)} style={inputStyle}>
              {CLASSIFICATION_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FormField>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-xs)', backgroundColor: 'rgba(255, 59, 48, 0.08)', border: '1px solid rgba(255, 59, 48, 0.2)', fontSize: '0.72rem', color: 'var(--danger)' }}>
              <AlertCircleIcon size={13} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding: '0.85rem 1.1rem', borderTop: '1px solid var(--hairline)', display: 'flex', gap: '0.65rem', flexShrink: 0 }}>
          <button type="button" onClick={handleClose} className="apple-button" style={{ flex: 1, padding: '0.55rem 1rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
            Cancel
          </button>
          <button type="submit" className="apple-button apple-button-primary" style={{ flex: 1, padding: '0.55rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            Upload & Index
          </button>
        </div>
      </form>
    </div>
  );

  return createPortal(modalContent, document.body);
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.65rem',
  fontSize: 'var(--text-xs)',
  backgroundColor: 'var(--bg-tertiary)',
  borderRadius: 'var(--radius-xs)',
  border: '1px solid var(--hairline)',
  color: 'var(--text-primary)',
};

const FormField: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
      {label}
      {required && <span style={{ color: 'var(--danger)' }}> *</span>}
    </label>
    {children}
  </div>
);
