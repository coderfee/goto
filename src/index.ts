import { errorPage, homePage, mailtoPage } from './html';

let cachedRoutes: Record<string, string> | undefined;

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
		let raw = String(value);
		if (raw.startsWith('b64:')) {
			try {
				raw = atob(raw.slice(4));
			} catch {
				throw new Error(`Invalid base64 value for route "${key}"`);
			}
		}
		let target: URL;
		try {
			target = new URL(raw);
		} catch {
			throw new Error(`Invalid target URL for route "${key}"`);
		}
		if (target.protocol === 'mailto:') {
			if (!/^mailto:[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(target.href)) {
				throw new Error(`Invalid mailto target for route "${key}"`);
			}
			routes[key] = target.href;
			continue;
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

		if (!key) {
			log('home', 200);
			return homePage(routes, url.origin);
		}

		const target = routes[key];
		if (!target) {
			log('not_found', 404);
			return errorPage(404, 'this goto goes nowhere.');
		}

		if (target.startsWith('mailto:')) {
			log('mailto', 200, target);
			return mailtoPage(target);
		}

		const suffix = rest.length > 0 ? `/${rest.join('/')}` : '';
		const location = target + suffix + url.search;
		log('redirect', 302, location);
		return Response.redirect(location, 302);
	},
} satisfies ExportedHandler<Env>;
