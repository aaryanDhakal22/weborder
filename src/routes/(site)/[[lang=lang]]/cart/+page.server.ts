export const load = async ({ locals }) => {
	const store = locals.store!;
	const out: { id: string; slug: string; name: string; nameEs?: string; priceCents: number; sizeId?: string; art?: string }[] = [];
	const quick = (groups?: string[]) => !(groups ?? []).some((g) => (store.menu.groups[g]?.min ?? 0) > 0);
	const pref = ['sides', 'side', 'drinks', 'bebidas', 'desserts', 'pastries'];
	const cats = [...store.menu.categories].sort((a, b) => (pref.indexOf(b.id) >= 0 ? 1 : 0) - (pref.indexOf(a.id) >= 0 ? 1 : 0));
	for (const c of cats) for (const i of c.items) if (i.online !== false && quick(i.groups) && (i.popular || pref.includes(c.id)) && out.length < 4 && !store.settings.soldOut.includes(i.id)) {
		const size = i.sizes?.find((s) => s.default) ?? i.sizes?.[0];
		out.push({ id: i.id, slug: i.slug, name: i.name, nameEs: i.nameEs, priceCents: size?.priceCents ?? i.priceCents, sizeId: size?.id, art: i.art });
	}
	return { suggestions: out };
};
