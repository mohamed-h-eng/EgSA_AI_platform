# Plan: Astronaut status companion while answers are written

> Status: **APPLIED 2026-09-22, revised twice (§8, §9).** Current: docked above the message box, no border, with the model status written beside it. There is no stream cursor.
> Date: 2026-09-22
> Request: an astronaut character that moves while an answer streams, based on `src/assets/pet.jpg` (one cute astronaut in three poses: **Searching**, **Coding**, **Testing / PASS**).
> Related: [`WELCOME_ANIMATION_PLAN.md`](WELCOME_ANIMATION_PLAN.md) (the "no distraction during a conversation" rule), [`../.agent/design_system.md`](../.agent/design_system.md) (motion must show state, be subtle, and respect reduced motion)

## 1. Idea (recommended): the astronaut shows what the assistant is doing
The three poses in `pet.jpg` map to the three stages of an answer. The character is a **status indicator**, not decoration, which is what makes motion acceptable inside a conversation.

| Stage | When | Pose (from pet.jpg) | Motion | Label beside it |
|---|---|---|---|---|
| **Thinking / searching** | Sent, no text yet (Chat); research steps running (Copilot) | Floating with a **magnifying glass**; a small grid on the visor | Slow float (±3 px, 3 s); the lens sweeps left and right | "Thinking…" / "Searching documents…" |
| **Writing** | Text is streaming | Typing on a **floating keyboard**; code lines scroll on the visor | Hands tap, visor lines scroll; the body stays still | "Writing…" (or "Writing code…" while inside a code block) |
| **Done** | Answer complete | **Thumbs up / check** (the PASS pose) | A single 600 ms pop and check, then it fades out over 400 ms | none |
| **Stopped / error** | Stopped or failed | Shrug (arms out) | A single tilt, then fades | none (the answer already says so) |

**Placement:** in the answer's own row, where the answer is appearing. It's a compact **40 px** figure next to a short label, at the start of the answer while waiting, then at the answer's foot while text streams. It's never over the text, and nothing is added to the header or sidebar.

**After an answer:** the figure is removed, so nothing moves while people read (the same rule as the welcome starfield).

## 2. Artwork: redraw, don't cut out
- `pet.jpg` is a single 2 MB raster sheet on a purple background, with labels baked in and an AI-generated look. Cutting sprites out of it would give blurry, boxed, heavy images that don't adapt to dark or light mode.
- **Recommended:** redraw the character as a **small inline SVG** (under 6 KB per pose) in the same style: white suit, dark visor with a highlight, rounded proportions, and the dark outline. It uses theme tokens (outline = `--text-primary`, visor = `--code-bg`, accent details = `--accent-primary`), so it works in light and dark mode. The poses share one body with swappable arms and props, so the file stays small.
- **Motion:** CSS transforms on SVG groups only (float, arm tap, lens sweep, visor-line scroll). There's no JS animation loop, so it's cheap even during streaming.

## 3. Accessibility and restraint
- `aria-hidden` on the figure. The status is conveyed by the existing live region ("Assistant is responding…") and the visible label.
- **Reduced motion:** the pose still changes with the stage, but nothing moves. There are no pops or fades.
- **Settings → Appearance → "Answer status companion"** can turn it off, falling back to the current text cursor (default On, Q3).
- No sound, not clickable, no speech bubbles.

## 4. Code shape
| File | Change |
|---|---|
| `components/ui/Astronaut.tsx` *(new)* | `<Astronaut pose="thinking" \| "writing" \| "done" \| "stopped" size={40} />`: the SVG body plus pose parts and CSS classes |
| `components/chat/AnswerStatus.tsx` *(new)* | Picks the pose and label from the message state: no text yet → thinking; streaming → writing (code-aware); complete → done (then unmounts); stopped/error → stopped |
| `MessageItem.tsx` | Renders `AnswerStatus` for the streaming assistant message, in place of the bare stream cursor while there's no text yet |
| `ResearchTurn.tsx` (Copilot) | "Searching documents…" pose while research steps run, if the Copilot is in scope (Q2) |
| `styles/components.css` | `.astronaut` keyframes (float, tap, sweep, pop), plus the reduced-motion overrides |
| `settingsStore` / Appearance tab | `preferences.statusCompanion` toggle (Q3) |

