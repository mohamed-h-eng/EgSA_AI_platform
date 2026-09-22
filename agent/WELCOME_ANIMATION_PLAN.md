# Plan: Starfield animation on the chat welcome screen

> Status: **APPLIED 2026-09-22** with the recommended answers (Q1 A: stars + shooting star · Q2 canvas · Q3 light-mode dust). See §6.
> Date: 2026-09-22
> Request: add simple space-themed animation (stars and similar) to the chat welcome screen only. It must stop once a conversation starts, so it never distracts from reading answers.
> Related: [`../.agent/design_system.md`](../.agent/design_system.md) (Motion: *"subtle and physical… avoid excessive animation… respect prefers-reduced-motion"*), [`CONTEXT.md`](CONTEXT.md)

## 1. Where it appears, and where it doesn't

| Screen | Animation |
|---|---|
| **Chat, empty conversation** (the welcome hero: logo, "EgSA Intelligence", starter prompts) | **Yes** |
| Chat once the first message is sent | **No.** It fades out over 300 ms as the conversation appears, and is removed from the page, not just hidden |
| Knowledge Copilot (any state), Settings, Administration | No |
| `prefers-reduced-motion: reduce` | Static stars only: no twinkle, no shooting stars |
| Browser tab in the background | Paused (no CPU/GPU use) |

The trigger is the existing `isEmptySession` check in `MessageList.tsx`. New conversation → welcome → stars. Send a message or click a starter prompt → stars fade out.

## 2. What it looks like

A quiet night sky behind the welcome content. It sits behind the text and never covers or competes with it.

```
   ·        ✦            ·                 ·          ·
        ·          ·              ✧                          ·
  ·                        [ EgSA logo ]          ·
            ·                                            ·
                          EgSA Intelligence       ╲  ← a rare, slow shooting star
     ✧            Orbital telemetry, mission…      ╲     (about one every 8–12 s)
   ·                                                          ·
          ┌──────────────────────────────────────┐        ·
      ·   │ Show telemetry status for our LEO…  ↗│   ·
          └──────────────────────────────────────┘
```

- **Stars:** about 90 small dots on desktop (about 45 on phones), 0.5–1.6 px, sized by random "depth".
- **Twinkle:** each star slowly changes brightness (a 3–7 s cycle, random phase), so the sky never pulses all at once.
- **Drift:** the whole field drifts very slowly, about 4 px per second, giving a faint sense of motion without anything to "watch".
- **Shooting star:** one thin streak about every 8–12 s. It crosses a corner of the screen in about 0.8 s and fades out. It never passes behind the title or the starter prompts.
- **Fade-in** over 600 ms when the welcome screen appears, and **fade-out** over 300 ms when the chat starts.
- A **soft edge fade** (radial mask) keeps stars sparse behind the logo and text, so contrast and readability don't change.
- **Colours come from tokens, not hardcoded:**
  - Dark mode: stars use `--text-primary` (near-white) at 20–80 % opacity.
  - Light mode (Q3): stars use `--text-muted` at lower opacity, so they read as "dust" on white.
  - The shooting star has a faint `--accent-primary` tint at its head, the one accent colour.

## 3. How it's built

| File | Change |
|---|---|
| `src/components/chat/WelcomeStarfield.tsx` *(new)* | One `<canvas>`, positioned absolute, `inset: 0`, `pointer-events: none`, `aria-hidden`, placed behind the scroll area |
| `src/components/chat/MessageList.tsx` | Render `<WelcomeStarfield active={isEmptySession} />` inside the existing outer wrapper, with the scroll content above it (`position: relative; z-index: 1`) |
| `src/styles/components.css` | `.welcome-starfield` (position, fade transition, the radial mask) |

**Why canvas (Q2):** one element instead of ~90 DOM nodes, cheap to draw, easy to pause, and it can read theme colours directly.

- **Frame loop:** `requestAnimationFrame`, capped at about 30 fps. Slow twinkle doesn't need 60 fps, and the cap halves the cost.
- **Stops when:** the tab is hidden (`visibilitychange`), the component unmounts, or reduced motion is on (one static frame is drawn instead).
- **Sharpness and resizing:** sized for the screen's pixel density (`devicePixelRatio`), and resized with a `ResizeObserver`.
- **Theme:** colours are read from CSS variables at start-up and again when the theme changes, so light, dark and system themes all work.
- **No new dependencies.**

## 4. Out of scope
- No animation on the Copilot page, in messages, or while an answer streams.
- No sound, parallax on mouse move, or anything interactive. The sky isn't clickable.
- Tidying the starter-prompt buttons' JavaScript hover handlers is left for a separate small change.

## 5. Decisions needed
- **Q1: Elements.**
  - (A) Twinkling stars + rare shooting star (recommended).
  - (B) A plus one faint orbit ellipse around the logo with a tiny satellite dot slowly travelling along it (about 40 s per orbit).
  - (C) Twinkling stars only.
- **Q2: Technique.** Canvas (recommended), or CSS/SVG dots? CSS/SVG is simpler to read, but it means more DOM nodes and is harder to pause.
- **Q3: Light mode.** Show faint grey "dust" in light mode too (recommended, for consistency), or only in dark mode?

## 6. Decisions and deviations (applied)
- Implemented as planned in `components/chat/WelcomeStarfield.tsx`, mounted in `MessageList.tsx`, with `.welcome-starfield` in `components.css`.
- The fade-in uses the opacity-only `fadeInOverlay` (the shared `fadeIn` also moves elements 4 px).
- The sky paints a still frame immediately and again after every resize or theme change. Resizing a canvas clears it, and animation frames don't run in background tabs.
- Found while testing: the "Model not configured" chat message was shown twice (answer text + error box). It now shows once (`chatStore.ts`).
- Verified in the browser (dark theme): stars sparse behind the title, a shooting star in a corner using the accent tint, the state switching to `leaving` on the first message and the canvas removed within 500 ms, stars returning for a new empty chat, and none on the Knowledge Copilot page.

