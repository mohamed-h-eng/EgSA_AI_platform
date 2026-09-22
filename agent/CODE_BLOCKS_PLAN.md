# Plan: Code highlighting, code checks, and demo code samples

> Status: **APPLIED 2026-09-22** (all recommended options). See §5. Date: 2026-09-22
> Request: "add code linting feature and save mock messages for different langs".
> Decisions:
> - Highlighting **plus** lightweight checks, not full per-language linters.
> - Demo replies with code in several **programming** languages.
> - A **bundled highlight.js** (offline, no CDN).

## 1. Code blocks in answers
- **Syntax highlighting** with highlight.js core, registering only: Python, C, C++, TypeScript, JavaScript, Java, MATLAB, SQL, Bash, JSON. Aliases cover `py`, `ts`, `js`, `sh`, `c++`, `m` and so on. Unlabelled blocks are auto-detected among those languages.
- **Line numbers** in a gutter that isn't selected when you copy.
- **Colours** come from new syntax tokens in `tokens.css` (light and dark), Xcode-like and muted. They're the one functional exception to the single-accent rule, because colour here aids reading but doesn't carry meaning on its own.
- **Streaming:** while an answer streams, blocks render as plain text. Highlighting and checks run once the block is complete, so there's no flicker.

## 2. Code checks ("lint")
A pure `checkCode(code, language)` function returns `{ line, severity: 'warning' | 'info', message }[]`. It's honest about scope: fast, common problems, not a compiler.

| Rule | Languages | Severity |
|---|---|---|
| Unbalanced `()[]{}` (ignores strings and comments) | all except Bash/SQL strings edge cases | warning |
| Invalid JSON (with the line) | JSON | warning |
| Tabs and spaces mixed in indentation | all | warning |
| Indentation not a multiple of 4 | Python | info |
| Assignment inside `if (…)` (`if (a = b)`) | C, C++, Java, JS, TS | warning |
| `== None` / `!= None` (use `is None`) | Python | info |
| Trailing whitespace | all | info |
| Line longer than 120 characters | all | info |
| `TODO` / `FIXME` / `XXX` left in the code | all | info |

- **UI:** the block header shows the result as a glyph plus a word: "✓ No issues" or "▲ 3 issues". Clicking it expands the list ("Line 12: Unbalanced '{' …"), and the flagged lines are marked in the gutter.
- **Code:** `services/code/codeCheck.ts` (with tests) and `services/code/highlight.ts`.

## 3. Demo-mode code samples
- `services/ai/mockCodeSamples.ts` has one realistic, space-flavoured sample per language:
  - Python: orbit period
  - C: CRC-16 for telemetry frames
  - C++: quaternion normalise
  - TypeScript: telemetry parser
  - Java: ground-pass scheduler
  - MATLAB: attitude plot
  - SQL: telemetry query
  - Bash: log rotation
  - JSON: config
- There's also **"review" samples with deliberate problems** (C, Python), so the checks can be demonstrated.
- The mock provider picks the sample from the prompt ("write … in Python", "C code for …", "show a code review example"). The existing code/greeting routing is tidied up; `hi` used to match any word containing "hi".
- A starter prompt for the Software Architect persona is updated to show this off.

## 4. Out of scope
- Real compilers or linters (ESLint, Pylint, clang-tidy): megabytes of bundle, slow, and better done in the VS Code coding copilot.
- Running code.

## 5. Applied: notes and deviations
- **Files:**
  - `services/code/languages.ts`: supported languages, aliases, display names. It has no highlight.js dependency.
  - `services/code/highlight.ts`: highlight.js core + 10 languages. It's **loaded on demand** by `CodeBlock` as its own chunk (about 21 KB gzipped), so the main bundle doesn't carry it.
  - `services/code/codeCheck.ts`: the checks.
  - `components/chat/CodeBlock.tsx`: moved out of `MarkdownRenderer`.
  - `services/ai/mockCodeSamples.ts`: the samples and prompt routing.
- **Result display:** the header shows "✓ No issues", or "▲ N warnings · M notes" as a button that opens the list. The gutter marks lines with ▲ (warning) or ● (note), and hovering a marked line number shows its messages.
- **Syntax colours:** `--syntax-*` tokens in `tokens.css`, mapped from highlight.js classes in `components.css`.
- **Tests:**
  - Every language sample passes the checks with no warnings, and each review sample triggers the problems its note describes.
  - Bracket, condition, JSON, Python and style rules; string/comment stripping keeps line numbers (a bug with unterminated strings was found and fixed this way).
  - Language detection from prompts.
- **Mock provider:** coding prompts are routed first. The greeting match now uses whole words (`hi` used to match "this" and "which"). The Software Architect persona's starter prompts now show the C sample and the Python review.
- **Verified in the browser (demo mode, then your settings restored and test chats removed):**
  - The C review answer is highlighted, with gutter markers on lines 2, 4 and 7.
  - "2 warnings · 1 note" expands to the three findings.
  - The Python sample label shows while streaming.
  - Esc in the message box stops the answer.
- **Colours changed (2026-09-22, on request):** VS Code Dark+ / Light+ instead of the Xcode-like palette. The code block background and text match the VS Code editor (#1e1e1e / #d4d4d4 in dark, #ffffff / #000000 in light).
