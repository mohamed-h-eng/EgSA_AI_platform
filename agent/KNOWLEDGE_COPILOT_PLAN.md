# Plan: Knowledge Copilot as a separate page

> Status: **APPLIED 2026-09-21** after review, with the decisions in §8. Deviations are noted inline.
> Date: 2026-09-21 · Related: [`PROJECT_PLAN.md`](PROJECT_PLAN.md) §3 (KB-009..KB-018), [`CONTEXT.md`](CONTEXT.md), [`../.agent/design_system.md`](../.agent/design_system.md)

## 1. What changes and why

| Area | Today | Target |
|---|---|---|
| **Chat page** | Chat plus a "Knowledge" mode switch above the input | **General chat only.** The mode switch, scope selects and citation rendering are removed from chat. |
| **Knowledge Copilot** | A mode inside a chat session | **Its own page** for grounded Q&A and extended/deep research over indexed documents, with citations. |
| **Knowledge Base (docs admin)** | Modal opened from the sidebar footer | Unchanged. Also reachable from the Copilot page ("Manage documents"). |

The grounding rules (KB-011/012) and the single swap-in point for the real backend (`queryKnowledgeBase()`) stay as they are.

---

## 2. Navigation (no new dependency)

- Add a tiny `navigationStore` (`createStore`, persisted `egsa_ai_nav`) with `activeView: 'chat' | 'knowledge'`.
- Keep it in sync with the URL hash (`#/chat`, `#/knowledge`) so the page can be linked, and browser Back/Forward work. No router library is needed for two views.
- `App.tsx` renders `<ChatPage/>` (the current Header + MessageList + ChatInput) or `<KnowledgeCopilotPage/>` inside the same shell. The sidebar and modals are shared.

**Sidebar** (shared, recomposed):
```
┌──────────────────────────┐
│ EgSA Intelligence   ✎ ◧  │
│                          │
│  💬 Chat                 │  ← primary nav: 2 items, selected = accent text + bg-active
│  📖 Knowledge Copilot    │
│ ──────────────────────── │  ← hairline separator
│  Search…                 │
│  RECENT                  │  ← list follows the active view:
│   · session / thread     │     chat sessions OR research threads
│   · …                    │
│                          │
│ ⚙ Settings      🗄  ☀    │  ← footer unchanged (🗄 = Knowledge Base manager)
└──────────────────────────┘
```
The "new" (✎) button creates a chat session or a research thread, depending on the active view. On mobile the sidebar stays a drawer, and the nav items stay at the top of it.

---

## 3. Knowledge Copilot page

### 3.1 Layout: desktop / tablet (≥ 1024px)
```
┌ top bar (apple-glass) ─────────────────────────────────────────────────┐
│ Knowledge Copilot          Scope: [All Projects ▾] [All Subsystems ▾]   │
│ 1 indexed document · Manage documents                                   │
├──────────────────────────────────────────────┬──────────────────────────┤
│  (research thread — editorial, no cards)      │  EVIDENCE                │
│                                               │  ─────────────────────── │
│  What is the ADCS pointing accuracy req?      │  1  ADCS SRS · Rev C     │
│                                               │     p.12 · §3.2.1 · -021 │
│  ▸ Research steps (3)          collapsible    │  ─────────────────────── │
│                                               │  2  ADCS SRS · Rev C     │
│  Answer text with inline markers [1] [2] …    │     p.14 · §3.2.3 · -027 │
│                                               │  ─────────────────────── │
│  Coverage: 1 of 1 indexed docs consulted      │  (selected source expands│
│                                               │   to show its excerpt)   │
│                                               │                          │
│  ┌ composer ───────────────────────────────┐ │                          │
│  │ Ask the knowledge base…   [Quick|Deep] ↑│ │                          │
│  └─────────────────────────────────────────┘ │                          │
└──────────────────────────────────────────────┴──────────────────────────┘
```
- Clicking an inline `[n]` marker selects and scrolls to that source in the Evidence panel, and the panel shows the selected answer's sources.
- Empty state: a large title, one line of supporting text, and 2–3 suggested questions as plain text rows (not cards), per the design system.

