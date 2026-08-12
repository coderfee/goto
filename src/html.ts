const COMMON_STYLE = `
  :root {
    color-scheme: dark;
    --bg: #0f1115;
    --fg: #e6e6e6;
    --muted: #9ca3af;
    --accent: #818cf8;
  }
  @media (prefers-color-scheme: light) {
    :root {
      color-scheme: light;
      --bg: #fafafa;
      --fg: #18181b;
      --muted: #71717a;
      --accent: #6366f1;
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
    background: var(--bg);
    color: var(--fg);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }
  .code { font-size: 5rem; font-weight: 700; letter-spacing: 0.1em; }
  .code .slash { color: var(--accent); }
  .logo { width: 6rem; height: 6rem; }
  .msg { color: var(--muted); font-size: 1rem; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
`;

const FAVICON_LINKS = `<link rel="icon" type="image/svg+xml" href="https://assets.coderfee.com/favicon/goto/light.svg" media="(prefers-color-scheme: light)">
<link rel="icon" type="image/svg+xml" href="https://assets.coderfee.com/favicon/goto/dark.svg" media="(prefers-color-scheme: dark)">`;

const NOINDEX = '<meta name="robots" content="noindex">';

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

export function homePage(origin: string): Response {
	const description = 'goto — a personal short-link service.';
	const head = `<meta name="description" content="${description}">
<meta property="og:title" content="goto">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:url" content="${origin}/">
<meta name="theme-color" content="#6366f1" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#818cf8" media="(prefers-color-scheme: dark)">`;
	const body = `  <picture>
    <source srcset="https://assets.coderfee.com/favicon/goto/dark.svg" media="(prefers-color-scheme: dark)">
    <img class="logo" src="https://assets.coderfee.com/favicon/goto/light.svg" alt="goto logo">
  </picture>
  <p class="msg">${description}</p>
  <a href="https://coderfee.com">coderfee.com &#8599;</a>`;
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
