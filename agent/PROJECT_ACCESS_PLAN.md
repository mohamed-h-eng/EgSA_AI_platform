# Plan: Disable a project or document set without deleting it (ADM-007)

> Status: **APPLIED 2026-09-22** with the recommended answers (project + subsystem · Projects section · hide in the Copilot scope picker). Deviations are listed in §7.
> Date: 2026-09-22
> Spec: ADM-007 (Should): *"The system should allow configuration to disable access to a project or document set without deleting the original source files."*
> Related: [`PROJECT_PLAN.md`](PROJECT_PLAN.md) §3 (Administration UI), [`ADMIN_HEALTH_PLAN.md`](ADMIN_HEALTH_PLAN.md) (the Administration modal this extends), [`../.agent/design_system.md`](../.agent/design_system.md)

## 1. Today

- Only single documents can be disabled (row action → `status: 'disabled'`, with the previous status remembered).
- `ProjectDefinition` is `{id, name, subsystems}` and has no on/off state. The Copilot searches every `indexed` document in scope.

## 2. Behaviour

- An admin can switch off a **project**, or a **subsystem inside a project** (the "document set", see Q1).
- Switching off is **non-destructive**. Document rows, statuses and index state are left exactly as they are. Access is gated at query time, so switching back on restores everything with no re-indexing.
- While a project or subsystem is off:
  - **Knowledge Copilot** doesn't search its documents. They count as "not searchable" in the scope step, with the reason given: "2 documents in disabled projects". If the user scoped the question to a disabled project, the answer is `insufficient`, saying "This project is disabled by an administrator" (KB-011 wording, no guessing).
  - **Document list:** rows stay visible to admins with a quiet "Project off" tag, and per-document actions still work. In User View, those rows are hidden.
  - **Upload** into a disabled project is still allowed. The document indexes normally but isn't searchable until the project is back on. The form shows one line of helper text saying so.
  - **Health → Knowledge index** detail adds "1 project disabled".

## 3. Where admins control it (Q2)

**Option A (recommended): a "Projects" section in the Administration modal**, so the switch reads **Documents | Projects | Health**. It's a flat list, one row per project with its subsystems indented under it:
```
  Orbit-1 Satellite Platform            12 documents          [ On ]
     ADCS                                4                     [ On ]
     Power (EPS)                         3                     [ Off ]
     …
  ─────────────────────────────────────────────────────────────────────
  Ground Segment                         2 documents          [ Off ]
     Mission Control                     1        (inherits project: off, switch disabled)
```
- The switches are native `<input type="checkbox" role="switch">` styled as a switch, with hover, focus-visible and disabled states in `components.css`. The on/off word sits next to each switch, so state isn't shown by colour alone.
- Turning a project off shows an inline confirmation line under the row, with no modal: "Copilot will stop searching 12 documents. Nothing is deleted. [Turn off] [Cancel]".
- Mobile: the same list, with the count under the name and 44 px rows.

**Option B:** a project switch in the Documents toolbar that appears only when a project filter is selected. It's fewer surfaces, but hard to find and doesn't cover subsystems well.

## 4. Code shape

| File | Change |
|---|---|
| `types/index.ts` | `ProjectDefinition` gets `disabled?: boolean` and `disabledSubsystems?: string[]`. Undefined means enabled, so saved state keeps working. |
| `stores/documentStore.ts` | `setProjectEnabled(id, on)` and `setSubsystemEnabled(id, subsystem, on)`. `adminSection` gains `'projects'`. A shared helper `isDocumentAccessible(doc, projects)` goes in the store module. |
| `services/knowledge/knowledgeService.ts` | `searchable` also requires `isDocumentAccessible`. The scope-step detail and the insufficient message include the reason. This mirrors what the backend will enforce, and the real rule belongs server-side (`GET /api/documents` visibility). |
| `components/admin/ProjectAccessPanel.tsx` *(new)* | The list above. |
| `components/documents/DocumentManagerModal.tsx` | Third segment, a "Project off" tag on rows, and User View hides inaccessible rows. |
| `components/documents/DocumentUploadModal.tsx` | Helper line when the chosen project or subsystem is off. |
| `services/health/healthService.ts` | "N projects disabled" in the index detail. |
| `styles/components.css` | `.switch` control. |

## 5. Out of scope
- Audit trail of who switched what (ADM-006) needs backend auth; it's noted as a follow-up.
- Adding, renaming or removing projects (ADM-002 edit UI). The project list stays the seeded `DEFAULT_PROJECTS`.

## 6. Decisions needed
- **Q1: Granularity.** Project **and** subsystem switches (recommended), or project only?
- **Q2: Placement.** A (Projects section in Administration), or B (toolbar switch when a project is filtered)?
- **Q3: Copilot scope picker.** Should disabled projects be **hidden** from the scope filter (recommended), or listed with an "(off)" suffix?

## 7. Decisions and deviations (applied)
- Q1 → **project + subsystem**, Q2 → **A (Projects section)**, Q3 → **hidden** from the Copilot scope picker.
- If the Copilot's saved scope points at a project that has since been switched off, the page resets the scope to All Projects (unless an answer is streaming). The service still returns the "disabled by an administrator" insufficient answer if a query with that scope gets through.
- Helpers `isDocumentAccessible` / `isProjectAccessible` are exported from `documentStore.ts` and shared by the service, the Copilot page, the manager and the upload form.
- When a project is off, its subsystem switches are shown off and disabled ("Project is off"). The subsystem's own saved setting is kept and comes back when the project is switched on again.
- Health doesn't treat a switched-off project as degraded, because it's intentional. The index detail just notes it.
- Switch styling is a native checkbox with `role="switch"`, green when on (`--success`), with the On/Off word next to it.
- Not verified in a browser (the Chrome extension wasn't connected). What was verified: `tsc -b`, lint, `vite build`.
