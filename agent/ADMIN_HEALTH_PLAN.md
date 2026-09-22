# Plan: Service health for admins (ADM-005)

> Status: **APPLIED 2026-09-22** with the recommended answers to Q1–Q3 (Administration modal · manual + 30 s auto-refresh · `components.css`). Deviations are listed in §8.
> Date: 2026-09-22
> Spec: ADM-005 (Should): *"The system should provide basic model/service health information to administrators."* It also gives the UI side of NFR-OPS-005 (Must, *"basic health checks for core services"*) and uses `GET /api/health` from Appendix D.
> Related: [`PROJECT_PLAN.md`](PROJECT_PLAN.md) §3 (Administration UI), [`CONTEXT.md`](CONTEXT.md), [`../.agent/design_system.md`](../.agent/design_system.md)

## 1. Why this is next

In `PROJECT_PLAN.md` §4, items 1–2 are blocked on the backend and item 3 (KB-016/017) was deferred on purpose. That leaves ADM-005 as the next unblocked item. It is also the last Administration requirement that hasn't been started.

## 2. What admins see

There is one list of core services, and each row shows a **status word** (the status is never shown by colour alone), how long the check took, and a one-line detail.

| Service | Source of truth today (mock/derived) | Real source later |
|---|---|---|
| **EgSA Gateway / API** | Probe `GET /api/health`. If the response isn't JSON (the gateway isn't deployed yet, and Vite returns `index.html`), show **"Not connected"** and the detail "Gateway not deployed yet: the browser talks to the model directly". | `GET /api/health` itself |
| **Chat model** | Mock provider: **"Demo mode"** with the detail "Mock provider, no live model". Custom endpoint: a timed `GET …/models` through the existing `fetchAvailableModels()`. It costs no tokens (unlike `testEndpointConnection`, which sends a prompt). | Entry in the `/api/health` services list |
| **Knowledge index** | Derived from `documentStore`: N indexed, M indexing, K errors. **Degraded** if any document failed or none are indexed. | `/api/health` (ingestion + vector store) |
| **Embeddings / retrieval** | **"Unknown"**, with the detail "Reported by the gateway once connected". | `/api/health` |

Status values: `operational` · `degraded` · `down` · `unknown` (plus the `demo` label for the mock provider, which counts as `unknown` in the overall status).
Overall summary line: "All systems operational", "Some services degraded", or "N services unavailable". It also shows "Checked 12 s ago" (relative time).

## 3. Where it lives: decision needed (Q1)

**Option A (recommended): a "Health" section in the Knowledge Base admin modal.** The modal gets a two-item segmented control in its header, **Documents | Health**. Health is only shown in Admin View, so it reuses the ADM-001 gate. The modal is renamed "Administration", and the sidebar footer button keeps its database icon and gets the tooltip "Administration". This keeps every admin workflow in one place and adds no new navigation.

**Option B:** a new "System Health" tab in Settings. That's easy to find, but Settings is per-user preferences and has no admin gate.

**Option C:** a third page `#/admin`. This is the right long-term home once auth exists, but it's heavy for a single panel now.

## 4. Layout (Option A)

Desktop (inside the existing 900 px modal):
```
┌ Administration                    [Documents | Health]   Admin View  ✕ ┐
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  System health                                            Check now ↻  │  ← title-2 + tertiary button
│  Some services degraded · checked 12 s ago                             │  ← secondary text
│                                                                        │
│  ● Operational   Chat model              142 ms                        │  ← flat rows, hairline separators,
│                  gemma3 at http://10.0.0.5:11434/v1                    │    no cards
│  ───────────────────────────────────────────────────────────────────── │
│  ▲ Degraded      Knowledge index                                       │
│                  3 indexed · 1 failed (ADCS-ICD scan)                  │
│  ───────────────────────────────────────────────────────────────────── │
│  ○ Not connected EgSA Gateway / API                                    │
│                  Gateway not deployed yet: the browser talks to…       │
│  ───────────────────────────────────────────────────────────────────── │
│  ? Unknown       Embeddings / retrieval                                │
│                  Reported by the gateway once connected                │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```
- The status glyph is different for each state (dot / triangle / ring / question mark) and always sits next to the word, so status never depends on colour alone. Colours are the semantic tokens `--success` / `--warning` / `--danger` / `--text-muted`, with no new accent.
- Mobile (< 720 px, where the modal is already full-screen): the status word moves under the service name, latency sits on the right, and touch targets are at least 44 px.
- Motion: while a check runs, the "Check now" icon rotates. It stays still under `prefers-reduced-motion`. Rows cross-fade their status for 180 ms.
- In User View the segmented control is hidden and only Documents shows.

