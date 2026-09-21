# EgSA AI Platform — web app

Read before making changes:
- `agent/CONTEXT.md` — purpose, architecture, code map, conventions, gotchas
- `agent/PROJECT_PLAN.md` — requirement IDs → status, what's next, what's blocked
- `.agent/design_system.md` — visual design rules (Apple-HIG-inspired)

After a feature/fix lands:
- Add an entry under `[Unreleased]` in `CHANGELOG.md` (with requirement IDs if applicable)
- Update requirement status in `agent/PROJECT_PLAN.md`
- Update `agent/CONTEXT.md` if architecture, code map, or conventions changed

Verify with `npx tsc -b` and `npm run lint` (both must be clean). Dev server: `npm run dev` (:5173).

Do not run git commit/push/PR operations — the user handles git.
