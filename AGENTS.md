# Cloudflare Workers

STOP. Your knowledge of Cloudflare Workers APIs and limits may be outdated. Always retrieve current documentation before any Workers, KV, R2, D1, Durable Objects, Queues, Vectorize, AI, or Agents SDK task.

## Docs

Base: https://developers.cloudflare.com/

- Workers: `/workers/`
- Product docs: `/kv/` · `/r2/` · `/d1/` · `/durable-objects/` · `/queues/` · `/vectorize/` · `/workers-ai/` · `/agents/`
- Limits and quotas: the product's `/platform/limits/` page, e.g. `/workers/platform/limits`
- Errors: `/workers/observability/errors/` — Error 1102 means CPU/memory exceeded, resolve it against the limits page
- Node.js compatibility: `/workers/runtime-apis/nodejs/`
- MCP: `https://docs.mcp.cloudflare.com/mcp`

If the application uses Durable Objects or Workflows, also follow its rules:

- Durable Objects: `/durable-objects/best-practices/rules-of-durable-objects/`
- Workflows: `/workflows/build/rules-of-workflows/`

## Commands

Scripts live in `package.json`. `cf-typegen` runs `wrangler types` — run it after changing bindings in `wrangler.jsonc`.