## 5. Code shape

| File | Change |
|---|---|
| `src/types/index.ts` | `ServiceStatus`, `ServiceHealth {id, name, status, latencyMs?, detail, checkedAt}`, and `SystemHealthReport {overall, services, checkedAt}`. This is also the shape we'll propose to Hussin for `/api/health`. |
| `src/services/health/healthService.ts` *(new)* | `getSystemHealth({signal})` is **the swap-in point** for `GET /api/health`. It runs the checks from §2 in parallel, with a 5 s timeout each. When the gateway returns JSON in the agreed shape, its services replace the derived ones. |
| `src/stores/healthStore.ts` *(new, not persisted)* | `report`, `isChecking`, `lastError`, `check()`, `startAutoRefresh()` / `stop` (see Q2). |
| `src/components/admin/HealthPanel.tsx` *(new)* | The panel above. |
| `src/components/documents/DocumentManagerModal.tsx` | Header segmented control (reusing the `.segmented` class) and the title "Administration". The body switches between the document list and `<HealthPanel/>`. The active section is kept in `documentStore` as `adminSection`. |
| `src/styles/knowledge.css` → `components.css` | Renamed (Q3). Adds `.health-row`, `.health-status`, `.status-glyph`, `.is-spinning` and a disabled state for `.text-action`. |
| `src/components/ui/Icons.tsx` | `ActivityIcon` for the Health segment. |

No change to the chat or Copilot data flow.

## 6. Out of scope (noted for later)
- ADM-006 audit log, CHAT-006 general vs. coding model profiles (`GET /api/models`), ADM-007 disabling a whole project. Each needs its own small plan.
- Real admin gating. It stays the client-side ADM-001 demo toggle until the backend has auth.

## 7. Decisions needed
- **Q1: Placement.** A (Administration modal, Documents | Health), B (Settings tab), or C (`#/admin` page)?
- **Q2: Refresh.** Manual "Check now" only, or also auto-refresh every 30 s while the panel is open?
- **Q3: Styles.** Add the new classes to `knowledge.css`, or rename it to a shared `components.css` now that it's used outside the Copilot?

## 8. Decisions and deviations (applied)
- Q1 → **A**, Q2 → **manual + 30 s auto** (skipped while the tab is hidden), Q3 → **renamed to `components.css`**.
- The auto-refresh timer lives in `HealthPanel`'s effect, not in `healthStore` as `startAutoRefresh`/`stop`. It stops on its own when the panel unmounts. The store only keeps `report` / `isChecking` / `lastError` / `check()`, and a new check aborts the one in flight.
- Status glyphs: dot = operational, triangle = degraded, crossed dot = unavailable, ring = unknown/not connected (the plan said "?"; a ring reads better at 12 px). The status word is always in primary text colour, and only the glyph uses the semantic colour, because `--warning` text on white fails contrast.
- The gateway probe runs first, then the chat-model and index checks run in parallel. If it returns a JSON report, that report replaces all derived rows; otherwise the gateway row is "Not connected".
- The modal header reads "Administration" in Admin View and "Engineering Knowledge Base" in User View.
- Not verified in a browser (the Chrome extension wasn't connected in this session). What was verified: `tsc -b`, lint, `vite build`, the dev server serving the new modules, and `/api/health` in dev returning `text/html` (so the "Not connected" path applies).
