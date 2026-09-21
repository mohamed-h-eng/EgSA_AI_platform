# EgSA AI Engineering Platform — Task Plan for Mohamed Hany

> Source: `EgSA_AI_Engineering_Platform_Project_Requirements - 2026.pdf` (Rev 0.1, 06 Sep 2026)
> Scope: only the work assigned to **Mohamed Hany — Full-Stack / Workflow Lead**, plus the shared items that block or depend on this role.
> Last audited: 2026-09-21 (against `app/src` in this repo)

---

## 1. My role, per the spec

**Team allocation (Section 3.2):**
> Mohamed Hany — Full-Stack / Workflow Lead — *Web UI, document upload/management, source cards, admin workflows, front-end integration and document pipeline support.*

**Weekly allocation (Section 13.2):**

| Week | My focus |
|---|---|
| 1 | Web UI setup/branding |
| 2 | PDF upload + parsing workflow (frontend side) |
| 3 | Knowledge UI + source cards |
| 4 | Knowledge UI polish + admin flows |
| 5 | Integrated UX/support |
| 6 | UI fixes/user guide |

Other roles (for context, not my direct responsibility, but I integrate with them):
- **Technical Lead** — architecture, use cases, document/question selection, weekly acceptance.
- **Mohamed Hesham** — AI/RAG Lead: models, embeddings, retrieval, RAG pipeline, evaluation.
- **Hussin Saleh** — Platform/Backend Lead: Ollama/model serving, FastAPI backend, Docker, network, logging, security.

---

## 2. What currently exists in `app/` (audited 2026-09-21)

The repo today is a **polished general-purpose AI chat client only** — good Week 1 "Web UI setup/branding" progress, but nothing yet for Weeks 2–6 of my track.

**Built:**
- Multi-session chat: create/rename/delete/search/export (`src/stores/chatStore.ts`, `src/components/layout/Sidebar.tsx`)
- Streaming responses with token-pacing buffer (`src/services/ai/streamBuffer.ts`)
- Hand-rolled Markdown renderer (`src/components/chat/MarkdownRenderer.tsx`)
- Settings modal — Appearance / Intelligence (models) / Engine & API / About tabs (`src/components/settings/SettingsModal.tsx`)
- Theming (light/dark), RTL/Arabic layout support, responsive design (`src/styles`, `src/hooks/useMediaQuery.ts`)
- Pluggable AI provider layer: mock provider + generic OpenAI-compatible custom endpoint (`src/services/ai/{base,mockProvider,apiProvider,providerRegistry}.ts`)
- Local persistence only, via `localStorage` (no backend calls except directly to the configured model endpoint)