## 5. Alternatives considered
- **A full-size mascot in the corner** (Clippy-style): distracting and competes with the answer. Rejected.
- **A progress bar or spinner only:** calm but anonymous. The astronaut adds brand character with the same information.
- **An animated GIF or Lottie of pet.jpg:** heavy, can't follow the theme, and GIFs can't be paused for reduced motion. Rejected.

## 6. Decisions needed
- **Q1: Where does it appear?** **In the answer row** (recommended), or as a small dock above the message box?
- **Q2: Where is it used?** **Chat and Knowledge Copilot** (recommended; the Copilot uses the "Searching documents" pose), or Chat only?
- **Q3: An off switch** in Settings → Appearance, default On (recommended), or always on?
- **Q4: Artwork.** **Redraw as a theme-aware SVG in pet.jpg's style** (recommended), or use crops of pet.jpg as-is?

## 7. Applied: notes and deviations
- **Q1 → dock.** A glass pill pinned just above the message box (`answer-dock`), holding a 36 px astronaut and a stage label. It floats over the page, so the layout doesn't shift. It appears when an answer starts, changes pose with the stage, shows "Done" (or "Stopped" / "Couldn't answer") for about 1.4 s, then fades out and is removed.
- **Stages:**
  - **Chat:** "Thinking…" (no text yet) → "Writing…", or "Writing code…" while inside a code block → Done / Stopped / Couldn't answer.
  - **Copilot:** "Searching documents…" → "Writing the answer…" → "Done · N sources" / "No supporting source found" / Stopped / Research failed.
- **Files:**
  - `components/ui/Astronaut.tsx`: the SVG, with 4 poses.
  - `hooks/useAnswerStage.ts`: `useChatAnswerStage` / `useCopilotAnswerStage`, which include the short linger after an answer ends.
  - `components/chat/AnswerStatusDock.tsx`: the pill.
  - Wired into `ChatInput` and `KnowledgeComposer`.
- **Styling:**
  - `--astro-*` tokens (light and dark) in `tokens.css`.
  - `.answer-dock` / `.astronaut` / `.astro-*` with CSS-only motion (float, lens sweep, typing taps, visor code scroll, pop, tilt) in `components.css`.
  - Everything stops under reduced motion.
- **Setting:** Settings → Appearance → **Answer status companion** (`preferences.statusCompanion`, default On).
- **Checked in the browser:**
  - The Copilot dock showed "Searching documents…" during research.
  - All four poses were rendered at 140 px and 36 px in dark and light themes.
  - The lens was brightened after that check, because it vanished on dark backgrounds.
  - The test turn added to an existing research thread was removed afterwards.

## 8. Revision (2026-09-22, on request): at the start of each streamed line, no pill, no cursor
- **The blinking stream cursor was removed** (`MarkdownRenderer`, `.stream-cursor` and its keyframes) in Chat and the Copilot.
- **The pill is gone** (`AnswerStatusDock` deleted): no border, no background, no label (the label stays as a hover `title`).
- **Placement:** `components/chat/StreamingPet.tsx` puts the astronaut **at the start of the line currently being written**, in the margin beside the text. It glides down to each new line (`top` transition, 160 ms).
  - The position is measured from the end of the last text node (a DOM `Range`) and re-measured on every DOM change (`MutationObserver`) and resize.
  - While the answer has no text yet, it sits at the first line.
  - It's 28 px when the margin allows and 22 px in tight margins; if there's no margin at all (phones), it sits just after the text instead.
  - It follows `direction`, so in RTL answers it sits on the right.
  - The margin is measured inside the scrolling panel, so it's never clipped.
- **Used in:** the latest Chat answer (`MessageItem`) and the Copilot turn being produced (`ResearchTurn`; its answer container now renders while research runs, so the astronaut has a place during "Searching").
- **Stages unchanged:** thinking/searching → writing → done or stopped for about 1.4 s, then removed.
- **Checked in the browser (Copilot, test thread deleted afterwards):**
  - It sits in the margin at the line start (22 px at a 950 px window), follows the streaming lines, and moves thinking → writing → done, then is removed.
  - No blinking cursor was present at any point.

