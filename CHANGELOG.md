# Changelog

All notable changes to the EgSA AI Platform web app.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Newest first. Reference spec requirement IDs (KB-013, ADM-004…) where relevant.

Entry template:
```
### Added | Changed | Fixed | Removed
- Short description (REQ-IDs) — `path/to/main/file.tsx`
```

---

## [Unreleased]

### Added
- **Knowledge Copilot page (mock-backed)**: a separate page for grounded Q&A and deep research over indexed documents (KB-009, KB-010, KB-011, KB-012, KB-018, NFR-USE-002). Plan: `agent/KNOWLEDGE_COPILOT_PLAN.md`.
  - Navigation between Chat and Knowledge Copilot through the URL hash (`#/chat`, `#/knowledge`); Back/Forward work — `src/stores/navigationStore.ts`
  - Sidebar gets two main menu items (Chat / Knowledge Copilot). Its history list follows the active page: chat sessions or Copilot research threads — `src/components/layout/Sidebar.tsx`
  - Copilot page: top bar with project/subsystem scope, an indexed-document count and "Manage documents". Research turns in the centre, an Evidence panel on wide screens (≥1100px), and a scope sheet plus an Answer | Sources switch on smaller screens — `src/components/knowledge/*`
  - **Quick | Deep research**. Deep splits the question into sub-questions, researches each, shows its research steps, and lists "Not covered" parts (KB-011 per sub-question) — `src/services/knowledge/knowledgeService.ts`
  - `queryKnowledgeBase()` is the single swap-in point for `POST /api/knowledge/query`. It searches only `indexed` documents from `documentStore` and never forces a citation. Mock chunk index — `src/services/knowledge/mockPassages.ts`
  - `knowledgeStore` (`egsa_ai_knowledge`): threads, turns, scope/depth, evidence focus, stop, Markdown export with sources
  - Clickable `[n]` citation markers select the matching source (`MarkdownRenderer` `onCitationClick`)
  - Spacing scale `--space-1`…`--space-8` in `tokens.css`, plus `styles/knowledge.css` (nav item, segmented control, citation marker, source row, suggestion row, sheet) with hover, pressed, keyboard-focus and disabled states, per `.agent/design_system.md`
  - `BookOpenIcon`; `KNOWLEDGE_SUGGESTIONS` for the empty state
- Project tracking docs: `agent/CONTEXT.md` (architecture, code map, conventions), this `CHANGELOG.md`, `CLAUDE.md` entry point; `README.md` rewritten for the project (was the Vite template).
- **Knowledge Base document management (mock-backed)** — Week 2–4 foundation:
  - Types `KnowledgeDocument`, `SourceReference`, `ProjectDefinition` + document enums matching spec §12.2 metadata — `src/types/index.ts`
  - `DEFAULT_PROJECTS`, document type/approval/classification option lists, seed documents — `src/constants/defaults.ts`
  - `documentStore` with simulated pending → indexing → indexed/error pipeline; `*.scan.pdf` simulates an OCR failure — `src/stores/documentStore.ts`
  - Upload modal: dropzone + metadata form with validation, cascading project → subsystem (KB-013) — `src/components/documents/DocumentUploadModal.tsx`
  - Document manager: search, project/subsystem filters, status badges, re-index / disable / remove actions, expandable detail, Admin/User view toggle (KB-014, KB-015, ADM-001 demo, ADM-003, ADM-004) — `src/components/documents/DocumentManagerModal.tsx`
  - `SourceCard` citation component (doc, revision, page, section, requirement ID, excerpt) (KB-018) — `src/components/documents/SourceCard.tsx`
  - Knowledge Base button in sidebar footer; modals mounted in `App.tsx`; new icons (UploadCloud, FileText, Folder, Filter, Database) — `src/components/layout/Sidebar.tsx`, `src/components/ui/Icons.tsx`

### Changed
- Chat is general-purpose only again. A short-lived in-chat "Knowledge mode" (never committed) was replaced by the Copilot page. Chat sessions saved in that mode are moved into Copilot threads on load, keeping their questions, answers and citations.
- `App.tsx` switches between `ChatPage` (new wrapper for Header / MessageList / ChatInput) and `KnowledgeCopilotPage`.
- `SourceCard` is restyled as a flat, hairline-separated row with an optional citation number and controlled selection. The document manager uses the same component.
- `FilterSelect` extracted from `DocumentManagerModal` into `src/components/documents/FilterSelect.tsx` (shared with the Copilot scope controls).
- `agent/PROJECT_PLAN.md` updated with KB/ADM status after the document-management work.

---

## 2026-09-21

- `9861b9c` **docs:** added `agent/PROJECT_PLAN.md` — role-scoped task plan and gap analysis against the requirements spec.
- `8dde99e` **fix:** chat streaming/state fixes in `chatStore`, `MessageList`, `apiProvider`; `createStore` resets stuck streaming flags on load.
- `81a1f7d` **fix:** custom API provider connection (URL normalization, model discovery, connection test); added `Dockerfile` (nginx static serve).

## 2026-09-17

- `7a3875b` **update — tune UI:** Arabic font options + text-direction (RTL) settings, markdown rendering tweaks, dev `/api/ai-proxy` middleware in `vite.config.ts` for CORS-free endpoint testing.
- `b222c7c` **update — responsive design:** mobile layout, `useMediaQuery`/`useIsMobile` hook, sidebar/header/settings responsive rework.
- `9386660` **UI redesign:** Apple-HIG-inspired design system (`.agent/design_system.md`, `tokens.css`), logos, `SmoothStreamBuffer`, `DeleteChatModal`, redesigned chat, sidebar, header, settings.
- `af507c5` **initial:** Vite + React + TS app, multi-session chat, mock + OpenAI-compatible providers, settings.
