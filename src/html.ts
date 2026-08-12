const COMMON_STYLE = `
  :root {
    color-scheme: dark;
    --bg: #0f1115;
    --fg: #e6e6e6;
    --muted: #9ca3af;
    --accent: #818cf8;
    --card-bg: rgb(255 255 255 / 0.05);
  }
  @media (prefers-color-scheme: light) {
    :root {
      color-scheme: light;
      --bg: #fafafa;
      --fg: #18181b;
      --muted: #71717a;
      --accent: #6366f1;
      --card-bg: rgb(0 0 0 / 0.04);
    }
  }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 2rem 1rem;
    box-sizing: border-box;
    background: var(--bg);
    color: var(--fg);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }
  .code { font-size: clamp(3rem, 15vw, 5rem); font-weight: 700; letter-spacing: 0.1em; }
  .code .slash { color: var(--accent); }
  .logo { width: clamp(4rem, 18vw, 6rem); height: auto; }
  .msg { color: var(--muted); font-size: 1rem; text-align: center; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .brand { font-size: 1.5rem; font-weight: 700; margin: 0; }
  .brand .slash { color: var(--accent); }
  .cards {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 26rem;
    margin: 1.5rem 0;
  }
  .card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.875rem 0.5rem;
    min-height: 3rem;
    color: var(--fg);
    border-radius: 0.5rem;
    transition: background 0.15s ease;
  }
  .card:hover {
    background: var(--card-bg);
    text-decoration: none;
  }
  .card .icon { flex-shrink: 0; color: var(--accent); }
  .card .label { font-weight: 700; }
  .card .target { color: var(--muted); font-size: 0.8rem; }
  .card .arrow {
    margin-left: auto;
    color: var(--accent);
    opacity: 0;
    transform: translateX(-4px);
    transition: opacity 0.15s ease, transform 0.15s ease;
  }
  .card:hover .arrow { opacity: 1; transform: translateX(0); }
  @media (hover: none) {
    .card .arrow { opacity: 1; transform: none; }
  }
  .footer { color: var(--muted); font-size: 0.8rem; }
`;

const FAVICON_LINKS = `<link rel="icon" type="image/svg+xml" href="https://assets.coderfee.com/favicon/goto/light.svg" media="(prefers-color-scheme: light)">
<link rel="icon" type="image/svg+xml" href="https://assets.coderfee.com/favicon/goto/dark.svg" media="(prefers-color-scheme: dark)">`;

const NOINDEX = '<meta name="robots" content="noindex">';

// Icons: Lucide (https://lucide.dev), ISC License, stroke-based 24x24 paths rendered with currentColor.
const LUCIDE_PATHS: Record<string, string> = {
	github:
		'<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
	x: '<path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>',
	rss: '<path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>',
	mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
	link: '<path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" x2="16" y1="12" y2="12"/>',
	'arrow-up-right': '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
};

const ROUTE_ICONS: Record<string, string> = {
	github: 'github',
	x: 'x',
	rss: 'rss',
	mail: 'mail',
};

const ROUTE_NAMES: Record<string, string> = {
	github: 'GitHub',
	x: 'X',
	rss: 'RSS',
	mail: 'Email',
};

function icon(name: string, className: string, size = 20): string {
	return `<svg class="${className}" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${LUCIDE_PATHS[name]}</svg>`;
}

function htmlResponse(title: string, body: string, init: ResponseInit, head = ''): Response {
	const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — goto</title>
${FAVICON_LINKS}
${head}
<style>${COMMON_STYLE}</style>
</head>
<body>
${body}
</body>
</html>`;
	return new Response(html, {
		...init,
		headers: { 'content-type': 'text/html; charset=utf-8', ...init.headers },
	});
}

export function homePage(routes: Record<string, string>, origin: string): Response {
	const description = 'goto — a personal short-link service.';
	const head = `<meta name="description" content="${description}">
<meta property="og:title" content="goto">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:url" content="${origin}/">
<meta name="theme-color" content="#6366f1" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#818cf8" media="(prefers-color-scheme: dark)">`;

	const cards = Object.entries(routes)
		.map(([key, target]) => {
			const iconName = ROUTE_ICONS[key] ?? 'link';
			const name = ROUTE_NAMES[key] ?? key;
			const display = target.startsWith('mailto:') ? target.slice(7) : new URL(target).host;
			return `    <a class="card" href="/${key}">
      ${icon(iconName, 'icon')}
      <span><span class="label">${name}</span><br><span class="target">${display}</span></span>
      ${icon('arrow-up-right', 'arrow', 16)}
    </a>`;
		})
		.join('\n');

	const body = `  <picture>
    <source srcset="https://assets.coderfee.com/favicon/goto/dark.svg" media="(prefers-color-scheme: dark)">
    <img class="logo" src="https://assets.coderfee.com/favicon/goto/light.svg" alt="goto logo" width="96" height="96">
  </picture>
  <p class="brand">g<span class="slash">/</span>o</p>
  <p class="msg">${description}</p>
  <nav class="cards">
${cards}
  </nav>
  <p class="footer"><a href="https://coderfee.com">coderfee.com</a></p>`;
	return htmlResponse('go/', body, { status: 200 }, head);
}

export function errorPage(status: number, message: string, headers: Record<string, string> = {}): Response {
	const digits = String(status).split('');
	const code = digits.map((d, i) => (i > 0 ? `<span class="slash">/</span>${d}` : d)).join('');
	const body = `  <div class="code">${code}</div>
  <p class="msg">${message}</p>
  <a href="/">&#8592; back to /</a>`;
	return htmlResponse(digits.join('/'), body, { status, headers }, NOINDEX);
}

export function mailtoPage(mailto: string): Response {
	const address = mailto.slice('mailto:'.length);
	const head = `${NOINDEX}
<meta http-equiv="refresh" content="0; url=${mailto}">`;
	const body = `  <div class="code">&#64;</div>
  <p class="msg">opening your mail client&hellip;</p>
  <a href="${mailto}">${address}</a>
  <script>window.location.href = ${JSON.stringify(mailto)};</script>`;
	return htmlResponse('@', body, { status: 200 }, head);
}
