# Plan: General and coding model profiles (CHAT-006), local-first

> Status: **APPLIED 2026-09-22.** See the last section for decisions and deviations.
> Date: 2026-09-22
> Spec:
> - CHAT-006 (Must): *"The system shall allow an administrator to configure at least one general model and one coding model."*
> - Related: CHAT-002 (local models by default), CHAT-003 (no Internet for core chat), CHAT-009 (show the active model/profile), NFR-MNT-004 (swap a model without a UI rewrite), Appendix D `GET /api/models` ("Configured model profiles").
> Related: [`PROJECT_PLAN.md`](PROJECT_PLAN.md) §3 (Core chat), [`CONTEXT.md`](CONTEXT.md)

## 1. Today
- **Settings → Intelligence & Models** offers a hardcoded `DEFAULT_MODELS` list: "EgSA Orbit-1", "Claude 3.5 Sonnet", "GPT-4o", "Gemini 2 Flash", "DeepSeek-V3".
  - These names are only labels. With the mock provider nothing runs them, and with a custom endpoint the real model is `customModelId`.
  - Showing cloud models contradicts CHAT-002/003 and misleads demo audiences.
- **Settings → Engine & API** offers one-click presets for OpenAI, Groq, OpenRouter and DeepSeek (Internet services) next to Ollama and LM Studio.
- There is a single global endpoint and model, with no general/coding distinction.

## 2. Target
A **model profile** is a named, admin-managed pairing of *role* + *endpoint* + *model name*:

```ts
interface ModelProfile {
  id: string;
  name: string;            // "General assistant", "Coding assistant"
  role: 'general' | 'coding';
  modelId: string;         // name the runtime knows, e.g. "qwen2.5:14b"
  endpointUrl?: string;    // empty = use the platform endpoint (Engine & API)
  description?: string;
  isDefault?: boolean;     // one default per role
}
```

- **Seeds:** "General assistant" and "Coding assistant", both on the platform endpoint. The model names are placeholders an admin must fill in (see Q2).
- **Admin (Admin View):** Settings gets a **Model profiles** section. Admins can add, edit and remove profiles and mark the default per role. At least one general and one coding profile must exist, and the UI blocks deleting the last one of a role.
- **Users:**
  - The chat header's model button becomes a **profile picker**, a short menu listing the profiles by role.
  - A new chat starts on the default general profile. The chosen profile is saved **on the session** (`session.profileId`), so each conversation keeps its own.
  - Answers already record `modelId` (CHAT-009) and will also record the profile name.
- **Provider layer:** `providerRegistry.getActiveProvider(config, profile)` resolves the endpoint and model from the profile. It falls back to the mock provider when no endpoint is set, so demo mode still works.
- **Swap-in point:** a `modelProfileService.listProfiles()` that returns the local list today and `GET /api/models` later.
- **Cloud presets (Q1):** removed from the default UI. Only Ollama, LM Studio and "EgSA Gateway / custom" remain.
- The "Specialist persona" section (system prompt presets) stays unchanged. Personas are prompts, not models.

## 3. Code shape
| File | Change |
|---|---|
| `types/index.ts` | `ModelProfile`; `ConversationSession.profileId?`; `ChatMessage.profileName?` |
| `constants/defaults.ts` | `DEFAULT_MODEL_PROFILES` replaces `DEFAULT_MODELS`. Trim `PROVIDER_PRESETS` (Q1) |
| `stores/settingsStore.ts` | `profiles` plus add, update, remove and set-default actions, reconciled with seeds on load (same pattern as `reconcileProjects`). This removes `activeModelId` |
| `services/ai/modelProfileService.ts` *(new)* | `listProfiles()` swap point, `resolveProfile(session)` |
| `services/ai/providerRegistry.ts` | Takes the profile into account |
| `stores/chatStore.ts` | New sessions get the default general profile. `sendMessage` uses the session's profile. Migration: sessions without `profileId` fall back to the default general profile |
| `components/settings/ModelTab.tsx` | "Active Intelligence Model" list → **Model profiles** (editable in Admin View, read-only otherwise) |
| `components/layout/Header.tsx` | Profile picker (menu), shows "Coding assistant · qwen2.5-coder:7b" |
| `components/chat/MessageItem.tsx` | Caption uses the profile name + model |
| tests | Profile resolution, default-per-role rules, and the "can't delete the last of a role" rule |

Admin gating reuses the existing client-side Admin View flag (`documentStore.isAdminMode`), moved into a small shared `sessionRoleStore` so Settings can read it too. Real gating still needs backend auth (ADM-001).

## 4. Decisions needed
- **Q1: Cloud presets.** Remove them (recommended: CHAT-002/003), or keep them behind a "Developer: external providers" toggle that's off by default?
- **Q2: Seed model names.** Empty placeholders that admins must fill in (recommended until Hesham picks the pilot models), or common Ollama defaults such as `llama3.1:8b` and `qwen2.5-coder:7b`?
- **Q3: Per-conversation switching.** Can users switch profile mid-conversation (recommended: the next answer uses the new profile, and the caption shows it), or only when starting a new chat?

## 5. Decisions and deviations (applied 2026-09-22)
- Q1 → cloud presets **removed** (OpenAI, Groq, OpenRouter, DeepSeek). Local-only presets: Ollama, LM Studio, "EgSA Gateway / Custom". Any URL can still be typed.
- Q2 → **empty** seed model names. Q3 (not asked) → the recommended default: switching mid-conversation is allowed and applies from the next answer.
- A profile with no model uses the Engine & API "Endpoint default model"; with neither, the chat answers "Model not configured" instead of calling a model. The old `gpt-4o-mini` fallbacks in `apiProvider.ts` were removed.
- There is no separate `modelProfileService.ts`. The rules live in `services/ai/modelProfiles.ts` (pure functions, tested), and the list lives in `settingsStore.profiles`, which is the swap-in point for `GET /api/models`.
- The shared admin flag is `stores/roleStore.ts` (the plan called it `sessionRoleStore`).
- Health → "General model" / "Coding model" rows check each default profile against its endpoint's model list.
- Verified in the browser: the header picker (menu, Esc), Settings → Models editing (role lock, remove disabled for the last profile of a role), and the header updating from the profile.
