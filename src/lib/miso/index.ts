// Miso, the quicc cat chef: the illustrator's animated SVGs (art/, delivered per docs/MISO-BRIEF.md,
// kept byte for byte) made ready for a page. Pure string work, the same on the server and in the
// browser, so the SSR markup hydrates as is.
//
// What prepare() changes:
// - the store colour: every #E2363B (hat band, apron, scooter deck, map pin) reads --miso-brand;
// - the whiskers read --miso-ink, so they show on dark themes too;
// - the sticker edge: one filter round the whole drawing (the shadow stays outside it). It opens
//   the outline first (erode, then a larger dilate), so lines as thin as the whiskers get no edge;
// - motion waits: every animation begins from one starter (<animate data-go>) that the component
//   fires only when the visitor allows motion. Until then (no JS, before hydration, reduced
//   motion) Miso holds the rest pose, which is the still drawing;
// - ids get the instance's prefix, so two of the same scene can share a page.

export type Scene =
	| 'received' | 'cooking' | 'ready' | 'out' | 'done' | 'placed'
	| 'closed' | 'paused' | 'loading'
	| 'empty-cart' | 'no-deals' | 'no-orders' | 'wave'
	| 'lost' | 'declined' | 'outside'
	| 'idle' | 'peek' | 'side';

export interface Prepared {
	scene: Scene;
	svg: string;
	/** viewBox width / height, for the box the page reserves. */
	w: number;
	h: number;
}

/** The art's store colour and whisker ink, as the illustrator drew them. */
const BRAND = '#E2363B';
const INK = '#2B1D1A';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** The index just past the element that opens at `at` (counts nested <g>; everything else in the art self-closes). */
function endOf(s: string, at: number): number {
	const re = /<g\b[^>]*?(\/?)>|<\/g>/g;
	re.lastIndex = at;
	let depth = 0;
	for (let m = re.exec(s); m; m = re.exec(s)) {
		if (m[0] === '</g>') depth--;
		else if (!m[1]) depth++;
		if (depth === 0) return re.lastIndex;
	}
	return s.length;
}

/** Moves fill/stroke colours that should follow a CSS variable into one style attribute per tag. */
function themed(tag: string, ink: boolean): string {
	const style: string[] = [];
	const out = tag.replace(/\s(fill|stroke)="(#[0-9A-Fa-f]{6})"/g, (all, prop: string, hex: string) => {
		const h = hex.toUpperCase();
		if (h === BRAND) style.push(`${prop}:var(--miso-brand,${BRAND})`);
		else if (ink && prop === 'stroke' && h === INK) style.push(`stroke:var(--miso-ink,${INK})`);
		else return all;
		return '';
	});
	return style.length ? out.replace(/\s*(\/?)>$/, ` style="${style.join(';')}"$1>`) : out;
}

export function prepare(raw: string, uid: string, label: string | null): Prepared {
	let s = raw.replace(/<!--[\s\S]*?-->/g, '').trim();
	const root = /^<svg\b[^>]*>/.exec(s);
	const scene = root && /\bid="miso-([a-z-]+)"/.exec(root[0])?.[1];
	const vb = root && /\bviewBox="([^"]+)"/.exec(root[0])?.[1];
	if (!root || !scene || !vb) throw new Error('miso: not a Miso scene');
	const [, , w, h] = vb.split(/[\s,]+/).map(Number);
	const p = `${scene}-${uid.replace(/[^A-Za-z0-9]/g, '')}`;

	// ids + references (url(#…), syncbase begins) to the instance's prefix
	s = s.slice(root[0].length).replace(new RegExp(`(["#])${scene}-`, 'g'), `$1${p}-`);
	// colours that follow the page
	const wStart = s.indexOf(`<g id="${p}-whiskers"`);
	const wEnd = wStart < 0 ? -1 : endOf(s, wStart);
	s = s.replace(/<[a-zA-Z][^>]*>/g, (tag, at: number) => themed(tag, at >= wStart && at < wEnd && wStart >= 0));
	// every animation waits for the starter
	s = s.replace(/\sbegin="([^"]+)"/g, (_, v: string) => ` begin="${p}-go.begin+${v}"`);

	// defs + the sticker edge
	const halo =
		`<filter id="${p}-edge" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">` +
		`<feMorphology in="SourceAlpha" operator="erode" radius="2" result="o"/>` +
		`<feMorphology in="o" operator="dilate" radius="6.5" result="d"/>` +
		`<feFlood style="flood-color:var(--miso-edge,#FFF8EC)"/><feComposite in2="d" operator="in"/>` +
		`<feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
	let defs = '';
	if (s.startsWith('<defs>')) {
		const end = s.indexOf('</defs>') + 7;
		defs = s.slice(0, end - 7) + halo + '</defs>';
		s = s.slice(end);
	} else defs = `<defs>${halo}</defs>`;
	let shadow = '';
	if (s.startsWith(`<g id="${p}-shadow"`)) {
		const end = endOf(s, 0);
		shadow = s.slice(0, end);
		s = s.slice(end);
	}
	const body = s.replace(/<\/svg>\s*$/, '');
	const go = `<g><animate data-go="" id="${p}-go" attributeName="opacity" values="1;1" dur="1s" begin="indefinite"/></g>`;
	const a11y = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"';
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" class="miso-svg miso-${scene}" ${a11y} focusable="false">` +
		`${defs}${go}${shadow}<g filter="url(#${p}-edge)">${body}</g></svg>`;
	return { scene: scene as Scene, svg, w, h };
}
