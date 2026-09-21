# EgSA AI Platform — Web App

Web frontend for the **EgSA AI Engineering Platform** pilot (Egyptian Space Agency): a locally-hosted general AI chat plus an Engineering Knowledge Copilot (document upload/management, RAG answers with source citations) and admin workflows.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
npm run lint     # oxlint
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

- [`agent/CONTEXT.md`](agent/CONTEXT.md) — architecture, code map, conventions
- [`agent/PROJECT_PLAN.md`](agent/PROJECT_PLAN.md) — requirements status and roadmap
- [`CHANGELOG.md`](CHANGELOG.md) — change history
- [`.agent/design_system.md`](.agent/design_system.md) — design guidelines
