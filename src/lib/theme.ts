// Theme engine: presets + one brand color → every design token, with a WCAG contrast guard.
// OKLCH math is hand-written (no color library). Pure module.
import fonts from './fonts.json' with { type: 'json' };

// ------------------------------------------------------------------ color math

type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
	let h = hex.replace('#', '').trim();
	if (h.length === 3) h = h.split('').map((c) => c + c).join('');
	const n = parseInt(h.slice(0, 6), 16);
	return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
export function rgbToHex([r, g, b]: RGB): string {
	const c = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0');
	return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function toOklch(hex: string): [number, number, number] {
	const [r, g, b] = hexToRgb(hex).map(lin) as RGB;
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
	const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
	const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
	const C = Math.hypot(A, B);
	const H = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
	return [L, C, H];
}
function oklchToLinear(L: number, C: number, H: number): RGB {
	const a = C * Math.cos((H * Math.PI) / 180);
	const b = C * Math.sin((H * Math.PI) / 180);
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
	return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
/** OKLCH → hex, reducing chroma until the color fits sRGB. */
export function oklch(L: number, C: number, H: number): string {
	let lo = 0;
	let hi = C;
	let rgb = oklchToLinear(L, C, H);
	const inGamut = (c: RGB) => c.every((v) => v >= -0.0005 && v <= 1.0005);
	if (!inGamut(rgb)) {
		for (let i = 0; i < 24; i++) {
			const mid = (lo + hi) / 2;
			if (inGamut(oklchToLinear(L, mid, H))) lo = mid;
			else hi = mid;
		}
		rgb = oklchToLinear(L, lo, H);
	}
	return rgbToHex(rgb.map(gam) as RGB);
}

export function luminance(hex: string): number {
	const [r, g, b] = hexToRgb(hex).map(lin);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
	const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
	return (x + 0.05) / (y + 0.05);
}
/** Moves fg's lightness away from bg until the pair reaches `min` (WCAG AA = 4.5). */
export function ensureContrast(fg: string, bg: string, min = 4.5): string {
	if (contrast(fg, bg) >= min) return fg;
	const [L, C, H] = toOklch(fg);
	const darker = luminance(bg) > 0.18;
	for (let i = 1; i <= 100; i++) {
		const nl = darker ? L - i * 0.01 : L + i * 0.01;
		if (nl < 0 || nl > 1) break;
		const c = oklch(nl, C, H);
		if (contrast(c, bg) >= min) return c;
	}
	return darker ? '#000000' : '#FFFFFF';
}
/** Readable text on a filled color: the darkest or lightest tint of its hue. */
export function onColor(bg: string): string {
	const [, , H] = toOklch(bg);
	const dark = oklch(0.22, 0.06, H);
	const light = oklch(0.98, 0.01, H);
	return contrast(dark, bg) >= contrast(light, bg) ? dark : light;
}
const mix = (hex: string, alpha: number) => {
	const [r, g, b] = hexToRgb(hex).map((v) => Math.round(v * 255));
	return `rgba(${r},${g},${b},${alpha})`;
};

// ------------------------------------------------------------------ presets

export type Palette = Record<string, string>;
export interface FontSet {
	display: string;
	body: string;
	num: string;
	weight: number;
	case: 'none' | 'uppercase';
	track: string;
	/** Faces to preload: [family, weight]. */
	preload: [string, string][];
}
export interface Layout {
	menu: 'compact' | 'photo' | 'printed';
	nav: 'top' | 'side' | 'bottom';
	header: 'glow' | 'cover' | 'custom' | 'wordmark';
}
export interface Preset {
	id: string;
	name: string;
	desc: string;
	mode: 'dark' | 'light';
	fonts: FontSet;
	radius: 'soft' | 'round' | 'sharp';
	borderW: number;
	layout: Layout;
	palette: (brand: string) => Palette;
	sampleBrand: string;
}

const STATUS = {
	dark: { ok: '#4ADE80', warn: '#FBBF24', bad: '#F87171', info: '#6BA8FF' },
	light: { ok: '#15803D', warn: '#B45309', bad: '#B91C1C', info: '#1D4ED8' }
};

/** Theme zero: Quibase dark, exactly (mobile-agent/lib/theme/quicc_colors.dart). */
const QUIBASE_DARK: Palette = {
	canvas: '#0F0D1A', surface: '#171425', elev: '#211D35', hover: '#2D2844', border: '#2A2640', 'border-strong': '#3D3660',
	text: '#F4F1FB', text2: '#B8B0D4', muted: '#8A82A8', brand: '#AC94F4', 'on-brand': '#241B47', 'brand-soft': 'rgba(172,148,244,.16)', 'brand-ink': '#AC94F4',
	accent2: '#AC94F4', ...STATUS.dark, save: '#FBBF24', 'on-save': '#241B47', scrim: 'rgba(5,4,10,.62)', 'field-bg': '#211D35', 'photo-bg': '#211D35', 'photo-ink': '#8A82A8',
	wordmark: '#AC94F4', 'deal-bg': '#AC94F4', 'deal-ink': '#241B47', 'deal-bg2': '#2D2844', 'deal-ink2': '#F4F1FB', leader: '#3D3660',
	fur: '#CFC4EE', hat: '#FFFFFF', mline: '#241B47', blush: 'rgba(248,113,113,.45)'
};

interface NeutralSpec {
	hue: number;
	chroma: number;
	L: [number, number, number, number, number, number]; // canvas surface elev hover border borderStrong
	text: [number, number, number]; // text text2 muted
	textChroma: number;
}

function generated(mode: 'dark' | 'light', brand: string, n: NeutralSpec, extra: Partial<Palette> = {}): Palette {
	const [, , bh] = toOklch(brand);
	const N = (L: number, c = n.chroma) => oklch(L, c, n.hue);
	const canvas = N(n.L[0]);
	const surface = N(n.L[1]);
	const text = N(n.text[0], n.textChroma);
	const brandInk = ensureContrast(brand, canvas, 4.5);
	const p: Palette = {
		canvas, surface, elev: N(n.L[2]), hover: N(n.L[3]), border: N(n.L[4]), 'border-strong': N(n.L[5]),
		text, text2: ensureContrast(N(n.text[1], n.textChroma * 2), canvas, 4.5), muted: ensureContrast(N(n.text[2], n.textChroma * 2), canvas, 4.5),
		brand, 'on-brand': onColor(brand), 'brand-soft': mix(brand, mode === 'dark' ? 0.16 : 0.14), 'brand-ink': brandInk, accent2: brand,
		...STATUS[mode], save: '#FBBF24', 'on-save': '#1A1208',
		scrim: mode === 'dark' ? 'rgba(5,4,10,.62)' : 'rgba(20,20,30,.42)', 'field-bg': mode === 'dark' ? N(n.L[2]) : surface,
		'photo-bg': N(mode === 'dark' ? n.L[2] : n.L[2] - 0.02, n.chroma * 1.5), 'photo-ink': N(n.text[2], n.textChroma * 2),
		wordmark: mode === 'dark' ? brandInk : text, 'deal-bg': brand, 'deal-ink': onColor(brand), 'deal-bg2': mode === 'dark' ? N(n.L[3]) : oklch(0.25, 0.06, bh), 'deal-ink2': mode === 'dark' ? text : '#FFFFFF',
		leader: N(n.L[5]), fur: oklch(0.86, 0.06, bh), hat: '#FFFFFF', mline: oklch(0.22, 0.05, bh), blush: 'rgba(248,113,113,.45)',
		...extra
	};
	p['on-save'] = onColor(p.save);
	p['deal-ink'] = onColor(p['deal-bg']);
	return p;
}

const BARLOW: FontSet = {
	display: "'Barlow Condensed', 'Barlow', system-ui, sans-serif", body: "'Barlow', system-ui, sans-serif", num: "'Barlow Semi Condensed', 'Barlow', system-ui, sans-serif",
	weight: 800, case: 'uppercase', track: '0.01em', preload: [['Barlow Condensed', '800'], ['Barlow', '400']]
};

export const PRESETS: Record<string, Preset> = {
	'pizzeria-loud': {
		id: 'pizzeria-loud', name: 'Pizzeria, loud', desc: 'Quibase dark, condensed signage type, compact menu, loud deals.',
		mode: 'dark', fonts: BARLOW, radius: 'soft', borderW: 1, sampleBrand: '#AC94F4',
		layout: { menu: 'compact', nav: 'top', header: 'glow' },
		palette: (brand) => {
			if (brand.toUpperCase() === '#AC94F4') return QUIBASE_DARK;
			const [, , h] = toOklch(brand);
			return generated('dark', brand, { hue: h, chroma: 0.03, L: [0.16, 0.2, 0.24, 0.28, 0.27, 0.36], text: [0.96, 0.78, 0.64], textChroma: 0.015 });
		}
	},
	'cafe-calm': {
		id: 'cafe-calm', name: 'Café, calm', desc: 'Light, soft serif headings, photo grid, cover header, side navigation.',
		mode: 'light', radius: 'round', borderW: 1, sampleBrand: '#1F5A3F',
		fonts: { display: "'Young Serif', Georgia, serif", body: "'Instrument Sans', system-ui, sans-serif", num: "'Instrument Sans', system-ui, sans-serif", weight: 400, case: 'none', track: '-0.01em', preload: [['Young Serif', '400'], ['Instrument Sans', '400 700']] },
		layout: { menu: 'photo', nav: 'side', header: 'cover' },
		palette: (brand) => {
			const [, , h] = toOklch(brand);
			return generated('light', brand, { hue: h, chroma: 0.012, L: [0.968, 1, 0.94, 0.915, 0.9, 0.78], text: [0.24, 0.4, 0.52], textChroma: 0.02 }, { save: '#F2C94C', 'deal-bg': '#F2C94C', 'deal-bg2': brand, 'deal-ink2': '#FFFFFF', fur: '#EBC79B' });
		}
	},
	'taqueria-bold': {
		id: 'taqueria-bold', name: 'Taquería, bold', desc: 'Deep blue and marigold, heavy display type, classic printed menu, bottom tab bar.',
		mode: 'dark', radius: 'sharp', borderW: 2, sampleBrand: '#FFC233',
		fonts: { display: "'Bowlby One', 'Arial Black', sans-serif", body: "'Rubik', system-ui, sans-serif", num: "'Rubik', system-ui, sans-serif", weight: 400, case: 'uppercase', track: '0.01em', preload: [['Bowlby One', '400'], ['Rubik', '400 800']] },
		layout: { menu: 'printed', nav: 'bottom', header: 'custom' },
		palette: (brand) =>
			generated('dark', brand, { hue: 268, chroma: 0.13, L: [0.28, 0.33, 0.37, 0.41, 0.43, 0.53], text: [0.975, 0.88, 0.76], textChroma: 0.02 }, {
				accent2: '#FF4D8D', save: '#FF4D8D', 'deal-bg': '#FF4D8D', 'deal-bg2': brand, leader: mix(brand, 0.55), fur: '#F5A97F', blush: 'rgba(255,77,141,.55)'
			})
	},
	'classic-paper': {
		id: 'classic-paper', name: 'Classic paper', desc: 'White paper, serif headings, printed menu with dotted leaders. Fits any cuisine.',
		mode: 'light', radius: 'soft', borderW: 1, sampleBrand: '#9B2C2C',
		fonts: { display: "'Young Serif', Georgia, serif", body: "'Instrument Sans', system-ui, sans-serif", num: "'Instrument Sans', system-ui, sans-serif", weight: 400, case: 'none', track: '0', preload: [['Young Serif', '400'], ['Instrument Sans', '400 700']] },
		layout: { menu: 'printed', nav: 'top', header: 'wordmark' },
		palette: (brand) => {
			const [, , h] = toOklch(brand);
			return generated('light', brand, { hue: h, chroma: 0.006, L: [0.985, 1, 0.955, 0.93, 0.9, 0.8], text: [0.2, 0.38, 0.5], textChroma: 0.01 });
		}
	}
};

export const PRESET_IDS = Object.keys(PRESETS);

const RADIUS = { soft: [8, 12, 14, 20, 12], round: [10, 16, 22, 28, 999], sharp: [4, 6, 8, 12, 6] };

export interface Theme {
	preset: Preset;
	palette: Palette;
	css: string;
	fontFaces: string;
	preloads: string[];
	themeColor: string;
	checks: { pair: string; ratio: number; ok: boolean }[];
}

/** Everything the <head> needs: tokens as CSS variables and the font faces of this preset only. */
export function buildTheme(presetId: string, brand: string): Theme {
	const preset = PRESETS[presetId] ?? PRESETS['pizzeria-loud'];
	const palette = preset.palette(brand || preset.sampleBrand);
	const r = RADIUS[preset.radius];
	const vars = Object.entries(palette).map(([k, v]) => `--q-${k}:${v}`);
	vars.push(
		`--q-font-display:${preset.fonts.display}`, `--q-font-body:${preset.fonts.body}`, `--q-font-num:${preset.fonts.num}`,
		`--q-display-weight:${preset.fonts.weight}`, `--q-display-case:${preset.fonts.case}`, `--q-display-track:${preset.fonts.track}`,
		`--q-r-sm:${r[0]}px`, `--q-r-md:${r[1]}px`, `--q-r-lg:${r[2]}px`, `--q-r-xl:${r[3]}px`, `--q-btn-radius:${r[4]}px`, `--q-border-w:${preset.borderW}px`
	);
	const css = `:root{${vars.join(';')};color-scheme:${preset.mode}}`;
	const families = new Set<string>();
	for (const stack of [preset.fonts.display, preset.fonts.body, preset.fonts.num]) {
		const fam = /'([^']+)'/.exec(stack)?.[1];
		if (fam) families.add(fam);
	}
	if (preset.fonts.display.includes('Barlow Condensed')) families.add('Barlow');
	const faces: string[] = [];
	const preloads: string[] = [];
	const table = fonts as Record<string, { weight: string; file: string }[]>;
	for (const fam of families) {
		for (const f of table[fam] ?? []) {
			faces.push(`@font-face{font-family:'${fam}';font-style:normal;font-weight:${f.weight};font-display:swap;src:url(/fonts/${f.file}) format('woff2')}`);
			if (preset.fonts.preload.some(([pf, pw]) => pf === fam && pw === f.weight)) preloads.push(`/fonts/${f.file}`);
		}
	}
	const checks = [
		['text / canvas', palette.text, palette.canvas],
		['text2 / canvas', palette.text2, palette.canvas],
		['muted / canvas', palette.muted, palette.canvas],
		['on-brand / brand', palette['on-brand'], palette.brand],
		['brand-ink / canvas', palette['brand-ink'], palette.canvas],
		['text / surface', palette.text, palette.surface]
	].map(([pair, a, b]) => {
		const ratio = Math.round(contrast(a, b) * 100) / 100;
		return { pair, ratio, ok: ratio >= 4.5 };
	});
	return { preset, palette, css, fontFaces: faces.join(''), preloads, themeColor: palette.canvas, checks };
}
