# EgSA AI Platform — Web App Context

> What this app is, how it's put together, and the conventions to follow when changing it.
> Companion files: [`PROJECT_PLAN.md`](PROJECT_PLAN.md) (requirements → status, what's next) · [`KNOWLEDGE_COPILOT_PLAN.md`](KNOWLEDGE_COPILOT_PLAN.md) (Copilot page design) · [`../CHANGELOG.md`](../CHANGELOG.md) (what changed, when) · [`../.agent/design_system.md`](../.agent/design_system.md) (visual design rules).
> Last reviewed: 2026-09-21

---

## 1. Purpose

Frontend for the **EgSA AI Engineering Platform**, a 6-week pilot for the Egyptian Space Agency: a locally-hosted AI platform with
1. a **general AI chat** (CHAT-*),
2. an **Engineering Knowledge Copilot** — RAG over engineering documents with source citations (KB-*),
3. **admin workflows** for documents/projects/health (ADM-*).

(The VS Code coding copilot is also part of the pilot but is **not** in this repo.)

Spec: `E:\Egsa_ai-platform\EgSA_AI_Engineering_Platform_Project_Requirements - 2026.pdf` (Rev 0.1, 06 Sep 2026).
Owner of this app: Mohamed Hany (Full-Stack / Workflow Lead). Backend/gateway: Hussin Saleh. RAG/models: Mohamed Hesham.

## 2. Stack & commands

| | |
|---|---|
| Framework | React 19 + TypeScript 6, Vite 8 |
| State | Custom `createStore` (tiny zustand-like store on `useSyncExternalStore`, optional `localStorage` persistence) |
| Styling | CSS tokens (`src/styles/tokens.css`) + global classes (`global.css`) + **inline `style={{}}` objects** in components |
| Icons | Hand-written SVG components in `src/components/ui/Icons.tsx` |
| Lint | oxlint (`.oxlintrc.json`) |
| Deploy | `Dockerfile` — multi-stage build → nginx static serve on :80 (behind the gateway) |

```
npm run dev      # Vite dev server on :5173 (also mounts the /api/ai-proxy dev middleware)
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

Note: `zustand` and `lucide-react` are listed in `package.json` but **not imported anywhere** — don't assume they're in use.

## 3. Code map

```
src/
  App.tsx                    Root layout: Sidebar | active page (ChatPage or KnowledgeCopilotPage) + all modals mounted;
                             applies theme / font-scale / accent / RTL attributes to <html>
  main.tsx                   Entry
  types/index.ts             All shared types (chat, settings, KnowledgeDocument, SourceReference, ProjectDefinition)
  constants/defaults.ts      Models, personas, provider presets, default prefs/AI config,
                             document option lists, DEFAULT_PROJECTS, seed DEFAULT_DOCUMENTS
  stores/
    createStore.ts           Store factory; persistKey → localStorage; deep-merges saved objects over defaults;
                             resets isStreaming/abortStream on load
    chatStore.ts             Sessions, messages, streaming send/stop/regenerate, export ('egsa_ai_sessions')
    settingsStore.ts         UI preferences + AIConfiguration, settings modal state ('egsa_ai_settings')
    documentStore.ts         Knowledge Base docs/projects/filters, upload + simulated indexing ('egsa_ai_documents')
    knowledgeStore.ts        Copilot threads/turns, scope + Quick|Deep depth, evidence focus, ask/stop/export ('egsa_ai_knowledge');
                             one-time migration of old in-chat knowledge-mode sessions into threads
    navigationStore.ts       activeView 'chat' | 'knowledge', synced with the URL hash (#/chat, #/knowledge)
  services/ai/
    base.ts                  LLMProvider interface (generateStream)
    providerRegistry.ts      Picks mock vs CustomAPIProvider from AIConfiguration
    mockProvider.ts          Canned streaming responses (no backend needed)
    apiProvider.ts           OpenAI-compatible client: URL normalization, model discovery, connection test, SSE streaming
    streamBuffer.ts          SmoothStreamBuffer — paces token rendering
  services/knowledge/
    knowledgeService.ts      queryKnowledgeBase() — THE swap-in point for POST /api/knowledge/query (mock retrieval today)
    mockPassages.ts          Stand-in chunk index for seed docs (delete when the real endpoint lands)
  components/
    layout/Sidebar.tsx       Chat / Knowledge Copilot main menu; history list follows the active page (sessions or threads);
                             search/rename/delete/export; Knowledge Base (documents) button in footer
    layout/Header.tsx        Model/persona display, theme toggle, account menu (decorative, no auth)
    chat/                    ChatPage (Header+MessageList+ChatInput), MessageList, MessageItem, ChatInput,
                             MarkdownRenderer (hand-rolled; optional clickable [n] citations), DeleteChatModal
    knowledge/               KnowledgeCopilotPage (top bar, scope, empty state, scope sheet), ResearchTurn,
                             EvidencePanel (≥1100px), KnowledgeComposer (Quick|Deep)
    settings/SettingsModal   Appearance / Intelligence / Engine & API / About tabs (largest file, ~1.4k lines)
    documents/               DocumentManagerModal (admin list), DocumentUploadModal (upload + metadata), SourceCard (citation),
                             FilterSelect (shared project/subsystem pill)
    ui/                      Icons, Logo
  hooks/useMediaQuery.ts     useMediaQuery / useIsMobile(768)
  styles/                    tokens.css (design tokens incl. --space-1..8, light/dark), global.css,
                             knowledge.css (stateful classes: nav-item, segmented, citation-marker, source-row, sheet…)
vite.config.ts               Dev-only /api/ai-proxy middleware (forwards to x-target-url, streams SSE) to dodge CORS
```

## 4. How things flow

- **Chat:** `ChatInput` → `chatStore.sendMessage` → `providerRegistry.getActiveProvider(aiConfig)` → `generateStream` → chunks go through `SmoothStreamBuffer` → message content updated in store → `MessageItem` renders via `MarkdownRenderer`.
- **Provider selection:** `aiConfig.providerType` `mock` → `MockLLMProvider`; `custom-api`/`openai-compatible` + `customEndpointUrl` → `CustomAPIProvider` (optionally routed through `/api/ai-proxy` when `useProxy`). The browser currently talks **directly** to the model endpoint.
- **Knowledge Base:** Sidebar button → `documentStore.openManager` → `DocumentManagerModal` (filters, row actions gated by `isAdminMode`) → "Upload" → `DocumentUploadModal` → `uploadDocument` → `simulateIndexing` (pending → indexing → indexed, or error for `*.scan.pdf`). All client-side.
- **Pages:** `navigationStore.activeView` (from the URL hash) picks `ChatPage` or `KnowledgeCopilotPage`. The sidebar is shared, and its list shows chat sessions or Copilot threads depending on the page.
- **Knowledge Copilot:** `KnowledgeComposer` → `knowledgeStore.ask(question)` → `queryKnowledgeBase({question, scope, depth}, {signal, onStep})`.
  - Steps stream into the turn as research steps. The result's `sources` / `grounding` / `uncovered` / `consultedDocumentIds` land on the turn, and the answer text streams through `SmoothStreamBuffer`.
  - `ResearchTurn` renders the answer with clickable `[n]` markers → `focusSource` → `EvidencePanel` (or the inline Sources view on narrow screens).
  - Grounding rule: only `status: 'indexed'` docs are searched, citations always point at real `documentStore` docs, and there is no citation when evidence is insufficient.
- **Modals** are always mounted in `App.tsx` and self-hide based on store flags (`isSettingsOpen`, `isManagerOpen`, `isUploadModalOpen`).

## 5. Mock vs. real — what's fake right now

| Area | Current state | Real target (spec Appendix D) |
|---|---|---|
| Chat | Mock provider or direct OpenAI-compatible call from browser | `POST /api/chat` on EgSA gateway (INT-004) |
| Documents | `documentStore` local state + `localStorage`, seeded from `DEFAULT_DOCUMENTS` | `GET/POST /api/documents`, ingestion API |
| Indexing | `setTimeout` simulation | Backend ingestion status |
| Knowledge Copilot | `queryKnowledgeBase()`: term-overlap search over `mockPassages.ts` for indexed docs (metadata-only passage for UI uploads), extractive answer. Deep mode splits the question on and/,/?; research steps are simulated with delays | `POST /api/knowledge/query` → `KnowledgeQueryResponse` (answer, sources, grounding, steps, uncovered, consultedDocumentIds) |
| Citations | `SourceCard` rows built from mock passages | Sources returned by the query endpoint |
| Research threads | `knowledgeStore` in `localStorage` | Server-side history if/when the gateway stores it |
| Auth / admin | `isAdminMode` client toggle | Real auth + role from backend (ADM-001) |

Swap-in points are the store action bodies — keep component-facing store shapes stable when wiring the backend.

## 6. Conventions

- **New state** → a new `createStore` store in `src/stores/`, mirroring `chatStore`/`documentStore` shape (state + actions in one object, `set`/`get`). Pass a `persistKey` only if it should survive reloads.
- **Types** live in `src/types/index.ts`; **static options/seed data** in `src/constants/defaults.ts`.
- **Styling:** use CSS variables from `tokens.css` (`var(--bg-primary)`, `var(--text-secondary)`, `var(--radius-md)`, `var(--space-4)`, `var(--accent-primary)` …) inside inline style objects; never hardcode colors that break dark mode. **New UI must follow `.agent/design_system.md` strictly** (Apple-HIG-inspired: hierarchy through type + whitespace, cards only when useful, one accent, subtle motion). Interactive controls that need hover, pressed, keyboard-focus and disabled states get a class in a stylesheet (see `styles/knowledge.css`) rather than `onMouseEnter` handlers.
- **Icons:** add a new SVG component to `Icons.tsx` in the same pattern (`size`, `className`, `...props`) rather than pulling a library.
- **RTL/Arabic** must keep working — respect `direction` props and `data-text-direction`.
- **Responsive:** use `useIsMobile()`; mobile breakpoint is 768px.
- Reference requirement IDs (KB-013, ADM-004…) in comments where a feature maps to the spec.
- Before calling a change done: `npx tsc -b` and `npm run lint` clean (both clean as of 2026-09-21).

## 7. Gotchas

- `createStore` persists the **whole state** on every `set`, including UI flags (modal open, filters). Persisted object fields are merged over defaults, but arrays (e.g. `documents`, `sessions`) are replaced wholesale — changing seed data won't show up for users who already have saved state; clear the `localStorage` key.
- Theme/font-scale logic exists in both `App.tsx` effects and `settingsStore` setters (duplicated `scaleMap`).
- `README.md` was the stock Vite template until 2026-09-21.
- Writing a file in two steps (e.g. `git show HEAD:f > f`) can let the Vite dev server cache an empty module ("does not provide an export named…"). `touch` the file to fix it.
- `E:\Egsa_ai-platform\frontend\` is a stale duplicate of this app — work here in `app/`.