### 3.2 Layout: mobile (< 768px), recomposed rather than shrunk
- The top bar shows the title plus a single "Scope" button that opens a bottom sheet with the project/subsystem selects.
- The Evidence panel becomes an **Answer | Sources** segmented control under each answer. Sources appear inline in the flow instead of a side column.
- Touch targets are at least 44px, and the composer is pinned to the bottom with safe-area padding.

### 3.3 Quick vs. Deep research
| | Quick answer | Deep research |
|---|---|---|
| Retrieval | Top passages for the whole question (current behaviour) | The question is split into sub-questions (on "and", commas, multiple "?"). Each one is retrieved separately, then merged and de-duplicated |
| Sources | ≤ 3 | ≤ 8, grouped by document |
| Output | Short, extractive answer with [n] markers | Sectioned answer (one section per sub-question) with [n] markers, a "Documents consulted" list, and **"Not covered"**: the sub-questions with no supporting passage (KB-011 applied per sub-question) |
| Progress | Spinner | Visible **research steps**: "Scoping to 1 indexed document" → "Searching: pointing accuracy" → "Found 2 passages" … (collapsible after completion) |

Both modes still search only `indexed` documents, and every citation points at a real document in `documentStore` (KB-012).

### 3.4 Later on this page (not in this change unless you want it)
- KB-016 summarise one selected document, and KB-017 compare two revisions, as actions on a pinned document inside the scope.

---

## 4. Code changes (file by file)

**New**
- `src/stores/navigationStore.ts`: `activeView` plus hash sync.
- `src/stores/knowledgeStore.ts` (`createStore`, persisted `egsa_ai_knowledge`): `threads`, `activeThreadId`, `createThread` / `selectThread` / `renameThread` / `deleteThread`, `setScope`, `setDepth`, `ask(question)`, `stop()`, `selectedSourceIndex`.
- `src/components/knowledge/KnowledgeCopilotPage.tsx`: the page shell (top bar, thread, evidence panel, composer).
- `src/components/knowledge/ResearchTurn.tsx`: question, research steps, answer and coverage.
- `src/components/knowledge/EvidencePanel.tsx`: the source list (flat rows with hairline separators).
- `src/components/knowledge/KnowledgeComposer.tsx`: the input with the Quick|Deep control. It reuses the textarea behaviour of `ChatInput`, without the global type-to-focus hijack.
- `src/components/chat/ChatPage.tsx`: moves the current Header / MessageList / ChatInput out of `App.tsx`.

**Changed**
- `types/index.ts`:
  - Add `KnowledgeThread`, `KnowledgeTurn`, `ResearchStep` and `KnowledgeDepth`.
  - `KnowledgeQueryRequest` gains `depth`. `KnowledgeQueryResponse` gains `steps`, `consultedDocumentIds` and `uncovered`.
  - **Remove** `mode` / `knowledgeScope` from `ConversationSession`, and `sources` / `grounding` from `ChatMessage`.
- `services/knowledge/knowledgeService.ts`: adds `depth` and an optional `onStep` progress callback. It is still the single swap-in point for `POST /api/knowledge/query`.
- `stores/chatStore.ts`: removes the knowledge branch, `setSessionMode`, `setKnowledgeScope` and the sources in export. Chat goes back to LLM-only.
- `components/chat/ChatInput.tsx`, `MessageList.tsx`, `MessageItem.tsx`: remove the mode bar, knowledge empty state and citation rendering, and restore the original bottom padding and scroll-button offsets.
- `components/layout/Sidebar.tsx`: adds the two primary nav items, and the list follows the active view.
- `components/documents/SourceCard.tsx`: restyled as a flat row (hairline separator, no border box) for the Evidence panel, keeping the doc / revision / page / section / req-ID metadata (NFR-USE-002). The document manager's detail panel uses the same component.
- `App.tsx`: switches views and keeps the theme effects as they are.

