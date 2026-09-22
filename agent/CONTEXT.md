# EgSA AI Platform — Web App Context

> What this app is, how it's put together, and the conventions to follow when changing it.
> Companion files: [`PROJECT_PLAN.md`](PROJECT_PLAN.md) (requirements → status, what's next) · [`KNOWLEDGE_COPILOT_PLAN.md`](KNOWLEDGE_COPILOT_PLAN.md) (Copilot page design) · [`../CHANGELOG.md`](../CHANGELOG.md) (what changed, when) · [`../.agent/design_system.md`](../.agent/design_system.md) (visual design rules).
> Last reviewed: 2026-09-22

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
| Lint / tests | oxlint (`.oxlintrc.json`) · Vitest |
| Deploy | `Dockerfile` — multi-stage build → nginx static serve on :80 (behind the gateway) |

```
npm run dev      # Vite dev server on :5173 (also mounts the /api/ai-proxy dev middleware)
npm run build    # tsc -b && vite build
npm run lint     # oxlint
npm test         # vitest run — *.test.ts next to the code they cover
```

Fonts are self-hosted through `@fontsource/*` (`src/styles/fonts.ts`); nothing loads from the Internet (CHAT-003).

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
    settingsStore.ts         UI preferences + AIConfiguration + model profiles (CHAT-006), settings modal state ('egsa_ai_settings');
                             the API key is kept in sessionStorage only, never localStorage
    roleStore.ts             Admin View / User View demo flag (ADM-001), shared by Administration and Settings ('egsa_ai_role')
    feedbackStore.ts         Answer ratings + reasons + comments, CSV export ('egsa_ai_feedback'; swap point: POST /api/feedback)
    uiStore.ts               Shortcuts sheet open flag + toast (not persisted)
    documentStore.ts         Knowledge Base docs/projects/filters, upload + simulated indexing, project access switches +
                             isDocumentAccessible() (ADM-007) ('egsa_ai_documents')
    knowledgeStore.ts        Copilot threads/turns, scope + Quick|Deep depth, evidence focus, ask/stop/export ('egsa_ai_knowledge');
                             one-time migration of old in-chat knowledge-mode sessions into threads
    healthStore.ts           Service health report + check() for the admin Health section (not persisted)
    navigationStore.ts       activeView 'chat' | 'knowledge', synced with the URL hash (#/chat, #/knowledge)
  services/ai/
    base.ts                  LLMProvider interface (generateStream)
    modelProfiles.ts         Profile rules + resolveModelTarget(profile, config) → demo | live | unconfigured (CHAT-006)
    context.ts               What the model is sent: cleanHistory/buildAppContext (app-managed) vs latest message + ids (server-managed)
    providerRegistry.ts      getProvider(target, config): mock vs CustomAPIProvider
    mockProvider.ts          Canned streaming responses (no backend needed)
    mockCodeSamples.ts       Demo code answers per language + review samples with deliberate problems
    apiProvider.ts           OpenAI-compatible client: URL normalization, model discovery, connection test, SSE streaming
    streamBuffer.ts          SmoothStreamBuffer — paces token rendering
  services/code/
    languages.ts             Supported code languages, aliases, display names (no highlight.js)
    highlight.ts             highlight.js core + 10 languages; dynamically imported by CodeBlock
    codeCheck.ts             Quick code checks (brackets, JSON, indentation, '=' in conditions, style)
  services/knowledge/
    knowledgeService.ts      queryKnowledgeBase() — THE swap-in point for POST /api/knowledge/query (mock retrieval today)
    mockPassages.ts          Stand-in chunk index for seed docs (delete when the real endpoint lands)
  services/health/
    healthService.ts         getSystemHealth() — THE swap-in point for GET /api/health (browser-side checks until it exists)
  components/
    layout/Sidebar.tsx       Chat / Knowledge Copilot main menu; history list follows the active page (sessions or threads);
                             search/rename/delete/export; Knowledge Base (documents) button in footer
    layout/Header.tsx        Model/persona display, theme toggle, account menu (decorative, no auth)
    chat/                    ChatPage (Header+MessageList+ChatInput), MessageList, MessageItem, ChatInput,
                             MarkdownRenderer (hand-rolled; optional clickable [n] citations), DeleteChatModal
    knowledge/               KnowledgeCopilotPage (top bar, scope, empty state, scope sheet), ResearchTurn,
                             EvidencePanel (≥1100px), KnowledgeComposer (Quick|Deep)
    settings/                SettingsModal (shell + tab nav), AppearanceTab, ModelTab (+ ModelProfilesSection), ApiTab, AboutTab,
                             SettingsControls (shared rows/toggles)
    chat/CodeBlock           Code block: highlighting (lazy highlight.js), line numbers, quick checks, copy
    chat/AnswerStatusDock    Astronaut + model status docked above the message box (stage from hooks/useAnswerStage); in Chat it's the model control → Settings → Intelligence
    ui/Astronaut             The EgSA astronaut SVG (poses: thinking, writing, done, stopped)
    chat/WelcomeStarfield    Canvas starfield behind the empty-chat welcome only (unmounts once a chat starts)
    chat/WelcomeLogo         Canvas-drawn, animated EgSA mark on the empty-chat welcome (geometry in the 1200×880 logo space)
    ui/Menu                  Popover menu (keyboard, outside click, Esc); used by document rows
    admin/StatusGlyph        Shape-per-status glyph shared by Health and Documents
    admin/FeedbackPanel      Administration → Feedback (totals, latest ratings, Export CSV)
    feedback/AnswerFeedback  👍/👎 + inline reasons + comment; hosts an answer's other actions in the same row
    ui/LiveAnnouncer         One polite live region announcing answers (from store subscriptions)
    ui/ShortcutsDialog       Keyboard shortcuts sheet + Toast
    admin/HealthPanel        Service health list (ADM-005), shown in the Administration modal's Health section
    admin/ProjectAccessPanel Project/subsystem on-off switches (ADM-007), Administration → Projects
    documents/               DocumentManagerModal (Administration modal: Documents | Projects | Health, admin list), DocumentUploadModal (upload + metadata), SourceCard (citation),
                             FilterSelect (shared project/subsystem pill)
    ui/                      Icons, Logo
  hooks/useMediaQuery.ts     useMediaQuery / useIsMobile(768)
  hooks/useResolvedTheme.ts  useIsDarkTheme()
  hooks/useShortcuts.ts      App-wide keyboard shortcuts + SHORTCUTS table (shown in the ? sheet)
  utils/                     dateGroups, history (conversation memory), drafts (per-conversation composer text),
                             keyboard (isMac, isTypingTarget, list arrow keys), speech (screen-reader excerpts)
  hooks/useDialog.ts         Modal keyboard behaviour: Esc closes the topmost dialog, focus in/out, Tab trap
  styles/                    tokens.css (design tokens incl. --space-1..8, light/dark), global.css,
                             components.css (stateful classes: nav-item, segmented, citation-marker, source-row, sheet, health-row…)
vite.config.ts               Dev-only /api/ai-proxy middleware (forwards to x-target-url, streams SSE) to dodge CORS
```

## 4. How things flow

- **Chat:** `ChatInput` → `chatStore.sendMessage` → `resolveProfile(session.profileId)` → `resolveModelTarget` → `providerRegistry.getProvider(target)` → `generateStream` → chunks go through `SmoothStreamBuffer` → message content updated in store → `MessageItem` renders via `MarkdownRenderer`.
- **Provider selection (CHAT-006):** each conversation has a model profile (general/coding). A profile goes to its own endpoint or the platform endpoint (Engine & API); with neither it runs the mock provider (demo). Its model name falls back to the endpoint default model; with none, the answer says "Model not configured" (no silent cloud fallback). The browser still talks **directly** to the model endpoint.
- **Knowledge Base:** Sidebar button → `documentStore.openManager` → `DocumentManagerModal` (filters, row actions gated by `roleStore.isAdmin`) → "Upload" → `DocumentUploadModal` → `uploadDocument` → `simulateIndexing` (pending → indexing → indexed, or error for `*.scan.pdf`). All client-side.
- **Pages:** `navigationStore.activeView` (from the URL hash) picks `ChatPage` or `KnowledgeCopilotPage`. The sidebar is shared, and its list shows chat sessions or Copilot threads depending on the page.
- **Knowledge Copilot:** `KnowledgeComposer` → `knowledgeStore.ask(question)` → `queryKnowledgeBase({question, scope, depth}, {signal, onStep})`.
  - Steps stream into the turn as research steps. The result's `sources` / `grounding` / `uncovered` / `consultedDocumentIds` land on the turn, and the answer text streams through `SmoothStreamBuffer`.
  - `ResearchTurn` renders the answer with clickable `[n]` markers → `focusSource` → `EvidencePanel` (or the inline Sources view on narrow screens).
  - Grounding rule: only `status: 'indexed'` docs whose project/subsystem is switched on (`isDocumentAccessible`, ADM-007) are searched, citations always point at real `documentStore` docs, and there is no citation when evidence is insufficient.
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
| Service health | `healthService`: probes `/api/health`; otherwise chat endpoint `GET /models`, `documentStore` index counts | `GET /api/health` → `SystemHealthReport` |
| Model profiles | `settingsStore.profiles` (seeded, admin-editable) | `GET /api/models` |
| Answer feedback | `feedbackStore` in this browser, CSV export | `POST /api/feedback` |
| Auth / admin | `roleStore.isAdmin` client toggle | Real auth + role from backend (ADM-001) |

Swap-in points are the store action bodies — keep component-facing store shapes stable when wiring the backend.

## 6. Conventions

- **New state** → a new `createStore` store in `src/stores/`, mirroring `chatStore`/`documentStore` shape (state + actions in one object, `set`/`get`). Pass a `persistKey` only if it should survive reloads.
- **Types** live in `src/types/index.ts`; **static options/seed data** in `src/constants/defaults.ts`.
- **Styling:** use CSS variables from `tokens.css` (`var(--bg-primary)`, `var(--text-secondary)`, `var(--radius-md)`, `var(--space-4)`, `var(--accent-primary)` …) inside inline style objects; never hardcode colors that break dark mode. **New UI must follow `.agent/design_system.md` strictly** (Apple-HIG-inspired: hierarchy through type + whitespace, cards only when useful, one accent, subtle motion). Interactive controls that need hover, pressed, keyboard-focus and disabled states get a class in a stylesheet (see `styles/components.css`) rather than `onMouseEnter` handlers.
- **Icons:** add a new SVG component to `Icons.tsx` in the same pattern (`size`, `className`, `...props`) rather than pulling a library.
- **RTL/Arabic** must keep working — respect `direction` props and `data-text-direction`.
- **Responsive:** use `useIsMobile()`; mobile breakpoint is 768px.
- Reference requirement IDs (KB-013, ADM-004…) in comments where a feature maps to the spec.
- Before calling a change done: `npx tsc -b`, `npm run lint` and `npm test` clean (all clean as of 2026-09-22).
- **Modals** use `useDialog` + `role="dialog" aria-modal`. **Popover menus** use `components/ui/Menu`. **Status** is `StatusGlyph` + a word.
- **Persistence:** `createStore(creator, key, { partialize, rehydrate })`. Use `partialize` to keep secrets out of localStorage and `rehydrate` to reconcile saved arrays with new seed data (`reconcileProjects`, `reconcileProfiles`).

## 7. Gotchas

- Anything positioned relative to the Chat composer (message list end padding, the scroll-to-latest button) must use `--chat-composer-h`, which `ChatInput` sets on `<html>` from its measured height. Don't use fixed pixel offsets: the input grows with the text, and the status dock sits in its top padding.
- `createStore` persists the state on every `set`, including UI flags (modal open, filters). Persisted object fields are merged over defaults, but arrays (e.g. `documents`, `sessions`) are replaced wholesale — changing seed data won't show up for users who already have saved state unless the store reconciles it in `rehydrate` (projects and profiles do; documents and sessions don't).
- Preferences are applied to `<html>` only by the effects in `App.tsx`; `settingsStore` setters just update state.
- Two modals can't both handle Esc: `useDialog` only acts for the topmost one and ignores Esc while focus is inside a `role="menu"`.
- `README.md` was the stock Vite template until 2026-09-21.
- Writing a file in two steps (e.g. `git show HEAD:f > f`) can let the Vite dev server cache an empty module ("does not provide an export named…"). `touch` the file to fix it.
- `E:\Egsa_ai-platform\frontend\` is a stale duplicate of this app — work here in `app/`.
