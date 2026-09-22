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
<<<<<<< HEAD
- **Astronaut status companion**: a small astronaut, redrawn as a theme-aware SVG from `src/assets/pet.jpg`, is docked above the message box while an answer is produced. It searches with a lens ("Thinking…" / "Searching documents…"), types while text streams ("Writing…" / "Writing code…"), gives a brief check-mark "Done" (or a shrug for Stopped/failed), then disappears. It runs in Chat and the Knowledge Copilot, is CSS-only, stops under reduced motion, and can be turned off in Settings → Appearance → *Answer status companion*. Plan: `agent/ASTRONAUT_STATUS_PLAN.md` — `src/components/ui/Astronaut.tsx`, `src/components/chat/AnswerStatusDock.tsx`, `src/hooks/useAnswerStage.ts`
- **Conversation context per model profile**: *This app sends it* (default; cleaned recent history, needed for stateless Ollama / LM Studio / OpenRouter endpoints) or *Server keeps it*. The latter sends only the new question plus `conversation_id` / `message_id` / `replaces_message_id` (and `X-Conversation-Id`) for a gateway that stores conversations. The proposed contract is in `agent/PROMPTING_CONTEXT_PLAN.md` §3a — `src/services/ai/context.ts`, Settings → Models
- **Code blocks: syntax highlighting + quick checks** (plan: `agent/CODE_BLOCKS_PLAN.md`):
  - **Highlighting:** Python, C, C++, TypeScript, JavaScript, Java, MATLAB, SQL, Bash and JSON (aliases like `py` and `ts` work, and unlabelled blocks are auto-detected). It uses bundled highlight.js, loaded on demand and offline, with light and dark `--syntax-*` colours. Code blocks also get line numbers. While an answer streams, its code stays plain text.
  - **Checks:** unbalanced brackets (strings and comments are ignored), invalid JSON, tabs and spaces mixed, `=` inside `if`/`while` in C-like languages, Python `== None` and non-4-space indentation, trailing whitespace, lines over 120 characters, and TODO/FIXME. The header shows "✓ No issues" or "▲ N warnings · M notes", which expands into a list, and flagged lines are marked in the gutter — `src/components/chat/CodeBlock.tsx`, `src/services/code/*`
  - **Demo-mode code samples:** asking for code in any of the 10 languages gets a realistic space-domain sample, and asking for a *code review* returns flawed C or Python that the checks flag — `src/services/ai/mockCodeSamples.ts`
- **Productivity and trust UX, round 1** (plan: `agent/PRODUCTIVITY_UX_PLAN.md`):
  - **Keyboard shortcuts** (`useShortcuts`):
    - Ctrl/⌘+Shift+O new conversation/thread, `/` focus the message box, Esc stop an answer.
    - ↑ in an empty chat box edits your last message; Ctrl/⌘+Shift+C copies the last answer; Ctrl/⌘+Shift+S toggles the sidebar.
    - ↑/↓ move through suggestion lists.
    - `?` (or account menu → Keyboard shortcuts) opens the shortcuts sheet (`ShortcutsDialog`).
  - **Answer feedback**: 👍/👎 under every Chat and Copilot answer. A 👎 opens reason chips (Inaccurate, Wrong source, Not relevant, Incomplete, Unclear) and an optional comment, all inline. **Administration → Feedback** shows the totals and the latest ratings, with **Export CSV** for the pilot report (D-14) — `AnswerFeedback.tsx`, `feedbackStore.ts`, `FeedbackPanel.tsx`
  - **Screen readers**: one polite live region announces "Assistant is responding…" and then a short answer excerpt (never token by token). Messages carry "You said" / "Assistant said" labels, the chat is a `role="log"`, and errors use `role="alert"` — `LiveAnnouncer.tsx`
  - **Sidebar**: pin conversations and research threads; history grouped as Pinned · Today · Yesterday · Previous 7 days · Previous 30 days · Older; rows are keyboard-operable
  - **Drafts and scroll kept per conversation**: unsent text survives switching and reloading (sessionStorage), and returning to a conversation restores where you were — `utils/drafts.ts`, `MessageList.tsx`
  - **Source freshness and match strength**: Copilot sources show "Strong/Partial match · indexed <date>", and partial matches carry a check-this-passage note — `SourceCard.tsx`, `SourceReference.relevance/indexedAt`
  - **Conversation memory**: chat sends only the last 30 messages (Settings → Intelligence → Conversation memory, 10–100), and a divider in the conversation marks where older messages stop being sent — `utils/history.ts`
