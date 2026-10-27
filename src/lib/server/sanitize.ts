// Sanitizes the admin-uploaded custom homepage. The HTML is reviewed by the admin before upload;
// this is the second line: no scripts, frames, forms, event handlers or javascript: URLs, so it
// can be rendered inline (fully indexable, no iframe) without touching customer sessions.

const BLOCKED = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'link', 'meta', 'base', 'frame', 'frameset', 'applet', 'noscript', 'template'];

export function sanitizeHtml(html: string): string {
	let out = html;
	for (const tag of BLOCKED) {
		out = out.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}\\s*>`, 'gi'), '');
		out = out.replace(new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi'), '');
	}
	// Event handlers and inline javascript/data-html URLs.
	out = out.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
	out = out.replace(/(href|src|xlink:href|action|formaction)\s*=\s*("|')\s*(javascript|vbscript|data:text\/html)[^"']*\2/gi, '$1="#"');
	out = out.replace(/(href|src)\s*=\s*(javascript|vbscript):[^\s>]*/gi, '$1="#"');
	// CSS: no @import, no expressions, no javascript: urls.
	out = out.replace(/@import[^;]+;?/gi, '').replace(/expression\s*\(/gi, '(').replace(/url\(\s*["']?\s*javascript:[^)]*\)/gi, 'none');
	return out;
}
