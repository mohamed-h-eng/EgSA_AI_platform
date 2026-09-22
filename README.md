# EgSA AI Platform — Web App

Web frontend for the **EgSA AI Engineering Platform** pilot (Egyptian Space Agency): a locally-hosted general AI chat plus an Engineering Knowledge Copilot (document upload/management, RAG answers with source citations) and admin workflows.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
npm run lint     # oxlint
<<<<<<< HEAD
npm test         # vitest (unit tests for retrieval, access, health, profiles)
=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
```

Works out of the box with the built-in **mock** model provider. To use a real model, open **Settings → Engine & API** and point it at any OpenAI-compatible endpoint (e.g. Ollama at `http://localhost:11434/v1`). Enable the proxy option in dev if the endpoint doesn't allow browser CORS.

Knowledge Base features (upload, document list, indexing status, source cards) currently run against a client-side mock store until the backend gateway API is available.

## Docker

```bash
docker build -t egsa-ai-web .
docker run -p 8080:80 egsa-ai-web
```

Serves the static build via nginx; intended to sit behind the EgSA gateway.

## Project docs

<<<<<<< HEAD
- [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) — user and administrator guide (D-12, web part)
=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
- [`agent/CONTEXT.md`](agent/CONTEXT.md) — architecture, code map, conventions
- [`agent/PROJECT_PLAN.md`](agent/PROJECT_PLAN.md) — requirements status and roadmap
- [`CHANGELOG.md`](CHANGELOG.md) — change history
- [`.agent/design_system.md`](.agent/design_system.md) — design guidelines