**Confirmed NOT present** (grepped full `src/` tree):
- No file/document upload UI or dropzone
- No document store, document list, or document metadata (project/subsystem/revision/type)
- No source citations / "source card" rendering anywhere in the Markdown renderer or chat UI
- No project/subsystem filter UI
- No admin vs. normal-user distinction (Header's account menu is decorative, hardcoded name, no auth)
- No calls to a backend gateway (`/api/...`) — the frontend talks straight from the browser to whichever OpenAI-compatible URL is typed into Settings

**Architecture implication:** per the spec's system architecture (Section 5) and `INT-004`, the browser should talk to an **EgSA AI Gateway/API**, not directly to model endpoints. Right now `apiProvider.ts` does the latter. This is fine as a Week-1 chat demo, but before Week 2–3 UI work lands, the chat/query calls should be re-pointed at Hussin's FastAPI gateway (`POST /api/chat`, `POST /api/knowledge/query`, per Appendix D) once it exists — otherwise document-grounded answers have nowhere to come from.

---

## 3. Gap analysis — requirements that are "mine" to build the UI for

Requirement IDs from the spec, filtered to what needs frontend/workflow work from me. (S=Should, M=Must, C=Could)

### Knowledge Copilot UI (Section 6.2) — Week 2–3
| ID | Requirement | Status |
|---|---|---|
| KB-013 | Authorized user can upload a document and trigger indexing | ❌ Not started |
| KB-014 | Authorized user can disable/remove a document from retrieval | ❌ Not started |
| KB-015 | Support re-indexing after metadata/parsing changes | ❌ Not started |
| KB-016 | Document summary constrained to selected source | ❌ Not started |
| KB-017 | Compare two selected document revisions | ❌ Not started (Could-have) |
| KB-018 | Source card / source-view action to inspect referenced page/passage | ❌ Not started |
| KB-009/010 | Display source refs (doc/revision/page/section/req-ID) in answers | ❌ Not started |
| NFR-USE-002 | Evidence shown in an engineer-understandable form (source identity + page) | ❌ Not started |

### Administration UI (Section 6.4) — Week 4
| ID | Requirement | Status |
|---|---|---|
| ADM-001 | Distinguish normal users from admins | ❌ Not started |
| ADM-002 | Maintain list of pilot projects/subsystems for filtering | ❌ Not started |
| ADM-003 | Admin can view document list + indexing status | ❌ Not started |
| ADM-004 | Show upload/indexing status and errors | ❌ Not started |
| ADM-005 | Basic model/service health info to admins | ❌ Not started (Should) |
| ADM-007 | Config to disable access to a project/doc set without deleting files | ❌ Not started (Should) |

### Core chat (Section 6.1) — mostly done, small gaps
| ID | Requirement | Status |
|---|---|---|
| CHAT-001–004, 007, 008 | Chat UI, session context, new-session reset, English support | ✅ Done |
| CHAT-005 | Arabic prompts/responses | ✅ UI supports RTL/Arabic already — verify model responses render correctly |
| CHAT-006 | Admin can configure ≥1 general + 1 coding model | ⚠️ Partial — Settings has model config, but no distinct "general vs coding model profile" concept yet |
| CHAT-009 | Display active model/profile for a conversation | ⚠️ Check — may already show selected model; confirm it's visible per-conversation |
| CHAT-010 | Controlled internal API for platform clients | ❌ N/A to frontend directly, but frontend must migrate to it (see architecture note above) |

### Data/document metadata (Section 12.2) — feeds the upload UI
Fields the upload form / document list need to capture or display: **Project** (mandatory), **Subsystem**, **Document ID**, **Document Title** (mandatory), **Revision** (mandatory), **Document Type** (TRS/SRS/ICD/Design/Test/Report/etc.), **Approval Status**, **Classification**, **Page** (mandatory, auto from ingestion), **Section**, **Requirement ID**.

### Security-relevant UI behavior (Section 9.2, 10) — Week 4–5, shared with Code Copilot if in scope
Not directly my track (VS Code copilot is not part of the `app/` web frontend), but worth noting: any future admin actions I build must be auditable (`ADM-006`, `NFR-SEC-007`) and respect least-privilege — i.e., only call admin endpoints once real auth exists, don't fake admin state client-side only.

---

## 4. What's already achieved vs. what's needed — summary

**Achieved (maps to Week 1 exit deliverable "Local AI Chat reachable from at least 3 PCs"):**
- Full chat UI, multi-session, streaming, markdown, theming, settings/model config, responsive/RTL layout.

**Needed next, in priority order (Weeks 2→4 of my track):**
1. **Document upload workflow UI** (KB-013): file picker/dropzone, project/subsystem/doc-type/revision metadata form, upload progress, calls `POST /api/documents`.
2. **Document list / admin view** (ADM-003, ADM-004, KB-014, KB-015): table of documents with indexing status, disable/re-index actions, calls `GET /api/documents`, `POST /api/documents/{id}/index`, `POST /api/documents/{id}/disable`.
3. **Knowledge Q&A surface + source cards** (KB-009/010/018, NFR-USE-002): a "Knowledge" mode/tab in chat (or separate view) that calls `POST /api/knowledge/query`, renders the answer plus a "Source card" component (doc title, ID, revision, page, section, requirement ID, with a way to view the excerpt).
4. **Project/subsystem filter** (KB-008, ADM-002) in both the knowledge query UI and the document list.
5. **Admin vs. user distinction** (ADM-001): route/section gating in the UI (even a simple role flag from auth response is enough for MVP), health-check panel (ADM-005).
6. **Document summary / compare-revisions actions** (KB-016, KB-017) — lower priority, Could/Should.
7. **Re-point chat + new knowledge calls at the backend gateway** instead of direct model endpoints, once Hussin's FastAPI service exposes `/api/chat` and `/api/knowledge/query` (Appendix D). Keep the existing direct-provider mode available behind a toggle for local dev/testing.
8. **Week 6**: UI polish, defect fixes, and a short user guide for the web UI (my piece of `D-12 User and administrator guide`).

**Blocked on teammates:**
- Backend API endpoints (Hussin) — needed before items 1–5 can do more than mock/local-state UI.
- Document ingestion + retrieval quality (Hesham) — needed for KB-009/010 citation data to be real instead of placeholder.
- Pilot document set + benchmark questions (Technical Lead) — needed to test the upload/list/Q&A UI end-to-end.

Until backend endpoints exist, I can build these UI pieces against a mock/local API layer (same pattern already used in `mockProvider.ts`) so front-end work isn't blocked, then swap in real calls.

---

## 5. Immediate next actions (proposed)

1. Add a `Document` type + `documentStore` (mirrors existing `chatStore` pattern) with mock data.
2. Build `DocumentUploadModal` (metadata form + file input) and wire to a mock "upload" action.
3. Build `DocumentList` admin view (table, status badges, disable/re-index buttons) as a new route/panel.
4. Build `SourceCard` component and integrate into `MessageItem`/`MarkdownRenderer` for a new "knowledge answer" message type.
5. Add project/subsystem filter control, shared by document list and knowledge query UI.
6. Once real endpoints exist, add a thin API client module (e.g. `src/services/api/`) and swap mocks for real fetch calls behind the same interfaces.

This keeps me unblocked immediately while staying aligned with what the backend will need to plug into later.