- **Branded favicon**: a simplified EgSA mark (tilted orbit, red swoosh, satellite) replaces the Vite logo. It turns light on dark browser chrome; `theme-color` meta for light/dark — `public/favicon.svg`, `index.html`
- **Animated welcome logo (canvas)**: the empty-chat welcome screen draws the EgSA mark on a canvas, matching the official artwork (orbit with its gaps, swoosh with the red crescent, "EgSA", satellite, Arabic/English agency lines) in theme colours with the true brand red. A one-time ~1.7 s intro (the orbit sweeps in, the satellite glides into place, the text fades in) is followed only by a slight satellite drift and an antenna blink. It pauses in background tabs and is drawn still under reduced motion; the sidebar logo stays static — `src/components/chat/WelcomeLogo.tsx`; `useIsDarkTheme` in `src/hooks/useResolvedTheme.ts` (shared with `Logo`)
- **Starfield on the chat welcome screen**: faint twinkling stars and an occasional shooting star, only while the conversation is empty. It fades out and is removed when the chat starts, pauses in background tabs, and is still under reduced motion. Plan: `agent/WELCOME_ANIMATION_PLAN.md` — `src/components/chat/WelcomeStarfield.tsx`
- **User and administrator guide** for the web app (D-12, web part; draft for review) — `docs/USER_GUIDE.md`
- **Model profiles: general and coding (CHAT-006)**. Admins manage profiles in Settings → Models: name, role, model name, and an optional endpoint. At least one profile per role is always kept, with one default per role. Each conversation picks a profile from the header menu, and each answer's caption shows profile · model (CHAT-009). Health now checks the default general and coding models. Plan: `agent/MODEL_PROFILES_PLAN.md` — `src/services/ai/modelProfiles.ts`, `src/components/chat/ProfilePicker.tsx`, `src/components/settings/ModelProfilesSection.tsx`
- Unit tests with Vitest (`npm test`): knowledge grounding and ADM-007 gating, project access and reconciliation, health status, model profile rules, endpoint URL normalisation.
- `useDialog` hook: Esc closes the topmost modal, focus moves in and back out, and Tab stays inside. Applied to the Administration, Upload and Settings modals, which also get `role="dialog"`/`aria-modal`.
- `Menu` popover component (keyboard navigation, Esc, outside click) and a shared `StatusGlyph`.
- **Project and subsystem access switches (ADM-007)**. A new Administration → **Projects** section switches whole projects, or single subsystems, off and on without deleting or re-indexing anything. Plan: `agent/PROJECT_ACCESS_PLAN.md`.
  - The Copilot skips documents in switched-off projects, says how many it skipped in the scope step, and gives an "insufficient" answer when the scope itself is off. Switched-off projects/subsystems are hidden from the scope picker — `knowledgeService.ts`, `KnowledgeCopilotPage.tsx`
  - Document list: a "Project off" tag for admins, and those rows are hidden in User View. The upload form warns when the target project or subsystem is off. Health → Knowledge index notes the switches
  - `ProjectDefinition.disabled` / `disabledSubsystems`, `setProjectEnabled` / `setSubsystemEnabled`, `isDocumentAccessible()`, and a `.switch` control (native checkbox, `role="switch"`) in `components.css` — `src/components/admin/ProjectAccessPanel.tsx`
- Each chat answer's action bar now names the model that produced it (CHAT-009) — `src/components/chat/MessageItem.tsx`
- **Service health for admins (ADM-005, NFR-OPS-005)**. The Knowledge Base modal is now "Administration" in Admin View, with a **Documents | Health** switch. Health lists the gateway, chat model, knowledge index and embeddings/retrieval, each with a status glyph and word, latency and detail. It checks when opened, on "Check now", and every 30 s while open. Plan: `agent/ADMIN_HEALTH_PLAN.md`.
  - `getSystemHealth()` is the swap-in point for `GET /api/health`. It uses the gateway's JSON report when there is one. Otherwise it checks the chat endpoint's model list (no tokens spent) and the `documentStore` index state, and reports the gateway as "Not connected" — `src/services/health/healthService.ts`
  - `healthStore` (not persisted), `HealthPanel`, types `ServiceStatus` / `ServiceHealth` / `SystemHealthReport`, `ActivityIcon`, `documentStore.adminSection`
