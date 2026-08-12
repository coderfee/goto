let cachedRoutes: Record<string, string> | undefined;

function errorPage(status: number, message: string, headers: Record<string, string> = {}): Response {
	const digits = String(status).split('');
	const code = digits.map((d, i) => (i > 0 ? `<span class="slash">/</span>${d}` : d)).join('');
	const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${status} — goto</title>
<style>
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: #0f1115;
    color: #e6e6e6;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }
  .code { font-size: 5rem; font-weight: 700; letter-spacing: 0.1em; }
  .code .slash { color: #6366f1; }
  .msg { color: #9ca3af; font-size: 1rem; }
  a { color: #6366f1; text-decoration: none; }
  a:hover { text-decoration: underline; }
</style>
</head>
<body>
  <div class="code">${code}</div>
  <p class="msg">${message}</p>
  <a href="/">&#8592; back to /</a>
</body>
</html>`;
	return new Response(html, { status, headers: { 'content-type': 'text/html; charset=utf-8', ...headers } });
}

function getRoutes(env: Env): Record<string, string> {
	if (cachedRoutes) return cachedRoutes;

	let parsed: unknown;
	try {
		parsed = JSON.parse(env.ROUTES ?? '{}');
	} catch {
		throw new Error('ROUTES is not valid JSON');
	}
	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		throw new Error('ROUTES must be a JSON object');
	}

	const routes: Record<string, string> = {};
	for (const [key, value] of Object.entries(parsed)) {
		if (!/^[a-z0-9][a-z0-9-]*$/.test(key)) {
			throw new Error(`Invalid route key: ${key}`);
		}
		let target: URL;
		try {
			target = new URL(String(value));
		} catch {
			throw new Error(`Invalid target URL for route "${key}"`);
		}
		if (target.protocol !== 'https:' || target.username || target.password) {
			throw new Error(`Unsafe target URL for route "${key}"`);
		}
		routes[key] = target.origin + target.pathname.replace(/\/+$/, '');
	}

	cachedRoutes = routes;
	return routes;
}

export default {
	async fetch(request, env): Promise<Response> {
		if (request.method !== 'GET' && request.method !== 'HEAD') {
			return errorPage(405, 'goto only accepts GET.', { allow: 'GET, HEAD' });
		}

		const url = new URL(request.url);
		const [key, ...rest] = url.pathname.split('/').filter(Boolean);
		const log = (outcome: string, status: number, location?: string) =>
			console.log(
				JSON.stringify({
					outcome,
					status,
					path: url.pathname,
					key: key ?? null,
					location: location ?? null,
					country: request.cf?.country ?? null,
					userAgent: request.headers.get('user-agent'),
				}),
			);

		let routes: Record<string, string>;
		try {
			routes = getRoutes(env);
		} catch (error) {
			console.error(`Failed to load ROUTES: ${error instanceof Error ? error.message : String(error)}`);
			return errorPage(500, 'goto is misconfigured.');
		}

		const target = key ? routes[key] : undefined;
		if (!target) {
			log('not_found', 404);
			return errorPage(404, 'this goto goes nowhere.');
		}

		const suffix = rest.length > 0 ? `/${rest.join('/')}` : '';
		const location = target + suffix + url.search;
		log('redirect', 302, location);
		return Response.redirect(location, 302);
	},
} satisfies ExportedHandler<Env>;
