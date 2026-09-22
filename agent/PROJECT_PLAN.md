# EgSA AI Engineering Platform — Task Plan for Mohamed Hany

> Source: `EgSA_AI_Engineering_Platform_Project_Requirements - 2026.pdf` (Rev 0.1, 06 Sep 2026)
> Scope: only the work assigned to **Mohamed Hany — Full-Stack / Workflow Lead**, plus the shared items that block or depend on this role.
> Companion docs: [`CONTEXT.md`](CONTEXT.md) (architecture & conventions) · [`../CHANGELOG.md`](../CHANGELOG.md) (change history)
<<<<<<< HEAD
> Last audited: 2026-09-21 (against `app/src` in this repo) · Last updated: 2026-09-22 (ADM-005, ADM-007, CHAT-006 profiles, CHAT-009, offline fonts, a11y/security/test hardening)
=======
> Last audited: 2026-09-21 (against `app/src` in this repo) · Last updated: 2026-09-21 (Knowledge Copilot page with deep research shipped, mock-backed)
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af

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
| KB-013 | Authorized user can upload a document and trigger indexing | 🟡 UI done, mock-backed — `DocumentUploadModal.tsx` + `documentStore.uploadDocument` |
| KB-014 | Authorized user can disable/remove a document from retrieval | 🟡 UI done, mock-backed — row actions in `DocumentManagerModal.tsx` |
| KB-015 | Support re-indexing after metadata/parsing changes | 🟡 UI done, mock-backed — "Re-index" row action, simulated pending→indexing→indexed/error |
| KB-016 | Document summary constrained to selected source | ❌ Not started |
| KB-017 | Compare two selected document revisions | ❌ Not started (Could-have) |
| KB-018 | Source card / source-view action to inspect referenced page/passage | 🟡 Clickable `[n]` markers select the numbered source in the Copilot Evidence panel, which expands the cited passage. Opening the actual PDF page needs the backend (no file storage yet) |
| KB-009/010 | Display source refs (doc/revision/page/section/req-ID) in answers | 🟡 UI done, mock-backed — Knowledge Copilot page (`#/knowledge`); every answer lists its sources (`knowledgeService.ts`, `components/knowledge/*`) |
| KB-011 | State insufficient information instead of guessing | 🟡 UI done, mock-backed — below-threshold / out-of-scope / nothing-indexed queries return `grounding: 'insufficient'` with no citation, plus a count of unsearchable docs. Deep research also lists each unsupported sub-question under "Not covered" |
| KB-012 | Answers grounded only in approved/indexed sources | 🟡 Mock enforces it: only `status: 'indexed'` docs in `documentStore` are searched, and every citation points at a real store document. Real enforcement is the backend's job |
| NFR-USE-002 | Evidence shown in an engineer-understandable form (source identity + page) | 🟡 Evidence panel / Sources view: title, revision, page, section, requirement ID, and an expandable excerpt |

### Administration UI (Section 6.4) — Week 4
| ID | Requirement | Status |
|---|---|---|
| ADM-001 | Distinguish normal users from admins | 🟡 Client-side-only demo toggle ("Admin View"/"User View" in `DocumentManagerModal.tsx`) — real gating needs backend auth |
| ADM-002 | Maintain list of pilot projects/subsystems for filtering | ✅ `DEFAULT_PROJECTS` in `constants/defaults.ts`, used by upload form + manager filters |
| ADM-003 | Admin can view document list + indexing status | ✅ `DocumentManagerModal.tsx` |
| ADM-004 | Show upload/indexing status and errors | ✅ Status badges + inline error message + expandable detail panel |
<<<<<<< HEAD
| ADM-005 | Basic model/service health info to admins | 🟡 UI done: Administration modal → Health (`components/admin/HealthPanel.tsx`). Checks run in the browser (chat endpoint model list, knowledge index state, gateway probe) until `GET /api/health` exists, and then use its report. Plan: `ADMIN_HEALTH_PLAN.md` |
| ADM-007 | Config to disable access to a project/doc set without deleting files | 🟡 UI done, client-side: Administration → Projects switches whole projects or subsystems off. The Copilot stops searching them and User View hides their docs; nothing is deleted or re-indexed (`ProjectAccessPanel.tsx`, `isDocumentAccessible`). Plan: `PROJECT_ACCESS_PLAN.md`. Real enforcement belongs in `GET /api/documents` / the query endpoint |
=======
| ADM-005 | Basic model/service health info to admins | ❌ Not started (Should) |
| ADM-007 | Config to disable access to a project/doc set without deleting files | 🟡 Per-document disable exists; project/doc-set-level toggle not built |
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af