=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
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
<<<<<<< HEAD
- **Chat fade and scroll button:** messages now fade out above the astronaut and model status, which sit on a solid background (`--composer-fade`). The composer publishes its real height (`--chat-composer-h`, measured with a `ResizeObserver`). The message list's end padding and the "scroll to latest" button use it: the button is centred just above the status row and moves up when the input grows to several lines. Previously it used a fixed 76 px and landed in the astronaut's row — `ChatInput.tsx`, `MessageList.tsx`, `tokens.css`
- **Answer footer:** answers no longer show the profile · model caption; only the response time remains. The model is shown in the status above the message box (CHAT-009) — `MessageItem.tsx`
- **User message bubble:** changed from a saturated blue fill with white text (3.6:1 contrast in dark mode, below WCAG AA) to a soft accent-tinted surface with normal text and a faint accent hairline. Light: `#e3eefc` / `#1d1d1f` (≈14:1). Dark: `#1c2d44` / `#f5f5f7` (≈13:1) — `tokens.css` (`--msg-user-*`), `MessageItem.tsx`
- **Fixed: the Chat status dock blinked out between stages.** Every stage change re-mounted the dock and the astronaut, and "Done" / "Couldn't answer" faded it out before "Ready" came back. The dock is now one steady element: only the pose and text change in place. The fade-out applies only to the Copilot dock, which does leave after an answer — `AnswerStatusDock.tsx`, `components.css`
- **Model selection moved to the message box:** the header's model profile picker was removed. Clicking the model status above the Chat message box (astronaut + "Ready · profile · model") opens Settings → Intelligence. New conversations use the default profile — `AnswerStatusDock.tsx`, `Header.tsx`, removed `ProfilePicker.tsx` (CHAT-006)
- **Astronaut always docked in Chat:** between answers it stays above the message box, still, with "Ready" and the conversation's profile and model (or "No model set"). While answering it works as before. The input bar and message list got extra room so it never covers text — `src/hooks/useAnswerStage.ts`, `src/components/ui/Astronaut.tsx` (new `idle` pose), `ChatInput.tsx`, `MessageList.tsx`
- **Waiting indicator:** while waiting for the first words, a soft light sweeps across the status word ("Thinking…" / "Searching documents…"), so the wait reads as working, not stuck. It's static under reduced motion — `src/styles/components.css`
- **Astronaut status:** docked above the message box again, now without a border or background, with the model status written beside it: the stage (Thinking… / Writing… / Done) plus, in Chat, the profile and model answering (Copilot: Quick answer / Deep research). The blinking stream cursor was removed — `src/components/chat/AnswerStatusDock.tsx`, `src/hooks/useAnswerStage.ts`
- Code highlighting now uses VS Code's default colours: **Dark+** in dark mode and **Light+** in light mode (editor background, text and token colours; no bold or italics, as in VS Code). `--syntax-*` tokens were renamed to keyword / control / string / comment / number / function / type / variable / key — `tokens.css`, `components.css`
- Fixed: long answers that re-answered every earlier topic. The model was being sent failed answers ("⚠️ Connection Error…"), empty stopped answers and duplicate questions, so earlier questions looked unanswered. History is now cleaned before sending: failed turns are dropped with their question, answers stopped before any text are dropped, partial ones are marked, only the last of repeated questions is kept, and reasoning isn't sent back — `src/services/ai/context.ts`
- **Retry** re-asks the same question instead of adding a duplicate. **Edit & resend** replaces the edited question and everything after it — `chatStore.ts`
- Demo-mode greeting detection uses whole words ("hi" no longer matches "this"/"which"). The Software Architect persona's starter prompts now show off the code samples.
- Deleting the last conversation now selects the new empty one (previously nothing was selected and the header read "New Conversation") — `chatStore.ts`
- The "Model not configured" chat message is shown once (it also appeared in the error box).
- **Documents list restyled** to the design system: flat rows with one metadata line, status as glyph + word, a "⋯" actions menu, a keyboard-operable expand button, no pill tags or hardcoded colours, and a text-style Admin/User View toggle. Plan: `agent/DOCUMENTS_RESTYLE_PLAN.md`
- **Works offline (CHAT-003):** fonts are self-hosted with `@fontsource/*` instead of Google Fonts — `src/styles/fonts.ts`
- **Local-first (CHAT-002):** removed the OpenAI, Groq, OpenRouter and DeepSeek presets and the silent `gpt-4o-mini` fallback. A profile with no model now says so instead of calling one.
- **API key no longer written to localStorage.** It's kept in sessionStorage for the browser tab, and keys saved by older builds are moved over on load — `settingsStore.ts`, `createStore` `partialize`
- Saved project lists are reconciled with `DEFAULT_PROJECTS` on load, so new seed projects and subsystems appear for existing users (`reconcileProjects`). Model profiles reconcile the same way.
- `SettingsModal.tsx` (~1,400 lines) split into a shell plus one file per tab. Behaviour is unchanged, except that the Engine & API tab's fetched model list and test result now reset when you switch tabs.
- Preference → `<html>` syncing now lives only in `App.tsx` (removed from the `settingsStore` setters, which could briefly write `data-theme="system"`).
- The Admin/User View flag moved from `documentStore` to `roleStore`, so Settings can use it too.
- The health check's model-list request is now actually cancelled on abort/timeout (`fetchAvailableModels` accepts a `signal`).

### Removed
- Unused `zustand` and `lucide-react` dependencies; `DEFAULT_MODELS`, `AIModel`, `activeModelId`, `persona.defaultModelId`.
- `styles/knowledge.css` renamed to `styles/components.css`, since its classes are shared outside the Copilot. It adds health-row/status-glyph classes, `.is-spinning`, and a disabled state for `.text-action`.
=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
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
