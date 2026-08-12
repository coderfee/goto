# goto

[简体中文](./README.zh-CN.md)

A tiny short-link redirect service running on Cloudflare Workers. Map short paths on your own domain to anywhere:

```
go.example.com/github  ->  https://github.com/<username>
go.example.com/x       ->  https://x.com/<username>
```

Trailing paths and query strings are forwarded, so `go.example.com/github/goto?tab=readme` lands on `https://github.com/<username>/goto?tab=readme`.

## Features

- **Path-based short links** — one Worker, one domain, unlimited routes
- **Path & query forwarding** — deep links just work
- **External route config** — routes live in env vars (`.dev.vars` locally, secrets in production), not in code
- **Safe by default** — only `GET`/`HEAD`, only `https:` targets, strict route validation at startup
- **Structured access logs** — every request logged as JSON (outcome, status, key, location, country, UA), viewable via `wrangler tail` or the Cloudflare dashboard

## Quick Start

Prerequisites: [pnpm](https://pnpm.io/), a Cloudflare account, and your domain's DNS hosted on Cloudflare.

```bash
pnpm install
cp .dev.vars.example .dev.vars   # then edit your routes
pnpm dev                         # http://localhost:8788
```

Try it:

```bash
curl -sI http://localhost:8788/github
# HTTP/1.1 302 Found
# Location: https://github.com/<username>
```

## Configuration

Routes are defined in the `ROUTES` environment variable as a JSON object mapping a short key to an `https://` target:

```json
ROUTES={"github":"https://github.com/<username>","x":"https://x.com/<username>"}
```

- **Local**: put it in `.dev.vars` (git-ignored)
- **Production**: set it as a secret after deploying:

  ```bash
  npx wrangler secret put ROUTES
  ```

Rules enforced at startup (a bad config fails fast with a 500 and an error log):

- keys must match `^[a-z0-9][a-z0-9-]*$`
- targets must be valid `https:` URLs without embedded credentials, or plain `mailto:` addresses (e.g. `mailto:you@example.com`) — mailto routes render a page that launches the visitor's mail client
- any value may be stored as `b64:<base64>` (e.g. `b64:bWFpbHRvOnlvdUBleGFtcGxlLmNvbQ==`) to keep plaintext out of the config; the Worker decodes it at startup

After changing bindings, re-run `pnpm cf-typegen` to regenerate `Env` types.

## Deployment

1. Make sure your domain's DNS is on Cloudflare.
2. Point the custom domain at the Worker in `wrangler.jsonc`:

   ```jsonc
   "routes": [{ "pattern": "go.example.com", "custom_domain": true }]
   ```

3. Deploy and set the routes secret:

   ```bash
   pnpm deploy
   npx wrangler secret put ROUTES
   ```

Wrangler creates the DNS record for the custom domain automatically.

## Development

| Command           | Purpose                              |
| ----------------- | ------------------------------------ |
| `pnpm dev`        | Local dev server                     |
| `pnpm check`      | Biome format + lint (auto-fix)       |
| `pnpm format`     | Biome format only                    |
| `pnpm lint`       | Biome lint only                      |
| `pnpm cf-typegen` | Regenerate `Env` types via wrangler  |
| `pnpm deploy`     | Deploy to Cloudflare                 |

Git hooks are managed by [lefthook](https://lefthook.dev) (installed automatically via `pnpm install`):

- `pre-commit`: biome check on staged files + `tsc --noEmit`
- `commit-msg`: [commitlint](https://commitlint.js.org/) with the conventional commits spec

## How It Works

- `src/index.ts` — request handling: first path segment is the route key, looked up in `ROUTES` (parsed once and cached in module scope). 302-redirect to `target + remaining path + query`; unknown keys get a themed 404; `mailto:` targets render a page that launches the mail client; `/` serves a small branded homepage.
- `src/html.ts` — all HTML pages (homepage, error pages, mailto page) sharing one themed shell: light/dark via `prefers-color-scheme`, themed favicon, SEO meta on the homepage, `noindex` on error and mailto pages.

## License

MIT
