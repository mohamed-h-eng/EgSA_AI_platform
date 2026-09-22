# Plan: Productivity and trust UX, round 1

> Status: **APPLIED 2026-09-22** with the recommended answers (local feedback + Administration → Feedback · date groups · last 30 messages). See §9.
> Date: 2026-09-22
> Scope: items 1–6 from the UX review. The command palette and saved `/` prompts (item 7) are a later round.
> Sources: [AI Chat UI Best Practices for 2026](https://thefrontkit.com/blogs/ai-chat-ui-best-practices), [Designing AI chat interfaces](https://www.setproduct.com/blog/ai-chat-interface-ui-design), [RAG citations & confidence](https://buzzi.ai/insights/ai-document-retrieval-rag-citation-architecture)
> Related: [`../.agent/design_system.md`](../.agent/design_system.md), [`CONTEXT.md`](CONTEXT.md)

## 1. Keyboard shortcuts, cheat sheet, arrow keys

These mirror ChatGPT, where the keys are the same, so people don't have to learn new ones.

| Keys | Action | Where |
|---|---|---|
| `Ctrl/⌘ + Shift + O` | New conversation / new research thread | Chat, Copilot |
| `/` (outside a text field) | Focus the message box | Chat, Copilot |
| `Esc` (while an answer streams, focus in the composer) | Stop generating | Chat, Copilot |
| `↑` (in an empty composer) | Edit your last message | Chat |
| `Ctrl/⌘ + Shift + C` | Copy the last answer | Chat, Copilot |
| `Ctrl/⌘ + Shift + S` | Toggle the sidebar | Everywhere |
| `?` (outside a text field) | Open the shortcuts sheet | Everywhere |
| `↑ / ↓` on the welcome screen | Move between starter prompts | Chat, Copilot empty state |

- **One global handler:** `hooks/useShortcuts.ts`, mounted once in `App.tsx`. It ignores keys while a dialog is open (other than its own), and doesn't steal from inputs, apart from the composer-specific keys above.
- **Cheat sheet:** a small dialog (`ShortcutsDialog.tsx`, using `useDialog`) listing the shortcuts, reachable from `?`, the account menu, and a hint in the composer's placeholder ("Press / to focus · ? for shortcuts").
- **Mac vs Windows:** shown as ⌘ on macOS and Ctrl elsewhere.

## 2. Answer feedback (three layers)

- **Layer 1:** 👍 / 👎 always visible (quiet icons) under every **Copilot** answer and every **chat** answer. Clicking again un-selects.
- **Layer 2:** 👎 expands an inline row of reason chips: *Inaccurate · Wrong source · Not relevant · Incomplete · Unclear*. One click saves; there's no pop-up window.
- **Layer 3:** an optional "Tell us more" text field under the chips, which saves on Enter or blur.
- **What's saved per rating:** answer id, surface (chat/copilot), rating, reasons, comment, the question, the model profile + model (chat) or the depth + scope + source ids + grounding (Copilot), and a timestamp.
- **Storage:** `feedbackStore` (Q1). The swap-in point is `POST /api/feedback`.
- **Administration → Feedback** section (Q1): a counts summary, the latest entries, and **Export CSV** for the pilot evaluation report (D-14).

## 3. Screen-reader support

- **Live region:** one hidden `aria-live="polite"`, `aria-atomic="false"` region per page announces answers. It says "Assistant is responding…" at start, then reads the finished answer's first ~300 characters when it completes. It doesn't read token by token, which is the "debounced" approach from the article.
- **Labels:** each message gets a visually hidden "You said" / "Assistant said" label. The message list becomes `role="log"` with an `aria-label`.
- **Errors:** the error line in a message is announced (`role="alert"`).

## 4. Pinning, date groups, drafts and scroll kept per conversation

- **Pin / unpin** from a conversation's row (and research threads). Pinned items are listed first under **Pinned**. This uses the existing `ConversationSession.pinned` field, and adds `KnowledgeThread.pinned`.
- **Date groups** below: **Today · Yesterday · Previous 7 days · Previous 30 days · Older**, based on `updatedAt`. While searching, the groups collapse into one flat result list.
- **Drafts:** the unsent composer text is kept per conversation/thread. It's saved in memory and in `sessionStorage`, so it survives switching conversations and reloading, but not closing the browser.
- **Scroll:** each conversation's scroll position is remembered in memory and restored when you switch back.

## 5. Source freshness and relevance in the Copilot

- **Freshness:** every source card shows "Rev C · indexed 21 Sep 2026" (from `KnowledgeDocument.indexedAt`).
- **Relevance:**
  - `SourceReference` gets `relevance?: number` (0–1). The mock sets it from its match score; the real backend returns its retrieval score.
  - The card shows a **Strong / Partial match** word (never colour alone). Sources below 0.5 get the note "Partial match: check the passage".

## 6. Long-conversation notice

- The chat only sends the **last N messages** to the model (Q3). When older messages are left out, a thin divider in the conversation says *"Earlier messages aren't sent to the model. Using the last N messages."*
- The limit lives in `DEFAULT_AI_CONFIG.historyLimit` and can be changed in Settings → Intelligence ("Conversation memory").

## 7. Files (summary)

| New | Changed |
|---|---|
| `hooks/useShortcuts.ts`, `components/ui/ShortcutsDialog.tsx`, `stores/feedbackStore.ts`, `components/feedback/AnswerFeedback.tsx`, `components/admin/FeedbackPanel.tsx`, `components/ui/LiveAnnouncer.tsx`, `utils/dateGroups.ts` | `App.tsx`, `ChatInput`, `KnowledgeComposer`, `MessageList`, `MessageItem`, `ResearchTurn`, `SourceCard`, `Sidebar`, `chatStore` (history limit, drafts), `knowledgeStore` (pin, drafts), `knowledgeService` (relevance), `types`, `defaults`, `DocumentManagerModal` (Feedback section), `ModelTab` (memory setting), `components.css`, tests |

Tests: date grouping, history trimming, feedback CSV export, and the shortcut guard (don't fire inside inputs or dialogs).

## 8. Decisions needed
- **Q1: Feedback storage.** Local browser store plus Administration → Feedback with CSV export (recommended until `/api/feedback` exists), or local only with no admin view?
- **Q2: Sidebar groups.** Group by date (recommended), or by project (Copilot threads only; chat has no project)?
- **Q3: History limit.** Send the last **30** messages and show the notice (recommended), or keep sending everything and only warn when it's long?

## 9. Decisions and deviations (applied)
- Q1 → local store + **Administration → Feedback** (counts, reasons, latest 50, Export CSV). Q2 → **date groups** (Pinned first; one "Results" list while searching). Q3 → **last 30 messages** + divider; adjustable in Settings → Intelligence → *Conversation memory* (10–100).
- **Composer hint:** the placeholder hint ("Press / to focus · ? for shortcuts") was left out to keep the placeholders clean. Shortcuts are found through `?` and the account menu's **Keyboard shortcuts** entry instead.
- **Live region:** `aria-atomic="true"` rather than `false`, because each announcement is a complete sentence that replaces the last. It's one region for the whole app (`LiveAnnouncer`), written from store subscriptions, so streaming causes no re-renders.
- **Feedback on failed answers:** chat answers that failed (e.g. "Model not configured") show their actions but no rating.
- **Chat answer actions:** the latest answer's actions (rating, copy, direction, retry, model) are always visible; older answers show them on hover or keyboard focus, and rated ones stay visible. The user-message bar also became keyboard-reachable (it was hover-only).
- **Sidebar rows** are now keyboard-operable (`role="button"`, Enter/Space, focus ring).
- **Shortcut guard tests** were not added: `isTypingTarget` needs a DOM and the test runner uses Node. It was checked in the browser instead.
- **Verified in the browser:**
  - Ctrl+Shift+O makes a new thread; `/` focuses the box; `?` opens the sheet; Ctrl+Shift+S toggles the sidebar.
  - Date groups and pinning in the sidebar.
  - Strong match + indexed date on sources.
  - Thumbs down → reason chips → Administration → Feedback entry.
  - Live-region announcement text.
  - Test data was removed afterwards.

