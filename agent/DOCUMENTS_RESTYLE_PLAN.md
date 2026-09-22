# Plan: Restyle the Documents list to the design system

> Status: **APPLIED 2026-09-22.** See the last section for decisions and deviations.
> Date: 2026-09-22
> Why: the Documents section of the Administration modal predates `.agent/design_system.md`. It uses bordered cards per row, pill tags and badges, 0.62–0.7rem text, hardcoded `rgba()` colours and an inline-styled Admin/User toggle with no focus state. The Projects and Health sections next to it already follow the system, so the modal looks inconsistent. No behaviour changes are planned.
> Related: [`ADMIN_HEALTH_PLAN.md`](ADMIN_HEALTH_PLAN.md), [`PROJECT_ACCESS_PLAN.md`](PROJECT_ACCESS_PLAN.md), [`../.agent/design_system.md`](../.agent/design_system.md)

## 1. Before → after

```
BEFORE (each row a bordered card)
┌──────────────────────────────────────────────────────────────────────────┐
│ 📄 ADCS Software Requirements Spec  EGSA-ADCS-SRS-001     [✓ Indexed]  ⟳ 👁 🗑 ⌄ │
│    (Orbit-1) (ADCS) (SRS) (Rev C)                          Sep 21, 2026     │
└──────────────────────────────────────────────────────────────────────────┘

AFTER (flat rows, hairline separators, typography carries hierarchy)
  ADCS Software Requirements Specification                   ● Indexed      ⋯
  EGSA-ADCS-SRS-001 · Orbit-1 / ADCS · SRS · Rev C · Sep 21, 2026
  ────────────────────────────────────────────────────────────────────────────
  EPS Interface Control Document                              ◌ Indexing…   ⋯
  EGSA-EPS-ICD-004 · Orbit-1 / Power (EPS) · ICD · Rev B · Project off
```

- **Rows:** flat, with hairline separators and a hover/pressed background, like `.source-row`. The row header is a real `<button>` with `aria-expanded`, so keyboard users can expand it.
- **Metadata:** the pill tags become one secondary-text line joined with "·". "Project off" becomes a word in that line, not a badge.
- **Status:** the same glyph + word as Health (dot / ring spinner / triangle / hollow ring), using the semantic tokens. The tinted background badge is gone.
- **Row actions:** today's three always-visible icon buttons move behind a **"⋯" menu** (Re-index · Disable/Enable · Remove), so each row has one clear control (Q1). The menu uses a `.menu` / `.menu-item` class with hover, focus and disabled states.
- **Expanded detail:**
  - Fields stay as a label/value grid, with `--text-xs` minimum and no uppercase micro-labels below 0.7rem.
  - The error message becomes a plain line with an alert glyph, with no red box.
  - The SourceCard preview stays.
- **Toolbar:** the search field and filters stay. "Upload document" stays the only primary button. The grey band behind the toolbar is removed, leaving whitespace and one hairline.
- **Header:** the Admin/User View pill becomes a `.text-action`-style toggle with real focus-visible and pressed states, or the segmented control (Q2).
- **Colours:** every hardcoded `rgba()` in `DocumentManagerModal.tsx` is replaced with tokens. `--success-surface` / `--danger-surface` are added to `tokens.css` only if something still needs a tint.
- **Mobile (< 720px):** the status word sits under the title, the "⋯" menu stays on the right, and rows are at least 44px.

## 2. Code shape
| File | Change |
|---|---|
| `components/documents/DocumentManagerModal.tsx` | `DocumentRow` rewritten. `Tag`, `RowAction` and `STATUS_CONFIG` backgrounds are removed. Status reuses a shared `StatusGlyph` |
| `components/admin/StatusGlyph.tsx` *(new)* | Extracted from `HealthPanel` and shared by both |
| `styles/components.css` | `.doc-row`, `.doc-row-trigger`, `.menu`, `.menu-item`, `.view-toggle` |
| `components/chat/MessageItem.tsx` | Optional: the per-answer model caption (Q3) |

## 3. Decisions needed
- **Q1: Row actions.** Use a "⋯" menu (recommended; calmer, one control per row), or keep inline icon buttons restyled as quiet tertiary icons?
- **Q2: Admin/User View control.** A text toggle in the header (recommended), or a two-option segmented control?
- **Q3: Per-answer model name in chat (CHAT-009).** Keep it in the hover action bar (current), or show it always as a quiet caption under each answer?

## 4. Decisions and deviations (applied 2026-09-22)
- Q1 → **"⋯" menu** (`components/ui/Menu.tsx`). Q2 (not asked) → the recommended **text toggle**. Q3 → the per-answer model stays in the **hover action bar**.
- "Error" status is now worded "Failed". "Remove…" in the menu still opens the inline confirmation, now styled with `.confirm-backdrop` / `.confirm-card` and `role="alertdialog"`.
- The title and the controls in the modal header share the width, so the section switch stays centred when the subtitle changes.
- `--text-on-color` token added for text on filled semantic colours (and the switch knob).
- Verified in the browser at desktop and 420 px: flat rows, the menu, Esc closes the menu first and then the modal, expanded detail, Projects, Health.
