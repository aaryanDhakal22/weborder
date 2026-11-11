// Is it safe to send the platform key to this main over this URL (DURABILITY-PLAN.md, "Network")?
// https always; plain http only to a private network: loopback, RFC 1918, Tailscale's CGNAT range
// (100.64.0.0/10), IPv6 loopback / unique-local, a *.ts.net (Tailscale MagicDNS) name, or a
// single-label name (a docker compose service, "main"). Anything else would carry the key across
// the internet in the clear. Pure (unit-tested); hooks.server.ts refuses to start on a problem.

/** Why this main URL is refused, or null when it's fine. */
export function mainUrlProblem(raw: string, allowInsecure = false): string | null {
	let u: URL;
	try {
		u = new URL(raw);
	} catch {
		return `MAIN_URL "${raw}" isn't a URL`;
	}
	if (u.protocol === 'https:') return null;
	if (u.protocol !== 'http:') return `MAIN_URL must be http(s), not ${u.protocol}`;
	if (allowInsecure || privateHost(u.hostname)) return null;
	return `MAIN_URL ${u.origin} is plain http to a public address: the platform key would cross the internet unencrypted. Use https, or main's private address (Tailscale / LAN), or set ALLOW_INSECURE_MAIN=1 for a test setup.`;
}

export function privateHost(h: string): boolean {
	const host = h.toLowerCase().replace(/^\[|\]$/g, '');
	if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.ts.net') || host.endsWith('.internal')) return true;
	if (!host.includes('.') && !host.includes(':')) return true; // single label: a docker service / LAN name
	if (host.includes(':')) return host === '::1' || /^f[cd][0-9a-f]{2}:/.test(host); // IPv6 loopback / unique-local
	const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
	if (!m) return false; // a public DNS name
	const [a, b] = [Number(m[1]), Number(m[2])];
	return a === 127 || a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}
