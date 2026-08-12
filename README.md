# goto

[简体中文](./README.zh-CN.md)

A tiny short-link redirect service running on Cloudflare Workers. Map short paths on your own domain to anywhere:

```
go.coderfee.com/github  ->  https://github.com/coderfee
go.coderfee.com/x       ->  https://x.com/coderfee
```

Trailing paths and query strings are forwarded, so `go.coderfee.com/github/goto?tab=readme` lands on `https://github.com/coderfee/goto?tab=readme`.

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
# Location: https://github.com/coderfee
```

## Configuration

Routes are defined in the `ROUTES` environment variable as a JSON object mapping a short key to an `https://` target:

```json
ROUTES={"github":"https://github.com/coderfee","x":"https://x.com/coderfee"}
```

- **Local**: put it in `.dev.vars` (git-ignored)
- **Production**: set it as a secret after deploying:

  ```bash
  npx wrangler secret put ROUTES
  ```

Rules enforced at startup (a bad config fails fast with a 500 and an error log):

- keys must match `^[a-z0-9][a-z0-9-]*$`
- targets must be valid `https:` URLs without embedded credentials

After changing bindings, re-run `pnpm cf-typegen` to regenerate `Env` types.

## Deployment

1. Make sure your domain's DNS is on Cloudflare.
2. Point the custom domain at the Worker in `wrangler.jsonc`:

   ```jsonc
   "routes": [{ "pattern": "go.coderfee.com", "custom_domain": true }]
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

`src/index.ts` is the whole service (~100 lines):

1. Take the first path segment as the route key.
2. Look it up in `ROUTES` (parsed once and cached in module scope).
3. 302-redirect to `target + remaining path + query`; unknown keys get a 404 with the route list.

## License

MIT
