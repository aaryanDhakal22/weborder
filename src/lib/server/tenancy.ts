// Request → host. The only place a request is tied to a store; everything downstream uses
// locals.store. The host is the request's own Host (or X-Forwarded-Host behind a trusted proxy),
// mapped through HOST_ALIASES in dev / LAN staging; main decides which store (if any) it is.
import { cfg, RESERVED } from './config';

export function cleanHost(raw: string | null): string {
	const h = (raw ?? '').split(',')[0].trim().toLowerCase();
	return (cfg.hostAliases.get(h) ?? h).replace(/:\d+$/, '').replace(/\.$/, '');
}

/** A host never worth asking main about: empty, an IP, a reserved platform subdomain. */
export function hopeless(host: string): boolean {
	if (!host || /^[\d.]+$/.test(host) || host.includes(':')) return true;
	const first = host.split('.')[0];
	return host.split('.').length > 2 && RESERVED.has(first);
}

export function requestHost(headers: Headers): string {
	const fwd = cfg.trustProxy ? headers.get('x-forwarded-host') : null;
	return cleanHost(fwd ?? headers.get('host'));
}

export function clientIp(headers: Headers, fallback: () => string): string {
	if (cfg.trustProxy) {
		const ff = headers.get('x-forwarded-for');
		if (ff) return ff.split(',')[0].trim();
	}
	try {
		return fallback();
	} catch {
		return '';
	}
}

/** Did the customer's browser use https? Behind a trusted proxy (TLS ends at Caddy / Traefik) its
 * X-Forwarded-Proto says; otherwise the request's own URL. Decides the Secure cookie flag and HSTS. */
export function viaHttps(headers: Headers, url: URL): boolean {
	if (cfg.trustProxy) {
		const p = headers.get('x-forwarded-proto');
		if (p) return p.split(',')[0].trim().toLowerCase() === 'https';
	}
	return url.protocol === 'https:';
}