## 9. Revision 2 (2026-09-22, on request): back to the dock, with the model status beside it
- **Placement:** back above the message box (`AnswerStatusDock`, in `ChatInput` and `KnowledgeComposer`). The in-answer placement (`StreamingPet`) was removed.
- **No border or background:** just the astronaut (32 px), the stage in semi-bold (**"Thinking…"**, **"Writing…"**, **"Writing code…"**, **"Done"**, **"Stopped"**, **"Couldn't answer"**), and a quiet detail beside it:
  - **Chat:** the profile and model answering, e.g. "General assistant · llama3.1:8b", or "… · demo" in demo mode.
  - **Copilot:** "Quick answer" / "Deep research".
  - On phones the detail is hidden to save width.
- **The blinking stream cursor stays removed.**
- **Checked in the browser (Copilot, test thread deleted afterwards):** "Searching documents… Deep research", then "Writing the answer… Deep research", docked above the message box with no border.

## 10. Waiting indicator (2026-09-22, on request)
- **Problem:** before the first words arrive, the wait can look like the app is stuck.
- **Options considered:**
  - The astronaut waving: rejected. It's a new gesture that competes with the answer, and a wave reads as "hello" or "done" rather than "working".
  - The status word flickering (opacity blink): rejected. Blinking reads as an error or a bad connection, and it's an accessibility irritant.
- **Chosen: a shimmer on the status word.** A soft light sweeps across "Thinking…" / "Searching documents…" (1.8 s loop, muted → primary text colour, `background-clip: text`). It runs only in the thinking pose; once text streams, the answer itself is the signal. The astronaut's float and lens sweep continue alongside it.
- **Reduced motion:** the label is static in the primary colour.
- Styles: `.answer-dock[data-pose='thinking'] .answer-dock-label` and `@keyframes statusShimmer` in `components.css`.

## 11. Always docked in Chat (2026-09-22, on request)
- In Chat, the astronaut **stays above the message box between answers**, in a new still **`idle`** pose (arms relaxed, no float).
- **Label:** "Ready" in muted text, with the conversation's profile and model beside it, e.g. "General assistant · llama3.1:8b", or "· demo". If the profile has no model, it shows "No model set · General assistant".
- **While answering:** thinking → writing → done work as before. After "Done" fades, the idle dock slides back in (the dock re-mounts between idle and active).
- **Copilot:** unchanged; it only shows while researching.
- **Room for it:**
  - The Chat input bar's top padding grew (0.5 → 2.75rem), so the astronaut sits on the bar's fade and not over message text.
  - The message list's bottom padding grew (6.5 → 8.75rem), so the last message is never hidden.
- **Code:**
  - `useChatAnswerStage` now always returns a stage (`useChatIdleStage` supplies the idle one).
  - `Astronaut` has the `idle` pose.
  - Styles: `.answer-dock[data-pose='idle']` / `.astronaut[data-pose='idle']`.
- The Settings toggle still hides it entirely.

## 12. The model status is the model control (2026-09-22, on request)
- **Header:** the header's model profile picker (`ProfilePicker`) was removed and the file deleted.
- **Chat dock:** the dock is now a **button**. Clicking the astronaut or the status ("Ready · General assistant · llama3.1:8b") opens **Settings → Intelligence**, where profiles and personas are chosen.
  - It stays borderless; a soft fill appears only on hover or focus, with a focus ring for the keyboard.
  - Its accessible name is "<status>. Change model or persona".
- **Companion setting off:** in Chat the status text stays (it's a control now); only the astronaut is hidden. The Copilot dock is unchanged: passive, and only shown while researching.
- **Behaviour change:** there's no longer a quick per-conversation profile switch. New conversations use the **default** profile (set in Intelligence), and existing conversations keep the profile they were created with.
- **Fix (same day):** the dock no longer re-mounts between stages.
  - Removed the `key` on the dock and on `Astronaut`.
  - The `dockOut` fade is limited to the passive Copilot dock.
  - Verified by driving the chat store through thinking → writing → error → idle: the same DOM element stayed at opacity 1 with the astronaut present throughout.