**Deleted**
- `components/chat/KnowledgeModeBar.tsx`.
- `KNOWLEDGE_STARTER_PROMPTS` moves into the Copilot page's empty state (it stays in `constants/defaults.ts`).

---

## 5. Styling rules for all new UI (from `.agent/design_system.md`)

- **Tokens only.** Add the missing spacing scale to `tokens.css` (`--space-1`…`--space-8`: 4/8/12/16/24/32/48/64px) and use it in the new components. Colors, radii, shadows and motion come from existing tokens only; no hardcoded hex.
- **Hierarchy through typography and whitespace, not boxes.**
  - The answer is editorial text, like the current assistant messages.
  - The Evidence panel is a list with hairline separators.
  - The only elevated surfaces are the composer and the mobile bottom sheet.
- **One accent** (`--accent-primary`) is used for the selected nav item, the active citation marker and the primary send button. The insufficient state uses icon + text + `--warning`, never color alone.
- **Buttons:** primary = send; secondary = Quick|Deep segmented control and scope; tertiary = text actions ("Manage documents", "Research steps"). No new pill-shaped chips beyond the segmented control.
- **States:** every interactive element gets hover, active, `:focus-visible` (existing focus ring), disabled and a correct cursor. The segmented control uses `role="radiogroup"`, and the panel is a labelled `aside`.
- **Motion:** opacity and transform at 140–180ms (`--transition-fast` / `--transition-normal`). Research steps fade in, and all motion is disabled under `prefers-reduced-motion` (existing global rule).
- **Responsive:** check at 390px, 768px and 1280px. Mobile is recomposed as described in §3.2.

---

## 6. Data migration

- Saved chat sessions that were in `mode: 'knowledge'` (e.g. the test session from the last change) become ordinary chat sessions. Their old `sources` fields are ignored, and the text stays.
- Knowledge threads start empty in the new `egsa_ai_knowledge` store.

## 7. Verification

- `npx tsc -b` and `npm run lint` clean.
- In the browser:
  - The chat page has no knowledge UI.
  - `#/knowledge` loads the page directly, and Back returns to chat.
  - A quick query for the ADCS SRS gives a grounded answer, and clicking `[1]` selects source 1.
  - A deep query such as "ADCS pointing accuracy and EPS bus voltage" gives an ADCS section with citations and an EPS sub-question listed under **Not covered**, since the EPS document isn't indexed yet.
  - An unrelated query returns insufficient information with no citation.
  - A scoped query to Ground Segment returns insufficient information.
  - Mobile, tablet and desktop widths all checked.
- Docs: a CHANGELOG entry, PROJECT_PLAN status rows and CONTEXT code map / flow / mock-vs-real table.

## 8. Decisions (reviewed 2026-09-21)

1. **Deep research:** Quick | Deep toggle ✅
2. **Sidebar:** when on the Copilot page, the sidebar lists Knowledge Copilot threads only; chat lists chat sessions only ✅
3. **Old knowledge-mode chat sessions:** **not** converted to plain chat. They are moved into Copilot threads, keeping their display (questions, answers, citations) ✅. This replaces the "convert to plain chat" proposal in §6.
4. **KB-016 / KB-017:** later ✅

## 9. Implementation notes

- **Breakpoints:** the Evidence panel shows at ≥1100px (rather than 1024px), leaving room for the sidebar. The inline scope controls show at ≥1024px, and the scope sheet is used below that.
- **Navigation persistence:** `navigationStore` has no `egsa_ai_nav` key after all; the URL hash is the persisted state.
- **Stateful classes:** these live in `src/styles/knowledge.css`, imported by `global.css`.
- **Relevance cutoff:** raised to 67% of the top passage score. Before that, "pointing accuracy" also cited the safe-mode requirement, only because its text contains "Sun-pointing".