Legend: ✅ done · 🟡 UI complete but backed by client-side mock/local state, not a real backend · ⚠️ partial · ❌ not started.

### Core chat (Section 6.1) — mostly done, small gaps
| ID | Requirement | Status |
|---|---|---|
| CHAT-001–004, 007, 008 | Chat UI, session context, new-session reset, English support | ✅ Done |
| CHAT-005 | Arabic prompts/responses | ✅ UI supports RTL/Arabic already — verify model responses render correctly |
| CHAT-006 | Admin can configure ≥1 general + 1 coding model | 🟡 UI done: model profiles (general/coding) in Settings → Models, editable in Admin View, at least one per role enforced; new conversations use the default profile; the model status above the Chat message box shows it and opens Settings → Intelligence (`modelProfiles.ts`, `AnswerStatusDock.tsx`; the header picker was removed on 2026-09-22). Plan: `MODEL_PROFILES_PLAN.md`. Seed model names are empty until the pilot models are chosen. Real source: `GET /api/models` |
| CHAT-009 | Display active model/profile for a conversation | ✅ The model status above the Chat message box shows the conversation's profile and model, and the model answering while it streams (`AnswerStatusDock.tsx`). Per-answer model captions were removed on 2026-09-22 (only the response time is shown); `message.modelId` / `profileName` are still stored and exported |
| CHAT-010 | Controlled internal API for platform clients | ❌ N/A to frontend directly, but frontend must migrate to it (see architecture note above) |

### Data/document metadata (Section 12.2) — feeds the upload UI
Fields the upload form / document list need to capture or display: **Project** (mandatory), **Subsystem**, **Document ID**, **Document Title** (mandatory), **Revision** (mandatory), **Document Type** (TRS/SRS/ICD/Design/Test/Report/etc.), **Approval Status**, **Classification**, **Page** (mandatory, auto from ingestion), **Section**, **Requirement ID**.

### Security-relevant UI behavior (Section 9.2, 10) — Week 4–5, shared with Code Copilot if in scope
Not directly my track (VS Code copilot is not part of the `app/` web frontend), but worth noting: any future admin actions I build must be auditable (`ADM-006`, `NFR-SEC-007`) and respect least-privilege — i.e., only call admin endpoints once real auth exists, don't fake admin state client-side only.

---

## 4. What's already achieved vs. what's needed — summary

**Achieved (maps to Week 1 exit deliverable "Local AI Chat reachable from at least 3 PCs"):**
- Full chat UI, multi-session, streaming, markdown, theming, settings/model config, responsive/RTL layout.

**Achieved 2026-09-21 (Week 2–4 foundation, mock-backed pending the real backend):**
- `src/types/index.ts` — `KnowledgeDocument`, `SourceReference`, `ProjectDefinition` types, matching the Section 12.2 metadata fields.
- `src/constants/defaults.ts` — `DEFAULT_PROJECTS` (pilot project/subsystem list), document type/approval/classification option lists, seed documents (indexed/indexing/error states) so the UI has representative content immediately.
- `src/stores/documentStore.ts` — mirrors `chatStore`'s pattern; holds documents/projects/filters, and simulates the pending→indexing→indexed/error ingestion pipeline client-side so the UI is ready to plug into a real ingestion API later without changing shape.
- `src/components/documents/DocumentUploadModal.tsx` — file picker/dropzone + metadata form (title, project, subsystem, doc ID, revision, type, approval status, classification), with validation.
- `src/components/documents/DocumentManagerModal.tsx` — admin document list: search, project/subsystem filters, status badges, per-row re-index/disable/remove actions, expandable detail panel, and an "Admin View"/"User View" toggle that gates the admin-only actions (stands in for ADM-001 until real auth exists).
- `src/components/documents/SourceCard.tsx` — reusable citation card (doc title, revision, page, section, requirement ID, expandable excerpt); demoed in the document manager's detail panel, ready to reuse once knowledge Q&A answers exist.
- Entry point: a Knowledge Base icon button in the sidebar footer (`Sidebar.tsx`) opens the manager; both modals are mounted in `App.tsx`.
- Verified: `tsc -b` clean, `oxlint` clean, and manually exercised in the browser (upload validation, cascading project→subsystem select, admin/user toggle, row expand/SourceCard render).

**Achieved 2026-09-21 — Knowledge Copilot page (mock-backed; plan in `KNOWLEDGE_COPILOT_PLAN.md`):**
- A separate page (`#/knowledge`), reached from the sidebar's two main menu items. Chat stays general-purpose. The sidebar's history list follows the active page (chat sessions vs. research threads).
- Quick | Deep research toggle. Deep splits the question, shows research steps, groups sources and lists "Not covered" sub-questions. An Evidence panel appears on wide screens; smaller screens get an Answer | Sources switch and a scope sheet.
- Chat sessions from the earlier in-chat knowledge mode are moved into Copilot threads on load, with their display preserved.
- All retrieval lives behind `queryKnowledgeBase()` in `src/services/knowledge/knowledgeService.ts`, which is the swap-in point for `POST /api/knowledge/query`. The request/response types (`KnowledgeQueryRequest`/`Response`) are in `types/index.ts`.
- The mock runs term-overlap retrieval over `mockPassages.ts` (a stand-in chunk index for the seed docs). It searches only indexed docs and falls back to a metadata-only passage for docs uploaded through the UI. The answer is extractive and cites each passage.
- Verified in the browser:
  - Chat has no knowledge UI, and Back from `#/knowledge` returns to `#/chat`.
  - The old knowledge session moved over as a thread.
  - Deep research on "ADCS safe mode rules and the EPS primary bus voltage" cites ADCS-SRS-041 and lists the EPS part under Not covered.
  - Clicking [1] selects that source in the Evidence panel.
  - Mobile (400px) shows the Answer | Sources switch and the scope sheet.
  - Earlier checks still hold: an unrelated question and a Ground Segment-scoped question both return insufficient information.

**Explicitly NOT done yet (still needed, in priority order):**
1. **Real backend wiring**: everything above runs against `documentStore`'s local/mock state (persisted to `localStorage`), not `POST /api/documents` etc. Swap-in point is the store's action bodies once Hussin's FastAPI endpoints exist.
2. ~~Knowledge Copilot surface~~ — UI done (see above). Remaining: replace the body of `queryKnowledgeBase()` with the real `POST /api/knowledge/query` call once Hussin/Hesham's endpoint exists. The response must include page-level sources and a grounded/insufficient flag. Delete `mockPassages.ts` at that point.
3. **Document summary / compare-revisions actions** (KB-016, KB-017): deferred by decision on 2026-09-21. The planned home is the Copilot page (see `KNOWLEDGE_COPILOT_PLAN.md` §3.4).
<<<<<<< HEAD
4. ~~Health-check panel for admins (ADM-005)~~: UI done 2026-09-22. Remaining: agree on the `SystemHealthReport` shape (`types/index.ts`) with Hussin for `GET /api/health`.
5. **Week 6**: UI polish, defect fixes, and a short user guide for the web UI (my piece of `D-12 User and administrator guide`). Done early on 2026-09-22: modal keyboard access (Esc, focus trap), Documents restyle (`DOCUMENTS_RESTYLE_PLAN.md`), unit tests (`npm test`), API key moved out of localStorage, fonts self-hosted for offline use (CHAT-003), cloud provider presets removed (CHAT-002). User guide drafted 2026-09-22 in `docs/USER_GUIDE.md` (D-12, web part), pending team review. Productivity/trust UX round 1 applied (shortcuts, answer feedback + CSV for D-14, screen-reader support, pin/date groups/drafts, source freshness, conversation memory): `PRODUCTIVITY_UX_PLAN.md`. Next round: command palette + saved `/` prompts.
=======
4. **Health-check panel for admins** (ADM-005).
5. **Week 6**: UI polish, defect fixes, and a short user guide for the web UI (my piece of `D-12 User and administrator guide`).
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af

**Blocked on teammates:**
- Backend API endpoints (Hussin) — needed to replace the mock store with real calls.
- Document ingestion + retrieval quality (Hesham) — needed for the knowledge Q&A surface (item 2) to return real citations instead of demo ones.
- Pilot document set + benchmark questions (Technical Lead) — needed to validate the upload/list/Q&A UI against real content.
