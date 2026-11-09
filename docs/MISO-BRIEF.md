# Miso — illustration brief

This is everything you need to draw **Miso**, the mascot of the quicc ordering websites. It is the
only file you will get, so it includes the character, the colours, every scene, the technical
rules for the SVG files, and a reference drawing of every scene (at the end, as SVG code you can
save and open).

The references were drawn quickly in code to settle the design. They are **correct about
character, colours, layout and pose**, and they are **rough as drawings**. Your job is to draw
them properly: better line quality, better shapes, more life, while keeping the rules below.

---

## 1. Who Miso is

- **What:** a cat chef. Miso is the mascot of *quicc*, the system restaurants use to take
  online orders. Every restaurant's ordering website shows Miso on its order-status, empty and
  error screens, and (if the restaurant wants) on its home page.
- **Name:** Miso.
- **Species:** a domestic cat, cartoon proportions (big head, small body).
- **Coat:** calico-ish: **cream fur with black patches**. One whole ear is black (see §3).
- **Outfit:** a white **chef hat** with a coloured band, and an **apron** with a small
  **cooked-fish logo**. The hat band and the apron take each restaurant's brand colour.
- **Personality:** cheerful, a little clumsy, very cat. Miso behaves like a real cat whenever it
  can: curls up to sleep, sits in boxes, loafs, knocks things off tables, chases its tail.
- **Never:** talks (no speech bubbles, no text in the art), holds a brand logo, looks scary or
  sad for long. Bad news (declined card, page not found) is shown as *oops*, not *distress*.
- **Audience:** people ordering food on their phone. Miso must read instantly at small sizes.

## 2. Style

- **Chunky sticker style:** thick, rounded, even-weight outlines; **flat fills, no gradients**;
  simple shapes; a soft shadow ellipse under the cat.
- **Outline:** colour `#2B1D1A` (warm near-black), weight **5 units on the 200-unit canvas**
  (2.5 % of the width), round joins and round caps everywhere. Small inner details (pleats,
  grill marks, toe lines) use 2–3.5 units.
- **Sticker edge:** on the website we add a light halo (`#FFF8EC`, 4.5 units) around the whole
  silhouette automatically, so Miso reads on dark sites. **Do not draw it**, but keep the
  silhouette clean: no stray hairlines sticking out, no gaps between parts.
- **Thin decorations** (whiskers, speed lines, ringing lines, dotted trails) sit *outside* the
  sticker edge, so draw them on their own group (`fx`, see §6).
- Miso must read on **dark backgrounds** (`#170D0E`, the default site) **and light ones**
  (`#FAFAFF`). Check both.
- Smallest size it appears at: **48 px wide** (loading, the peek over a card). Largest: about
  **320 px**. Check it at 64 px: the face and the black ear must still read.

## 3. The character, part by part

All measurements are in units of the 200-unit-wide reference canvas (§7). Keep the proportions;
refine the shapes.

### Head
- Wide rounded head, about **96 wide × 80 tall** (x 52–148, y 50–130), centred at x 100.
  The head is the biggest part: about 40 % of the sitting cat's total height.
- **Ears:** two upright triangles with rounded tips, tips at about y 34, wide bases.
  - **Viewer's left ear:** cream (`#FBF0DC`) with a pink inner ear (`#F4A3AE`).
  - **Viewer's right ear: entirely black** (`#2A2321`) with a dark mauve inner ear (`#6A4A4F`).
- **The black patch:** starts at the **whole viewer's-right ear** and flows down over the
  **viewer's-right eye**, covering the upper right quarter of the face and fading out on the right
  cheek (it doesn't reach the nose or the mouth). Ear and patch are **one continuous black area**,
  like the ear "spilled" down onto the face. This is the most recognisable feature: keep it
  identical in every scene.
- **Never mirror Miso.** The black ear and patch are always on the **viewer's right** when Miso
  faces us. When Miso is turned or curled, the same physical ear (Miso's own left ear) stays black.
- **Eyes:** two black ovals (about 13 × 17), level, at about y 89, with a small white highlight
  at the top right of each. The eye inside the black patch keeps its white highlight so it
  doesn't disappear.
- **Nose:** a small pink (`#F4A3AE`) rounded triangle with an outline, centred below the eyes.
- **Mouth:** a small "w" under the nose (the cat mouth). Open mouths are dark red (`#A33A46`).
- **Cheeks:** two soft pink ovals (blush), on both cheeks; the one on the black side may be fainter.
- **Whiskers:** two thin lines per side, sticking out past the face (in the `fx` group, §6).

### Chef hat
- A puffy white chef hat (`#FFFDF8`) with three rounded puffs on top and two faint pleat lines,
  sitting between the ears, **tilted slightly to the viewer's left** (about −6°).
- A **band** at the bottom of the hat in the **store colour** (§4).
- In some scenes the hat is askew (−18°) or slipping off; it is never lost entirely.

### Body
- A pear-shaped sitting body under the head (x 60–140, y 118–188): narrower at the
  shoulders, wider at the hips.
- **A black patch on the body:** on the **viewer's left** flank, lower half (a rounded blob, about
  30 × 35).
- **Feet:** two cream ovals at the bottom (sitting), toes facing us.

### Apron
- A trapezoid apron covering the front of the body, from the chest (just under the chin) to the
  feet, in the **store colour** (§4), with a thin neck strap line.
- **The cooked-fish logo** in the middle of the apron: a small fish (about 34 wide) seen from the
  side, head on the viewer's left and tail fin on the right, **cream** (`#FFF4E0`) with an
  outline, a black dot eye, and **two diagonal brown grill marks** (`#C4682F`) across the body.
  It must stay simple enough to read at 64 px (it's fine if it becomes a "little fish shape" at
  that size).

### Arms (front legs)
- **Arms grow out of the sides of the body.** There must be **no seam or outline where the arm
  joins the body**: the arm's outline continues into the body's outline. (This was the main
  problem with an earlier draft: arms that looked stitched on.)
- Thick, round, tube-like arms ending in round **paws** (cream, with two short toe lines).
- At rest the arms hang at the sides; when holding something, the paws hold its edges and sit
  **in front of** the object.

### Tail
- Long, thick, cream tail with a **black tip**, curling up behind Miso on the viewer's right.
- It animates (a slow sway), so draw it as its own group with the pivot at the base (§6).

## 4. Colours

Use **exactly these hex values**. We recolour some of them per restaurant by finding the exact
value in the SVG, so a reserved colour must not be used for anything else.

| Part | Hex | Reserved? | Notes |
|---|---|---|---|
| Outline | `#2B1D1A` | **yes** | all thick outlines |
| Fur (cream) | `#FBF0DC` | **yes** | head, body, arms, tail, feet, left ear |
| Black patches, right ear, tail tip | `#2A2321` | **yes** | |
| **Store colour** (apron, hat band, map pin) | `#E2363B` | **yes** | replaced by each restaurant's brand colour; use it only on the apron, the hat band and the map pin |
| Thin decorations (whiskers, motion lines) | `#2B1D1A` | **yes, in the `fx` group only** | we lighten them on dark sites |
| Hat | `#FFFDF8` | no | |
| Inner left ear, nose, blush | `#F4A3AE` | no | blush at 60–75 % opacity |
| Inner right ear | `#6A4A4F` | no | |
| Open mouth | `#A33A46` | no | |
| Fish logo | `#FFF4E0` | no | grill marks `#C4682F` |
| Shadow under Miso | `#000000` at 18 % opacity | no | an ellipse on the ground |
| Props (paper `#FFFFFF`, box `#D9A066` / `#C78D55`, gold `#FFD166`, dough `#F7D58A`, sauce `#F08A5D`, metal `#9AA3AD`, tyres `#3B3330`, card `#5B7BD5`, declined badge `#E5484D`) | as listed | no | you may adjust props' colours |

**The store colour changes**: Lombardi's is red `#E2363B`; other stores will be green, blue,
lavender, orange… Check the design with the apron in **green `#2E8B57`, blue `#2F6FDE` and
lavender `#AC94F4`** too: the fish logo and the hat band must still read.

## 5. Scenes to draw

19 scenes. **Mandatory** scenes appear on every website (order status, closed, errors).
**Optional** ones are switched on by the restaurant. "Moves" describes the animation we will add in
code, so you know which parts must be separate groups (§6).

### Order tracking (mandatory) — what a customer watches after ordering

| # | File | Moment | Pose and action | Expression | Props | Moves |
|---|---|---|---|---|---|---|
| 1 | `miso-received.svg` | Order received | Sitting, holding a notepad in both paws, pencil in the right paw, writing the ticket | eyes looking down at the pad, small smile | notepad with lines, yellow pencil | the notepad + pencil wiggle (writing) |
| 2 | `miso-cooking.svg` | Accepted / in the kitchen | Sitting up, both arms raised, tossing a pizza dough above the hat | eyes up at the dough, open happy mouth | a pizza dough disc with sauce and two pepperoni | the dough rises and spins; Miso bobs |
| 3 | `miso-ready.svg` | Ready | Sitting, ringing a counter service bell with one paw | happy closed eyes (^ ^), grin | a gold service bell on a little wooden base; "ring" lines | the paw taps; ring lines flash |
| 4 | `miso-out.svg` | Out for delivery | Riding a kick scooter, both paws on the handlebar, a pizza box strapped behind. **A side (profile) view is welcome here** if you can keep the black ear rule | looking ahead, grin | scooter (store-colour deck, grey handlebar, dark wheels), pizza box | bounces; speed lines move |
| 5 | `miso-done.svg` | Delivered / picked up | **Mid-jump**, legs dangling, both arms up | happy closed eyes, grin | 3 gold sparkles around | hops (squash and stretch) |
| 6 | `miso-placed.svg` | The moment right after "Place order" | Mid-jump like #5, arms up | happy, open mouth | confetti pieces | hops; confetti falls |

### Store closed or busy (mandatory)

| # | File | Moment | Pose and action | Expression | Props | Moves |
|---|---|---|---|---|---|---|
| 7 | `miso-closed.svg` | The restaurant is closed | **Curled up asleep like a real cat**: lying in a ring on a closed pizza box, tail wrapped around the front, head resting on its paws, hat slipping | eyes closed, calm | flat pizza box under it; "Z z z" (draw as shapes, not text) | slow breathing; Z's float |
| 8 | `miso-paused.svg` | Online orders paused (kitchen too busy) | **A loaf** (paws tucked under, tail around the front), buried under a pile of order tickets on its back and head, hat askew | worried brows, wobbly mouth, a sweat drop | 4–5 paper tickets, one flying away | wobbles; the flying ticket floats |
| 9 | `miso-loading.svg` | The page is waiting (used small, 48–120 px) | Curled up but **awake**, watching its own tail tip flick | eyes looking at the tail, small "o" mouth | none | the tail flicks fast; gentle bob |

### Empty pages (optional)

| # | File | Moment | Pose and action | Expression | Props | Moves |
|---|---|---|---|---|---|---|
| 10 | `miso-empty-cart.svg` | The cart is empty | **Sitting inside an empty cardboard box**, only the head and two paws over the front edge, tail sticking out of the side | eyes looking down into the box, small "o" mouth, head tilted | an open cardboard box with flaps | peeks up and down |
| 11 | `miso-no-deals.svg` | No deals right now | Sitting, holding up a blank price tag | eyes up (thinking), flat mouth, head tilted | yellow price tag with a hole, blank | the tag sways |
| 12 | `miso-no-orders.svg` | No past orders yet | Sitting, holding a blank receipt | friendly, small smile | a blank paper receipt with a torn bottom | the receipt sways |
| 13 | `miso-wave.svg` | Sign-in page | Sitting, waving with one paw | happy closed eyes, grin | none | the arm waves; bob |

### Something went wrong (mandatory)

| # | File | Moment | Pose and action | Expression | Props | Moves |
|---|---|---|---|---|---|---|
| 14 | `miso-lost.svg` | Page not found | Sitting, holding an open folded map | worried brows, small "o" mouth, head tilted | a folded paper map with a dashed red route; a "?" (as a shape) | the map turns; the "?" floats |
| 15 | `miso-declined.svg` | The card was declined | Sitting on a table, **knocking the bank card off the edge with one paw** (the classic cat move), looking at us | a sly little smile | a table edge, a blue bank card mid-fall, a small red "×" badge | the paw pushes; the card falls |
| 16 | `miso-outside.svg` | The address is outside the delivery area | Sitting, pointing up at a map pin far away | looking up at the pin, flat mouth | a map pin (store colour) high on the right; a dotted trail | the pin floats |

### Home page placements (optional)

| # | File | Moment | Pose and action | Expression | Props | Moves |
|---|---|---|---|---|---|---|
| 17 | `miso-idle.svg` | The neutral Miso (default, About us) | Sitting, arms at the sides | open eyes, small smile | none | blink, tail sway |
| 18 | `miso-peek.svg` | Peeking over the top edge of a card on the home page | **Only the head and two paws**, as if the rest is behind the card; the bottom of the paws sits on the card's top edge (about y 144 in the reference) | curious, small smile | none | moves up and down a little |
| 19 | `miso-side.svg` | Sitting beside a block on the home page | Sitting, glancing to the side (towards the content) | eyes to the side, small smile, slight head tilt | none | blink, tail sway |

Every scene also blinks (the eyes) and sways the tail where the tail is visible.

## 6. SVG technical requirements

Please follow these exactly; the files go straight into the website.

1. **One SVG file per scene**, named as in §5 (`miso-<scene>.svg`), plus your source file
   (Figma, Illustrator or Affinity) with every scene.
2. **Canvas (viewBox):** the same for every full-body scene so they line up and swap without
   jumping: `viewBox="0 -14 200 232"` (200 wide; x 0–200, y −14 to 218). Miso is centred on
   x = 100; **the ground line is y = 198** (feet sit on it; the shadow ellipse is centred on it,
   about 116 × 16). Jumping scenes keep the shadow on the ground (smaller) and lift Miso about
   18 units. The peek scene uses `viewBox="20 0 160 150"`, with the paws' bottom edge at y ≈ 144.
   Props may reach the canvas edges but nothing important should be cut off.
3. **No width/height attributes** (we size it); keep the viewBox. Include
   `xmlns="http://www.w3.org/2000/svg"`.
4. **Flat vector only:** paths, circles, ellipses, rects, lines, groups. **No** raster images, no
   gradients, no filters, no masks, no blend modes, no embedded fonts, **no `<text>`** (convert
   "Z", "?" and similar to paths), no `<style>` blocks, no scripts. `clipPath` is allowed (the
   black patches can be clipped to the head and body shapes, as in the references).
5. **Colours as plain hex** in `fill` / `stroke` attributes (not in CSS classes), and **exactly the
   values in §4** for the reserved colours, so we can recolour them.
6. **Strokes may stay strokes** (preferred, keeps files small); don't outline them unless the shape
   needs it. Round joins and caps.
7. **Named groups**, as `id`s, in this stacking order (back to front). We animate these, so each
   must be a separate `<g>` with its pivot noted (§5 "Moves"):

   | Group id | What | Pivot (for rotation) |
   |---|---|---|
   | `shadow` | the ground shadow | — |
   | `back` | props behind Miso (scooter rear, pizza box bed, table) | — |
   | `tail` | the tail | its base, where it leaves the body |
   | `body` | body, patches, apron, fish logo, feet | — |
   | `arm-left`, `arm-right` | each arm with its paw (viewer's left / right) | the shoulder |
   | `prop` | what Miso holds or uses (notepad, bell, dough, map, card…) | its centre |
   | `head` | head, ears, patch, face, hat | the neck (bottom centre of the head) |
   | `eyes` | both eyes, inside `head` (we squash them for the blink) | the eyes' centre |
   | `fx` | thin decorations: whiskers, speed lines, ring lines, trails, sparkles, Z's, "?" | — |

   Prefix every `id` inside a file with the scene name (e.g. `received-head`,
   `received-clip-body`): several scenes can be on one page and ids must not collide.
8. **Small files:** optimise with SVGO (keep the group ids), aim for **under 15 KB per scene**.
9. **Check each file** in a browser at 64 px and 300 px, on `#170D0E` and `#FAFAFF`.

## 7. Reading the reference drawings

The appendix has one reference SVG per scene, exported from the current draft (so the layout,
proportions and colours are exact). To look at one: copy the code into a file named
`something.svg` and open it in a browser, Figma or Illustrator.

What to keep from the references:
- the canvas, the ground line, the size of Miso on the canvas;
- the character rules (§3), the colours (§4), the poses and props (§5);
- the black right ear flowing into the eye patch, never mirrored.

What to improve:
- line quality and shapes: the references are built from simple geometric parts;
- **arms**: they must flow out of the body with no seam (§3, Arms);
- life and appeal in the poses, especially the cat-like ones (curled, loaf, box, jump, knocking
  the card off);
- the scooter scene can become a side view.

## 8. Deliverables checklist

- [ ] 19 SVG files named as in §5, each following §6
- [ ] the source file with all scenes
- [ ] a one-page sheet (PNG or PDF) with all 19 scenes on a dark and a light background
- [ ] the same sheet with the apron in green `#2E8B57`, blue `#2F6FDE` and lavender `#AC94F4`
- [ ] optional: a turnaround of Miso (front, three-quarter, side) to show how the black ear and
      patch sit from each angle
- [ ] confirmation that the reserved colours (§4) appear only where listed

Questions about the brief go to the quicc team; when something isn't covered here, choose what
makes Miso read better at 64 px.

---

## Appendix: reference SVGs

Exported from the current draft. Each block is a complete SVG file.

### 1. `miso-received.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" id="miso-received" viewBox="0 -14 200 232"><ellipse cx="100" cy="198" rx="58" ry="8" fill="rgba(0,0,0,.18)"/><g><g><g><g>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#2b1d1a" stroke-width="26" stroke-linecap="round"/>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#fbf0dc" stroke-width="16" stroke-linecap="round"/>
	<path d="M170 112 C168 104 171 99 178 96" fill="none" stroke="#2a2321" stroke-width="16" stroke-linecap="round"/></g><g><path d="M66 144 Q74 153 72 162" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><g><path d="M134 144 Q126 153 128 162" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><defs><clipPath id="ms5b"><path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z"/></clipPath></defs>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms5b)"><path d="M54 150 C64 138 80 140 84 156 C88 172 70 180 54 178 Z" fill="#2a2321"/></g>
<path d="M78 132 L122 132 L132 188 L68 188 Z" fill="#e2363b" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/>
<path d="M88 132 C88 124 112 124 112 132" fill="none" stroke="#2b1d1a" stroke-width="3"/>
<g transform="translate(100 162)">
	<path d="M-15 0 C-9 -9 6 -9 10 0 C6 9 -9 9 -15 0 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<path d="M10 0 L19 -7 L19 7 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<circle cx="-9" cy="-1.5" r="1.6" fill="#2b1d1a"/>
	<path d="M-4 -5.5 l3 11 M2.5 -5.5 l3 11" stroke="#c4682f" stroke-width="2.2" stroke-linecap="round"/></g>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<ellipse cx="82" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><ellipse cx="118" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><g><path d="M66 144 Q74 153 72 162" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="72" cy="162" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M68 164 v4 M76 164 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g><path d="M134 144 Q126 153 128 162" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="128" cy="162" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M124 164 v4 M132 164 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g>
	<rect x="78" y="140" width="44" height="40" rx="5" fill="#fff" stroke="#2b1d1a" stroke-width="4"/>
	<path d="M86 152 h28 M86 160 h22 M86 168 h26" stroke="#c9bfb6" stroke-width="3" stroke-linecap="round"/>
	<path d="M128 132 L144 116" stroke="#2b1d1a" stroke-width="9" stroke-linecap="round"/><path d="M128 132 L144 116" stroke="#ffd166" stroke-width="4" stroke-linecap="round"/></g><ellipse cx="72" cy="162" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M68 164 v4 M76 164 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><ellipse cx="128" cy="162" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M124 164 v4 M132 164 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><g>
<path d="M58 72 L52 34 L86 54 Z" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 64 L60 44 L78 55 Z" fill="#f4a3ae"/>
<path d="M142 72 L148 34 L114 54 Z" fill="#2a2321" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M138 64 L140 44 L122 55 Z" fill="#6a4a4f"/>
<defs><clipPath id="ms5h"><path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z"/></clipPath></defs>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms5h)"><path d="M108 40 C140 40 160 60 156 96 C150 104 136 106 128 98 C116 86 104 70 108 40 Z" fill="#2a2321"/></g>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<g><ellipse cx="78" cy="93" rx="6.5" ry="7" fill="#2b1d1a"/><circle cx="80" cy="95" r="2" fill="#fff"/></g><g><ellipse cx="122" cy="93" rx="6.5" ry="7" fill="#2b1d1a"/><circle cx="124" cy="95" r="2" fill="#fff"/></g>
<ellipse cx="66" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".75"/><ellipse cx="134" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".6"/>
<path d="M95 98 Q100 95 105 98 Q102 103 100 103 Q98 103 95 98 Z" fill="#f4a3ae" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M92 104 Q96 109 100 104 Q104 109 108 104" fill="none" stroke="#2b1d1a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
<g transform="rotate(-6 100 40)">
	<path d="M70 42 C58 38 58 18 74 18 C74 4 96 0 102 12 C110 0 132 6 128 22 C142 22 142 40 130 42 Z" fill="#fffdf8" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M90 16 C92 24 92 32 90 40 M110 16 C108 24 108 32 110 40" fill="none" stroke="#2b1d1a" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
	<rect x="68" y="38" width="64" height="12" rx="5" fill="#e2363b" stroke="#2b1d1a" stroke-width="4"/>
</g>
</g></g><g><path d="M58 100 L40 96 M58 106 L40 108 M142 100 L160 96 M142 106 L160 108" stroke="#2b1d1a" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></g></g></g></svg>
```

### 2. `miso-cooking.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" id="miso-cooking" viewBox="0 -14 200 232"><ellipse cx="100" cy="198" rx="58" ry="8" fill="rgba(0,0,0,.18)"/><g><g><g><g>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#2b1d1a" stroke-width="26" stroke-linecap="round"/>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#fbf0dc" stroke-width="16" stroke-linecap="round"/>
	<path d="M170 112 C168 104 171 99 178 96" fill="none" stroke="#2a2321" stroke-width="16" stroke-linecap="round"/></g><g><path d="M68 140 Q53 120 48 100" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><g><path d="M132 140 Q147 120 152 100" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><defs><clipPath id="ms6b"><path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z"/></clipPath></defs>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms6b)"><path d="M54 150 C64 138 80 140 84 156 C88 172 70 180 54 178 Z" fill="#2a2321"/></g>
<path d="M78 132 L122 132 L132 188 L68 188 Z" fill="#e2363b" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/>
<path d="M88 132 C88 124 112 124 112 132" fill="none" stroke="#2b1d1a" stroke-width="3"/>
<g transform="translate(100 162)">
	<path d="M-15 0 C-9 -9 6 -9 10 0 C6 9 -9 9 -15 0 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<path d="M10 0 L19 -7 L19 7 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<circle cx="-9" cy="-1.5" r="1.6" fill="#2b1d1a"/>
	<path d="M-4 -5.5 l3 11 M2.5 -5.5 l3 11" stroke="#c4682f" stroke-width="2.2" stroke-linecap="round"/></g>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<ellipse cx="82" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><ellipse cx="118" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><g><path d="M68 140 Q53 120 48 100" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="48" cy="100" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M44 102 v4 M52 102 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g><path d="M132 140 Q147 120 152 100" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="152" cy="100" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M148 102 v4 M156 102 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g>
<path d="M58 72 L52 34 L86 54 Z" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 64 L60 44 L78 55 Z" fill="#f4a3ae"/>
<path d="M142 72 L148 34 L114 54 Z" fill="#2a2321" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M138 64 L140 44 L122 55 Z" fill="#6a4a4f"/>
<defs><clipPath id="ms6h"><path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z"/></clipPath></defs>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms6h)"><path d="M108 40 C140 40 160 60 156 96 C150 104 136 106 128 98 C116 86 104 70 108 40 Z" fill="#2a2321"/></g>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<g><ellipse cx="78" cy="86" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="80" cy="82" r="2.3" fill="#fff"/></g><g><ellipse cx="122" cy="86" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="124" cy="82" r="2.3" fill="#fff"/></g>
<ellipse cx="66" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".75"/><ellipse cx="134" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".6"/>
<path d="M95 98 Q100 95 105 98 Q102 103 100 103 Q98 103 95 98 Z" fill="#f4a3ae" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M92 106 Q100 120 108 106 Z" fill="#a33a46" stroke="#2b1d1a" stroke-width="3.5" stroke-linejoin="round"/>
<g transform="rotate(-6 100 40)">
	<path d="M70 42 C58 38 58 18 74 18 C74 4 96 0 102 12 C110 0 132 6 128 22 C142 22 142 40 130 42 Z" fill="#fffdf8" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M90 16 C92 24 92 32 90 40 M110 16 C108 24 108 32 110 40" fill="none" stroke="#2b1d1a" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
	<rect x="68" y="38" width="64" height="12" rx="5" fill="#e2363b" stroke="#2b1d1a" stroke-width="4"/>
</g>
</g><g><ellipse cx="100" cy="8" rx="38" ry="10" fill="#f7d58a" stroke="#2b1d1a" stroke-width="5"/>
	<ellipse cx="100" cy="6" rx="26" ry="5" fill="#f08a5d" opacity=".8"/><circle cx="88" cy="6" r="3" fill="#e2363b"/><circle cx="108" cy="5" r="3" fill="#e2363b"/></g></g><g><path d="M58 100 L40 96 M58 106 L40 108 M142 100 L160 96 M142 106 L160 108" stroke="#2b1d1a" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></g></g></g></svg>
```

### 3. `miso-ready.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" id="miso-ready" viewBox="0 -14 200 232"><ellipse cx="100" cy="198" rx="58" ry="8" fill="rgba(0,0,0,.18)"/><g><g><g><g>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#2b1d1a" stroke-width="26" stroke-linecap="round"/>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#fbf0dc" stroke-width="16" stroke-linecap="round"/>
	<path d="M170 112 C168 104 171 99 178 96" fill="none" stroke="#2a2321" stroke-width="16" stroke-linecap="round"/></g><g><path d="M68 142 Q60 158 62 174" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><g><path d="M132 140 Q149 141 156 142" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><defs><clipPath id="ms7b"><path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z"/></clipPath></defs>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms7b)"><path d="M54 150 C64 138 80 140 84 156 C88 172 70 180 54 178 Z" fill="#2a2321"/></g>
<path d="M78 132 L122 132 L132 188 L68 188 Z" fill="#e2363b" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/>
<path d="M88 132 C88 124 112 124 112 132" fill="none" stroke="#2b1d1a" stroke-width="3"/>
<g transform="translate(100 162)">
	<path d="M-15 0 C-9 -9 6 -9 10 0 C6 9 -9 9 -15 0 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<path d="M10 0 L19 -7 L19 7 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<circle cx="-9" cy="-1.5" r="1.6" fill="#2b1d1a"/>
	<path d="M-4 -5.5 l3 11 M2.5 -5.5 l3 11" stroke="#c4682f" stroke-width="2.2" stroke-linecap="round"/></g>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<ellipse cx="82" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><ellipse cx="118" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><g><rect x="122" y="182" width="66" height="10" rx="4" fill="#c9a26b" stroke="#2b1d1a" stroke-width="4"/>
	<path d="M130 182 C130 150 180 150 180 182 Z" fill="#ffd166" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M140 172 C142 162 150 158 156 158" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>
	<rect x="150" y="140" width="10" height="11" rx="3" fill="#ffd166" stroke="#2b1d1a" stroke-width="3.5"/></g><g><path d="M68 142 Q60 158 62 174" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="62" cy="174" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M58 176 v4 M66 176 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g><path d="M132 140 Q149 141 156 142" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="156" cy="142" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M152 144 v4 M160 144 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g>
<path d="M58 72 L52 34 L86 54 Z" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 64 L60 44 L78 55 Z" fill="#f4a3ae"/>
<path d="M142 72 L148 34 L114 54 Z" fill="#2a2321" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M138 64 L140 44 L122 55 Z" fill="#6a4a4f"/>
<defs><clipPath id="ms7h"><path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z"/></clipPath></defs>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms7h)"><path d="M108 40 C140 40 160 60 156 96 C150 104 136 106 128 98 C116 86 104 70 108 40 Z" fill="#2a2321"/></g>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M70 92 Q78 82 86 92" fill="none" stroke="#2b1d1a" stroke-width="4.5" stroke-linecap="round"/><path d="M114 92 Q122 82 130 92" fill="none" stroke="#2b1d1a" stroke-width="4.5" stroke-linecap="round"/>
<ellipse cx="66" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".75"/><ellipse cx="134" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".6"/>
<path d="M95 98 Q100 95 105 98 Q102 103 100 103 Q98 103 95 98 Z" fill="#f4a3ae" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M88 105 Q100 118 112 105" fill="#a33a46" stroke="#2b1d1a" stroke-width="3.5" stroke-linejoin="round"/>
<g transform="rotate(-6 100 40)">
	<path d="M70 42 C58 38 58 18 74 18 C74 4 96 0 102 12 C110 0 132 6 128 22 C142 22 142 40 130 42 Z" fill="#fffdf8" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M90 16 C92 24 92 32 90 40 M110 16 C108 24 108 32 110 40" fill="none" stroke="#2b1d1a" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
	<rect x="68" y="38" width="64" height="12" rx="5" fill="#e2363b" stroke="#2b1d1a" stroke-width="4"/>
</g>
</g></g><g><path d="M58 100 L40 96 M58 106 L40 108 M142 100 L160 96 M142 106 L160 108" stroke="#2b1d1a" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></g><g><path d="M186 146 l9 -7 M190 162 l12 0 M126 146 l-9 -7" stroke="#2b1d1a" stroke-width="4" stroke-linecap="round"/></g></g></g></svg>
```

### 4. `miso-out.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" id="miso-out" viewBox="0 -14 200 232"><g><g><g><rect x="150" y="122" width="34" height="30" rx="4" fill="#d9a066" stroke="#2b1d1a" stroke-width="4" transform="rotate(8 167 137)"/><g>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#2b1d1a" stroke-width="26" stroke-linecap="round"/>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#fbf0dc" stroke-width="16" stroke-linecap="round"/>
	<path d="M170 112 C168 104 171 99 178 96" fill="none" stroke="#2a2321" stroke-width="16" stroke-linecap="round"/></g><g><path d="M68 142 Q61 147 64 152" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><g><path d="M132 142 Q139 147 136 152" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><defs><clipPath id="ms8b"><path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z"/></clipPath></defs>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms8b)"><path d="M54 150 C64 138 80 140 84 156 C88 172 70 180 54 178 Z" fill="#2a2321"/></g>
<path d="M78 132 L122 132 L132 188 L68 188 Z" fill="#e2363b" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/>
<path d="M88 132 C88 124 112 124 112 132" fill="none" stroke="#2b1d1a" stroke-width="3"/>
<g transform="translate(100 162)">
	<path d="M-15 0 C-9 -9 6 -9 10 0 C6 9 -9 9 -15 0 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<path d="M10 0 L19 -7 L19 7 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<circle cx="-9" cy="-1.5" r="1.6" fill="#2b1d1a"/>
	<path d="M-4 -5.5 l3 11 M2.5 -5.5 l3 11" stroke="#c4682f" stroke-width="2.2" stroke-linecap="round"/></g>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<ellipse cx="82" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><ellipse cx="118" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M100 196 L100 150" stroke="#2b1d1a" stroke-width="11" stroke-linecap="round"/><path d="M100 196 L100 150" stroke="#9aa3ad" stroke-width="4" stroke-linecap="round"/>
	<path d="M60 150 H140" stroke="#2b1d1a" stroke-width="11" stroke-linecap="round"/><path d="M60 150 H140" stroke="#9aa3ad" stroke-width="4" stroke-linecap="round"/>
	<path d="M34 198 H166" stroke="#2b1d1a" stroke-width="13" stroke-linecap="round"/><path d="M34 198 H166" stroke="#e2363b" stroke-width="6" stroke-linecap="round"/>
	<circle cx="40" cy="208" r="11" fill="#3b3330" stroke="#2b1d1a" stroke-width="5"/><circle cx="40" cy="208" r="4" fill="#c9bfb6"/>
	<circle cx="160" cy="208" r="11" fill="#3b3330" stroke="#2b1d1a" stroke-width="5"/><circle cx="160" cy="208" r="4" fill="#c9bfb6"/><g><path d="M68 142 Q61 147 64 152" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="64" cy="152" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M60 154 v4 M68 154 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g><path d="M132 142 Q139 147 136 152" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="136" cy="152" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M132 154 v4 M140 154 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g>
<path d="M58 72 L52 34 L86 54 Z" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 64 L60 44 L78 55 Z" fill="#f4a3ae"/>
<path d="M142 72 L148 34 L114 54 Z" fill="#2a2321" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M138 64 L140 44 L122 55 Z" fill="#6a4a4f"/>
<defs><clipPath id="ms8h"><path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z"/></clipPath></defs>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms8h)"><path d="M108 40 C140 40 160 60 156 96 C150 104 136 106 128 98 C116 86 104 70 108 40 Z" fill="#2a2321"/></g>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<g><ellipse cx="81" cy="89" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="84" cy="86" r="2.3" fill="#fff"/></g><g><ellipse cx="125" cy="89" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="128" cy="86" r="2.3" fill="#fff"/></g>
<ellipse cx="66" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".75"/><ellipse cx="134" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".6"/>
<path d="M95 98 Q100 95 105 98 Q102 103 100 103 Q98 103 95 98 Z" fill="#f4a3ae" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M88 105 Q100 118 112 105" fill="#a33a46" stroke="#2b1d1a" stroke-width="3.5" stroke-linejoin="round"/>
<g transform="rotate(-6 100 40)">
	<path d="M70 42 C58 38 58 18 74 18 C74 4 96 0 102 12 C110 0 132 6 128 22 C142 22 142 40 130 42 Z" fill="#fffdf8" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M90 16 C92 24 92 32 90 40 M110 16 C108 24 108 32 110 40" fill="none" stroke="#2b1d1a" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
	<rect x="68" y="38" width="64" height="12" rx="5" fill="#e2363b" stroke="#2b1d1a" stroke-width="4"/>
</g>
</g></g><g><path d="M58 100 L40 96 M58 106 L40 108 M142 100 L160 96 M142 106 L160 108" stroke="#2b1d1a" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></g><g><path d="M2 150 h24 M-6 168 h26 M8 132 h18" stroke="#2b1d1a" stroke-width="4.5" stroke-linecap="round" opacity=".5"/></g></g></g></svg>
```

### 5. `miso-done.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" id="miso-done" viewBox="0 -14 200 232"><ellipse cx="100" cy="198" rx="40" ry="6" fill="rgba(0,0,0,.14)"/><g><g transform="translate(0 -18)"><g><g>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#2b1d1a" stroke-width="26" stroke-linecap="round"/>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#fbf0dc" stroke-width="16" stroke-linecap="round"/>
	<path d="M170 112 C168 104 171 99 178 96" fill="none" stroke="#2a2321" stroke-width="16" stroke-linecap="round"/></g><g><path d="M68 140 Q53 120 48 100" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><g><path d="M132 140 Q147 120 152 100" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><defs><clipPath id="ms9b"><path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z"/></clipPath></defs>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms9b)"><path d="M54 150 C64 138 80 140 84 156 C88 172 70 180 54 178 Z" fill="#2a2321"/></g>
<path d="M78 132 L122 132 L132 188 L68 188 Z" fill="#e2363b" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/>
<path d="M88 132 C88 124 112 124 112 132" fill="none" stroke="#2b1d1a" stroke-width="3"/>
<g transform="translate(100 162)">
	<path d="M-15 0 C-9 -9 6 -9 10 0 C6 9 -9 9 -15 0 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<path d="M10 0 L19 -7 L19 7 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<circle cx="-9" cy="-1.5" r="1.6" fill="#2b1d1a"/>
	<path d="M-4 -5.5 l3 11 M2.5 -5.5 l3 11" stroke="#c4682f" stroke-width="2.2" stroke-linecap="round"/></g>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M84 184 L80 210 M116 184 L120 210" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/><path d="M84 180 L80 210 M116 180 L120 210" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="80" cy="212" rx="10" ry="8.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M76 214 v4 M84 214 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><ellipse cx="120" cy="212" rx="10" ry="8.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M116 214 v4 M124 214 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><g><path d="M68 140 Q53 120 48 100" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="48" cy="100" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M44 102 v4 M52 102 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g><path d="M132 140 Q147 120 152 100" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="152" cy="100" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M148 102 v4 M156 102 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g>
<path d="M58 72 L52 34 L86 54 Z" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 64 L60 44 L78 55 Z" fill="#f4a3ae"/>
<path d="M142 72 L148 34 L114 54 Z" fill="#2a2321" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M138 64 L140 44 L122 55 Z" fill="#6a4a4f"/>
<defs><clipPath id="ms9h"><path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z"/></clipPath></defs>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms9h)"><path d="M108 40 C140 40 160 60 156 96 C150 104 136 106 128 98 C116 86 104 70 108 40 Z" fill="#2a2321"/></g>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M70 92 Q78 82 86 92" fill="none" stroke="#2b1d1a" stroke-width="4.5" stroke-linecap="round"/><path d="M114 92 Q122 82 130 92" fill="none" stroke="#2b1d1a" stroke-width="4.5" stroke-linecap="round"/>
<ellipse cx="66" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".75"/><ellipse cx="134" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".6"/>
<path d="M95 98 Q100 95 105 98 Q102 103 100 103 Q98 103 95 98 Z" fill="#f4a3ae" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M88 105 Q100 118 112 105" fill="#a33a46" stroke="#2b1d1a" stroke-width="3.5" stroke-linejoin="round"/>
<g transform="rotate(-6 100 40)">
	<path d="M70 42 C58 38 58 18 74 18 C74 4 96 0 102 12 C110 0 132 6 128 22 C142 22 142 40 130 42 Z" fill="#fffdf8" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M90 16 C92 24 92 32 90 40 M110 16 C108 24 108 32 110 40" fill="none" stroke="#2b1d1a" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
	<rect x="68" y="38" width="64" height="12" rx="5" fill="#e2363b" stroke="#2b1d1a" stroke-width="4"/>
</g>
</g><path d="M28 45 L30.5 51.5 L37 54 L30.5 56.5 L28 63 L25.5 56.5 L19 54 L25.5 51.5 Z" fill="#ffd166" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/><path d="M172 52.8 L174 58 L179.2 60 L174 62 L172 67.2 L170 62 L164.8 60 L170 58 Z" fill="#ffd166" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/><path d="M160 16.6 L161.5 20.5 L165.4 22 L161.5 23.5 L160 27.4 L158.5 23.5 L154.6 22 L158.5 20.5 Z" fill="#ffd166" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/></g><g><path d="M58 100 L40 96 M58 106 L40 108 M142 100 L160 96 M142 106 L160 108" stroke="#2b1d1a" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></g></g></g></svg>
```

### 6. `miso-placed.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" id="miso-placed" viewBox="0 -14 200 232"><ellipse cx="100" cy="198" rx="40" ry="6" fill="rgba(0,0,0,.14)"/><g><g transform="translate(0 -18)"><g><g>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#2b1d1a" stroke-width="26" stroke-linecap="round"/>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#fbf0dc" stroke-width="16" stroke-linecap="round"/>
	<path d="M170 112 C168 104 171 99 178 96" fill="none" stroke="#2a2321" stroke-width="16" stroke-linecap="round"/></g><g><path d="M68 140 Q53 120 48 100" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><g><path d="M132 140 Q147 120 152 100" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><defs><clipPath id="ms10b"><path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z"/></clipPath></defs>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms10b)"><path d="M54 150 C64 138 80 140 84 156 C88 172 70 180 54 178 Z" fill="#2a2321"/></g>
<path d="M78 132 L122 132 L132 188 L68 188 Z" fill="#e2363b" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/>
<path d="M88 132 C88 124 112 124 112 132" fill="none" stroke="#2b1d1a" stroke-width="3"/>
<g transform="translate(100 162)">
	<path d="M-15 0 C-9 -9 6 -9 10 0 C6 9 -9 9 -15 0 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<path d="M10 0 L19 -7 L19 7 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<circle cx="-9" cy="-1.5" r="1.6" fill="#2b1d1a"/>
	<path d="M-4 -5.5 l3 11 M2.5 -5.5 l3 11" stroke="#c4682f" stroke-width="2.2" stroke-linecap="round"/></g>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M84 184 L80 210 M116 184 L120 210" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/><path d="M84 180 L80 210 M116 180 L120 210" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="80" cy="212" rx="10" ry="8.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M76 214 v4 M84 214 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><ellipse cx="120" cy="212" rx="10" ry="8.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M116 214 v4 M124 214 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><g><path d="M68 140 Q53 120 48 100" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="48" cy="100" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M44 102 v4 M52 102 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g><path d="M132 140 Q147 120 152 100" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="152" cy="100" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M148 102 v4 M156 102 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g>
<path d="M58 72 L52 34 L86 54 Z" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 64 L60 44 L78 55 Z" fill="#f4a3ae"/>
<path d="M142 72 L148 34 L114 54 Z" fill="#2a2321" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M138 64 L140 44 L122 55 Z" fill="#6a4a4f"/>
<defs><clipPath id="ms10h"><path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z"/></clipPath></defs>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms10h)"><path d="M108 40 C140 40 160 60 156 96 C150 104 136 106 128 98 C116 86 104 70 108 40 Z" fill="#2a2321"/></g>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M70 92 Q78 82 86 92" fill="none" stroke="#2b1d1a" stroke-width="4.5" stroke-linecap="round"/><path d="M114 92 Q122 82 130 92" fill="none" stroke="#2b1d1a" stroke-width="4.5" stroke-linecap="round"/>
<ellipse cx="66" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".75"/><ellipse cx="134" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".6"/>
<path d="M95 98 Q100 95 105 98 Q102 103 100 103 Q98 103 95 98 Z" fill="#f4a3ae" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M92 106 Q100 120 108 106 Z" fill="#a33a46" stroke="#2b1d1a" stroke-width="3.5" stroke-linejoin="round"/>
<g transform="rotate(-6 100 40)">
	<path d="M70 42 C58 38 58 18 74 18 C74 4 96 0 102 12 C110 0 132 6 128 22 C142 22 142 40 130 42 Z" fill="#fffdf8" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M90 16 C92 24 92 32 90 40 M110 16 C108 24 108 32 110 40" fill="none" stroke="#2b1d1a" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
	<rect x="68" y="38" width="64" height="12" rx="5" fill="#e2363b" stroke="#2b1d1a" stroke-width="4"/>
</g>
</g><g><rect x="20" y="40" width="10" height="5" rx="1.5" fill="#ffd166" stroke="#2b1d1a" stroke-width="2" transform="rotate(20 20 40)"/><rect x="176" y="30" width="10" height="5" rx="1.5" fill="#5bd1a3" stroke="#2b1d1a" stroke-width="2" transform="rotate(-25 176 30)"/><rect x="36" y="90" width="10" height="5" rx="1.5" fill="#8fb8ff" stroke="#2b1d1a" stroke-width="2" transform="rotate(40 36 90)"/><rect x="168" y="92" width="10" height="5" rx="1.5" fill="#ff8fa3" stroke="#2b1d1a" stroke-width="2" transform="rotate(-10 168 92)"/><rect x="100" y="4" width="10" height="5" rx="1.5" fill="#ffd166" stroke="#2b1d1a" stroke-width="2" transform="rotate(70 100 4)"/><rect x="60" y="16" width="10" height="5" rx="1.5" fill="#ff8fa3" stroke="#2b1d1a" stroke-width="2" transform="rotate(15 60 16)"/><rect x="146" y="8" width="10" height="5" rx="1.5" fill="#8fb8ff" stroke="#2b1d1a" stroke-width="2" transform="rotate(50 146 8)"/></g></g><g><path d="M58 100 L40 96 M58 106 L40 108 M142 100 L160 96 M142 106 L160 108" stroke="#2b1d1a" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></g></g></g></svg>
```

### 7. `miso-closed.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" id="miso-closed" viewBox="0 -14 200 232"><g><g><g><g><path d="M14 216 L26 196 L180 196 L192 216 Z" fill="#d9a066" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/><path d="M40 206 h126" stroke="#2b1d1a" stroke-width="3" opacity=".3"/></g><defs><clipPath id="ms11c"><path d="M40 182 C36 150 70 136 114 138 C160 140 184 156 182 178 C180 198 150 204 110 204 C70 204 42 200 40 182 Z"/></clipPath></defs><path d="M40 182 C36 150 70 136 114 138 C160 140 184 156 182 178 C180 198 150 204 110 204 C70 204 42 200 40 182 Z" fill="#fbf0dc"/><g clip-path="url(#ms11c)"><path d="M110 132 C140 128 170 140 176 160 C160 170 132 166 116 156 C104 148 100 138 110 132 Z" fill="#2a2321"/></g><path d="M40 182 C36 150 70 136 114 138 C160 140 184 156 182 178 C180 198 150 204 110 204 C70 204 42 200 40 182 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/><g>
	<path d="M176 182 C190 206 132 214 92 208 C70 205 52 200 46 192" fill="none" stroke="#2b1d1a" stroke-width="26" stroke-linecap="round"/>
	<path d="M176 182 C190 206 132 214 92 208 C70 205 52 200 46 192" fill="none" stroke="#fbf0dc" stroke-width="16" stroke-linecap="round"/>
	<path d="M60 202 C54 200 49 196 46 192" fill="none" stroke="#2a2321" stroke-width="16" stroke-linecap="round"/></g><ellipse cx="54" cy="190" rx="10" ry="8.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M50 192 v4 M58 192 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><ellipse cx="76" cy="194" rx="10" ry="8.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M72 196 v4 M80 196 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><g transform="translate(70 158) scale(0.74) rotate(-16) translate(-100 -92)"><g>
<path d="M58 72 L52 34 L86 54 Z" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 64 L60 44 L78 55 Z" fill="#f4a3ae"/>
<path d="M142 72 L148 34 L114 54 Z" fill="#2a2321" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M138 64 L140 44 L122 55 Z" fill="#6a4a4f"/>
<defs><clipPath id="ms11h"><path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z"/></clipPath></defs>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms11h)"><path d="M108 40 C140 40 160 60 156 96 C150 104 136 106 128 98 C116 86 104 70 108 40 Z" fill="#2a2321"/></g>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M70 88 Q78 95 86 88" fill="none" stroke="#2b1d1a" stroke-width="4.5" stroke-linecap="round"/><path d="M114 88 Q122 95 130 88" fill="none" stroke="#2b1d1a" stroke-width="4.5" stroke-linecap="round"/>
<ellipse cx="66" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".75"/><ellipse cx="134" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".6"/>
<path d="M95 98 Q100 95 105 98 Q102 103 100 103 Q98 103 95 98 Z" fill="#f4a3ae" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M93 108 L107 108" stroke="#2b1d1a" stroke-width="3.5" stroke-linecap="round"/>
<g transform="rotate(-18 100 40)">
	<path d="M70 42 C58 38 58 18 74 18 C74 4 96 0 102 12 C110 0 132 6 128 22 C142 22 142 40 130 42 Z" fill="#fffdf8" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M90 16 C92 24 92 32 90 40 M110 16 C108 24 108 32 110 40" fill="none" stroke="#2b1d1a" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
	<rect x="68" y="38" width="64" height="12" rx="5" fill="#e2363b" stroke="#2b1d1a" stroke-width="4"/>
</g>
</g></g><g fill="#2b1d1a" font-family="system-ui,sans-serif" font-weight="900"><text x="150" y="60" font-size="20">z</text><text x="164" y="40" font-size="26">z</text><text x="180" y="18" font-size="32">Z</text></g></g></g></g></svg>
```

### 8. `miso-paused.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" id="miso-paused" viewBox="0 -14 200 232"><ellipse cx="100" cy="198" rx="58" ry="8" fill="rgba(0,0,0,.18)"/><g><g><g><defs><clipPath id="ms12l"><path d="M42 198 C38 158 64 140 100 140 C136 140 162 158 158 198 Z"/></clipPath></defs><path d="M42 198 C38 158 64 140 100 140 C136 140 162 158 158 198 Z" fill="#fbf0dc"/><g clip-path="url(#ms12l)"><path d="M120 140 C150 140 166 160 162 184 C146 184 130 170 124 158 C120 150 116 144 120 140 Z" fill="#2a2321"/></g><path d="M70 150 L130 150 L136 198 L64 198 Z" fill="#e2363b" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/><g transform="translate(0 14)"><g transform="translate(100 162)">
	<path d="M-15 0 C-9 -9 6 -9 10 0 C6 9 -9 9 -15 0 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<path d="M10 0 L19 -7 L19 7 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<circle cx="-9" cy="-1.5" r="1.6" fill="#2b1d1a"/>
	<path d="M-4 -5.5 l3 11 M2.5 -5.5 l3 11" stroke="#c4682f" stroke-width="2.2" stroke-linecap="round"/></g></g><path d="M42 198 C38 158 64 140 100 140 C136 140 162 158 158 198 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/><g>
	<path d="M156 192 C170 206 130 212 110 208" fill="none" stroke="#2b1d1a" stroke-width="26" stroke-linecap="round"/>
	<path d="M156 192 C170 206 130 212 110 208" fill="none" stroke="#fbf0dc" stroke-width="16" stroke-linecap="round"/>
	<path d="M120 210 C116 210 113 209 110 208" fill="none" stroke="#2a2321" stroke-width="16" stroke-linecap="round"/></g><ellipse cx="82" cy="200" rx="10" ry="8.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M78 202 v4 M86 202 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><ellipse cx="118" cy="200" rx="10" ry="8.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M114 202 v4 M122 202 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><g transform="translate(100 108) scale(0.96) rotate(0) translate(-100 -92)"><g>
<path d="M58 72 L52 34 L86 54 Z" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 64 L60 44 L78 55 Z" fill="#f4a3ae"/>
<path d="M142 72 L148 34 L114 54 Z" fill="#2a2321" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M138 64 L140 44 L122 55 Z" fill="#6a4a4f"/>
<defs><clipPath id="ms12h"><path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z"/></clipPath></defs>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms12h)"><path d="M108 40 C140 40 160 60 156 96 C150 104 136 106 128 98 C116 86 104 70 108 40 Z" fill="#2a2321"/></g>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<g><ellipse cx="78" cy="90" rx="6.5" ry="8" fill="#2b1d1a"/><circle cx="80" cy="87" r="2.2" fill="#fff"/></g><g><ellipse cx="122" cy="90" rx="6.5" ry="8" fill="#2b1d1a"/><circle cx="124" cy="87" r="2.2" fill="#fff"/></g><path d="M68 74 L86 79 M132 74 L114 79" stroke="#2b1d1a" stroke-width="4" stroke-linecap="round"/>
<ellipse cx="66" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".75"/><ellipse cx="134" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".6"/>
<path d="M95 98 Q100 95 105 98 Q102 103 100 103 Q98 103 95 98 Z" fill="#f4a3ae" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M90 109 q3 -4 6 0 t6 0 t6 0" fill="none" stroke="#2b1d1a" stroke-width="3.5" stroke-linecap="round"/>
<g transform="rotate(-18 100 40)">
	<path d="M70 42 C58 38 58 18 74 18 C74 4 96 0 102 12 C110 0 132 6 128 22 C142 22 142 40 130 42 Z" fill="#fffdf8" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M90 16 C92 24 92 32 90 40 M110 16 C108 24 108 32 110 40" fill="none" stroke="#2b1d1a" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
	<rect x="68" y="38" width="64" height="12" rx="5" fill="#e2363b" stroke="#2b1d1a" stroke-width="4"/>
</g>
</g></g><g>
	<rect x="112" y="140" width="50" height="16" rx="3" fill="#fff" stroke="#2b1d1a" stroke-width="4" transform="rotate(14 137 148)"/>
	<rect x="118" y="126" width="48" height="16" rx="3" fill="#fff" stroke="#2b1d1a" stroke-width="4" transform="rotate(-6 142 134)"/>
	<rect x="70" y="40" width="46" height="15" rx="3" fill="#fff" stroke="#2b1d1a" stroke-width="4" transform="rotate(-12 93 47)"/>
	<path d="M80 46 h22 M124 132 h28" stroke="#c9bfb6" stroke-width="2.5" stroke-linecap="round"/></g>
	<g><rect x="152" y="62" width="34" height="13" rx="3" fill="#fff" stroke="#2b1d1a" stroke-width="3.5" transform="rotate(22 169 68)"/></g>
	<path d="M150 98 q6 10 0 14 q-6 -4 0 -14 Z" fill="#8fd3ff" stroke="#2b1d1a" stroke-width="2.5"/></g><g transform="translate(100 108) scale(.96) translate(-100 -92)"><g><path d="M58 100 L40 96 M58 106 L40 108 M142 100 L160 96 M142 106 L160 108" stroke="#2b1d1a" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></g></g></g></g></svg>
```

### 9. `miso-loading.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" id="miso-loading" viewBox="0 -14 200 232"><g><g><g><defs><clipPath id="ms13c"><path d="M40 182 C36 150 70 136 114 138 C160 140 184 156 182 178 C180 198 150 204 110 204 C70 204 42 200 40 182 Z"/></clipPath></defs><path d="M40 182 C36 150 70 136 114 138 C160 140 184 156 182 178 C180 198 150 204 110 204 C70 204 42 200 40 182 Z" fill="#fbf0dc"/><g clip-path="url(#ms13c)"><path d="M110 132 C140 128 170 140 176 160 C160 170 132 166 116 156 C104 148 100 138 110 132 Z" fill="#2a2321"/></g><path d="M40 182 C36 150 70 136 114 138 C160 140 184 156 182 178 C180 198 150 204 110 204 C70 204 42 200 40 182 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/><g>
	<path d="M176 182 C190 206 132 214 92 208 C70 205 52 200 46 192" fill="none" stroke="#2b1d1a" stroke-width="26" stroke-linecap="round"/>
	<path d="M176 182 C190 206 132 214 92 208 C70 205 52 200 46 192" fill="none" stroke="#fbf0dc" stroke-width="16" stroke-linecap="round"/>
	<path d="M60 202 C54 200 49 196 46 192" fill="none" stroke="#2a2321" stroke-width="16" stroke-linecap="round"/></g><ellipse cx="54" cy="190" rx="10" ry="8.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M50 192 v4 M58 192 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><ellipse cx="76" cy="194" rx="10" ry="8.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M72 196 v4 M80 196 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><g transform="translate(70 158) scale(0.74) rotate(-16) translate(-100 -92)"><g>
<path d="M58 72 L52 34 L86 54 Z" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 64 L60 44 L78 55 Z" fill="#f4a3ae"/>
<path d="M142 72 L148 34 L114 54 Z" fill="#2a2321" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M138 64 L140 44 L122 55 Z" fill="#6a4a4f"/>
<defs><clipPath id="ms13h"><path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z"/></clipPath></defs>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms13h)"><path d="M108 40 C140 40 160 60 156 96 C150 104 136 106 128 98 C116 86 104 70 108 40 Z" fill="#2a2321"/></g>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<g><ellipse cx="81" cy="89" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="84" cy="86" r="2.3" fill="#fff"/></g><g><ellipse cx="125" cy="89" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="128" cy="86" r="2.3" fill="#fff"/></g>
<ellipse cx="66" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".75"/><ellipse cx="134" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".6"/>
<path d="M95 98 Q100 95 105 98 Q102 103 100 103 Q98 103 95 98 Z" fill="#f4a3ae" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
<ellipse cx="100" cy="109" rx="4.5" ry="5.5" fill="#a33a46" stroke="#2b1d1a" stroke-width="3"/>
<g transform="rotate(-6 100 40)">
	<path d="M70 42 C58 38 58 18 74 18 C74 4 96 0 102 12 C110 0 132 6 128 22 C142 22 142 40 130 42 Z" fill="#fffdf8" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M90 16 C92 24 92 32 90 40 M110 16 C108 24 108 32 110 40" fill="none" stroke="#2b1d1a" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
	<rect x="68" y="38" width="64" height="12" rx="5" fill="#e2363b" stroke="#2b1d1a" stroke-width="4"/>
</g>
</g></g></g></g></g></svg>
```

### 10. `miso-empty-cart.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" id="miso-empty-cart" viewBox="0 -14 200 232"><g><g><g><path d="M24 136 L58 112 L58 136 Z" fill="#c78d55" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/><path d="M142 136 L176 116 L172 136 Z" fill="#c78d55" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/><g>
	<path d="M150 150 C166 140 170 110 160 96" fill="none" stroke="#2b1d1a" stroke-width="26" stroke-linecap="round"/>
	<path d="M150 150 C166 140 170 110 160 96" fill="none" stroke="#fbf0dc" stroke-width="16" stroke-linecap="round"/>
	<path d="M164 108 C164 102 162 99 160 96" fill="none" stroke="#2a2321" stroke-width="16" stroke-linecap="round"/></g><g transform="rotate(6 100 92)">
<path d="M58 72 L52 34 L86 54 Z" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 64 L60 44 L78 55 Z" fill="#f4a3ae"/>
<path d="M142 72 L148 34 L114 54 Z" fill="#2a2321" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M138 64 L140 44 L122 55 Z" fill="#6a4a4f"/>
<defs><clipPath id="ms14h"><path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z"/></clipPath></defs>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms14h)"><path d="M108 40 C140 40 160 60 156 96 C150 104 136 106 128 98 C116 86 104 70 108 40 Z" fill="#2a2321"/></g>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<g><ellipse cx="78" cy="93" rx="6.5" ry="7" fill="#2b1d1a"/><circle cx="80" cy="95" r="2" fill="#fff"/></g><g><ellipse cx="122" cy="93" rx="6.5" ry="7" fill="#2b1d1a"/><circle cx="124" cy="95" r="2" fill="#fff"/></g>
<ellipse cx="66" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".75"/><ellipse cx="134" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".6"/>
<path d="M95 98 Q100 95 105 98 Q102 103 100 103 Q98 103 95 98 Z" fill="#f4a3ae" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
<ellipse cx="100" cy="109" rx="4.5" ry="5.5" fill="#a33a46" stroke="#2b1d1a" stroke-width="3"/>
<g transform="rotate(-6 100 40)">
	<path d="M70 42 C58 38 58 18 74 18 C74 4 96 0 102 12 C110 0 132 6 128 22 C142 22 142 40 130 42 Z" fill="#fffdf8" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M90 16 C92 24 92 32 90 40 M110 16 C108 24 108 32 110 40" fill="none" stroke="#2b1d1a" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
	<rect x="68" y="38" width="64" height="12" rx="5" fill="#e2363b" stroke="#2b1d1a" stroke-width="4"/>
</g>
</g><path d="M36 200 L44 136 L156 136 L164 200 Z" fill="#d9a066" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/><path d="M60 166 h80" stroke="#2b1d1a" stroke-width="3" opacity=".25"/><ellipse cx="80" cy="136" rx="12" ry="10.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M76 138 v4 M84 138 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><ellipse cx="120" cy="136" rx="12" ry="10.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M116 138 v4 M124 138 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g transform="rotate(6 100 92)"><path d="M58 100 L40 96 M58 106 L40 108 M142 100 L160 96 M142 106 L160 108" stroke="#2b1d1a" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></g></g></g></svg>
```

### 11. `miso-no-deals.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" id="miso-no-deals" viewBox="0 -14 200 232"><ellipse cx="100" cy="198" rx="58" ry="8" fill="rgba(0,0,0,.18)"/><g><g><g><g>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#2b1d1a" stroke-width="26" stroke-linecap="round"/>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#fbf0dc" stroke-width="16" stroke-linecap="round"/>
	<path d="M170 112 C168 104 171 99 178 96" fill="none" stroke="#2a2321" stroke-width="16" stroke-linecap="round"/></g><g><path d="M66 144 Q74 153 72 162" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><g><path d="M134 144 Q126 153 128 162" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><defs><clipPath id="ms15b"><path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z"/></clipPath></defs>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms15b)"><path d="M54 150 C64 138 80 140 84 156 C88 172 70 180 54 178 Z" fill="#2a2321"/></g>
<path d="M78 132 L122 132 L132 188 L68 188 Z" fill="#e2363b" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/>
<path d="M88 132 C88 124 112 124 112 132" fill="none" stroke="#2b1d1a" stroke-width="3"/>
<g transform="translate(100 162)">
	<path d="M-15 0 C-9 -9 6 -9 10 0 C6 9 -9 9 -15 0 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<path d="M10 0 L19 -7 L19 7 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<circle cx="-9" cy="-1.5" r="1.6" fill="#2b1d1a"/>
	<path d="M-4 -5.5 l3 11 M2.5 -5.5 l3 11" stroke="#c4682f" stroke-width="2.2" stroke-linecap="round"/></g>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<ellipse cx="82" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><ellipse cx="118" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><g><path d="M66 144 Q74 153 72 162" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="72" cy="162" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M68 164 v4 M76 164 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g><path d="M134 144 Q126 153 128 162" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="128" cy="162" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M124 164 v4 M132 164 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g><path d="M64 140 L114 140 L136 162 L114 184 L64 184 Z" fill="#ffd166" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/>
	<circle cx="116" cy="162" r="5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="3"/><path d="M80 162 h22" stroke="#2b1d1a" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="3 5"/></g><ellipse cx="72" cy="162" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M68 164 v4 M76 164 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><ellipse cx="128" cy="162" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M124 164 v4 M132 164 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><g transform="rotate(-8 100 92)">
<path d="M58 72 L52 34 L86 54 Z" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 64 L60 44 L78 55 Z" fill="#f4a3ae"/>
<path d="M142 72 L148 34 L114 54 Z" fill="#2a2321" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M138 64 L140 44 L122 55 Z" fill="#6a4a4f"/>
<defs><clipPath id="ms15h"><path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z"/></clipPath></defs>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms15h)"><path d="M108 40 C140 40 160 60 156 96 C150 104 136 106 128 98 C116 86 104 70 108 40 Z" fill="#2a2321"/></g>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<g><ellipse cx="78" cy="86" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="80" cy="82" r="2.3" fill="#fff"/></g><g><ellipse cx="122" cy="86" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="124" cy="82" r="2.3" fill="#fff"/></g>
<ellipse cx="66" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".75"/><ellipse cx="134" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".6"/>
<path d="M95 98 Q100 95 105 98 Q102 103 100 103 Q98 103 95 98 Z" fill="#f4a3ae" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M93 108 L107 108" stroke="#2b1d1a" stroke-width="3.5" stroke-linecap="round"/>
<g transform="rotate(-6 100 40)">
	<path d="M70 42 C58 38 58 18 74 18 C74 4 96 0 102 12 C110 0 132 6 128 22 C142 22 142 40 130 42 Z" fill="#fffdf8" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M90 16 C92 24 92 32 90 40 M110 16 C108 24 108 32 110 40" fill="none" stroke="#2b1d1a" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
	<rect x="68" y="38" width="64" height="12" rx="5" fill="#e2363b" stroke="#2b1d1a" stroke-width="4"/>
</g>
</g></g><g transform="rotate(-8 100 92)"><path d="M58 100 L40 96 M58 106 L40 108 M142 100 L160 96 M142 106 L160 108" stroke="#2b1d1a" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></g></g></g></svg>
```

### 12. `miso-no-orders.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" id="miso-no-orders" viewBox="0 -14 200 232"><ellipse cx="100" cy="198" rx="58" ry="8" fill="rgba(0,0,0,.18)"/><g><g><g><g>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#2b1d1a" stroke-width="26" stroke-linecap="round"/>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#fbf0dc" stroke-width="16" stroke-linecap="round"/>
	<path d="M170 112 C168 104 171 99 178 96" fill="none" stroke="#2a2321" stroke-width="16" stroke-linecap="round"/></g><g><path d="M66 144 Q74 153 72 162" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><g><path d="M134 144 Q126 153 128 162" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><defs><clipPath id="ms16b"><path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z"/></clipPath></defs>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms16b)"><path d="M54 150 C64 138 80 140 84 156 C88 172 70 180 54 178 Z" fill="#2a2321"/></g>
<path d="M78 132 L122 132 L132 188 L68 188 Z" fill="#e2363b" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/>
<path d="M88 132 C88 124 112 124 112 132" fill="none" stroke="#2b1d1a" stroke-width="3"/>
<g transform="translate(100 162)">
	<path d="M-15 0 C-9 -9 6 -9 10 0 C6 9 -9 9 -15 0 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<path d="M10 0 L19 -7 L19 7 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<circle cx="-9" cy="-1.5" r="1.6" fill="#2b1d1a"/>
	<path d="M-4 -5.5 l3 11 M2.5 -5.5 l3 11" stroke="#c4682f" stroke-width="2.2" stroke-linecap="round"/></g>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<ellipse cx="82" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><ellipse cx="118" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><g><path d="M66 144 Q74 153 72 162" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="72" cy="162" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M68 164 v4 M76 164 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g><path d="M134 144 Q126 153 128 162" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="128" cy="162" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M124 164 v4 M132 164 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g><path d="M78 132 L122 132 L122 190 l-7 -5 l-7 5 l-8 -5 l-7 5 l-8 -5 l-7 5 Z" fill="#fff" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/>
	<path d="M88 146 h24 M88 156 h16" stroke="#e1d8cf" stroke-width="3" stroke-linecap="round"/></g><ellipse cx="72" cy="162" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M68 164 v4 M76 164 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><ellipse cx="128" cy="162" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M124 164 v4 M132 164 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><g>
<path d="M58 72 L52 34 L86 54 Z" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 64 L60 44 L78 55 Z" fill="#f4a3ae"/>
<path d="M142 72 L148 34 L114 54 Z" fill="#2a2321" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M138 64 L140 44 L122 55 Z" fill="#6a4a4f"/>
<defs><clipPath id="ms16h"><path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z"/></clipPath></defs>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms16h)"><path d="M108 40 C140 40 160 60 156 96 C150 104 136 106 128 98 C116 86 104 70 108 40 Z" fill="#2a2321"/></g>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<g><ellipse cx="78" cy="89" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="80" cy="86" r="2.3" fill="#fff"/></g><g><ellipse cx="122" cy="89" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="124" cy="86" r="2.3" fill="#fff"/></g>
<ellipse cx="66" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".75"/><ellipse cx="134" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".6"/>
<path d="M95 98 Q100 95 105 98 Q102 103 100 103 Q98 103 95 98 Z" fill="#f4a3ae" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M92 104 Q96 109 100 104 Q104 109 108 104" fill="none" stroke="#2b1d1a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
<g transform="rotate(-6 100 40)">
	<path d="M70 42 C58 38 58 18 74 18 C74 4 96 0 102 12 C110 0 132 6 128 22 C142 22 142 40 130 42 Z" fill="#fffdf8" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M90 16 C92 24 92 32 90 40 M110 16 C108 24 108 32 110 40" fill="none" stroke="#2b1d1a" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
	<rect x="68" y="38" width="64" height="12" rx="5" fill="#e2363b" stroke="#2b1d1a" stroke-width="4"/>
</g>
</g></g><g><path d="M58 100 L40 96 M58 106 L40 108 M142 100 L160 96 M142 106 L160 108" stroke="#2b1d1a" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></g></g></g></svg>
```

### 13. `miso-wave.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" id="miso-wave" viewBox="0 -14 200 232"><ellipse cx="100" cy="198" rx="58" ry="8" fill="rgba(0,0,0,.18)"/><g><g><g><g>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#2b1d1a" stroke-width="26" stroke-linecap="round"/>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#fbf0dc" stroke-width="16" stroke-linecap="round"/>
	<path d="M170 112 C168 104 171 99 178 96" fill="none" stroke="#2a2321" stroke-width="16" stroke-linecap="round"/></g><g><path d="M68 142 Q60 158 62 174" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><g><path d="M132 140 Q148 120 154 100" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><defs><clipPath id="ms2b"><path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z"/></clipPath></defs>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms2b)"><path d="M54 150 C64 138 80 140 84 156 C88 172 70 180 54 178 Z" fill="#2a2321"/></g>
<path d="M78 132 L122 132 L132 188 L68 188 Z" fill="#e2363b" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/>
<path d="M88 132 C88 124 112 124 112 132" fill="none" stroke="#2b1d1a" stroke-width="3"/>
<g transform="translate(100 162)">
	<path d="M-15 0 C-9 -9 6 -9 10 0 C6 9 -9 9 -15 0 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<path d="M10 0 L19 -7 L19 7 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<circle cx="-9" cy="-1.5" r="1.6" fill="#2b1d1a"/>
	<path d="M-4 -5.5 l3 11 M2.5 -5.5 l3 11" stroke="#c4682f" stroke-width="2.2" stroke-linecap="round"/></g>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<ellipse cx="82" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><ellipse cx="118" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><g><path d="M68 142 Q60 158 62 174" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="62" cy="174" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M58 176 v4 M66 176 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g><path d="M132 140 Q148 120 154 100" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="154" cy="100" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M150 102 v4 M158 102 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g>
<path d="M58 72 L52 34 L86 54 Z" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 64 L60 44 L78 55 Z" fill="#f4a3ae"/>
<path d="M142 72 L148 34 L114 54 Z" fill="#2a2321" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M138 64 L140 44 L122 55 Z" fill="#6a4a4f"/>
<defs><clipPath id="ms2h"><path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z"/></clipPath></defs>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms2h)"><path d="M108 40 C140 40 160 60 156 96 C150 104 136 106 128 98 C116 86 104 70 108 40 Z" fill="#2a2321"/></g>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M70 92 Q78 82 86 92" fill="none" stroke="#2b1d1a" stroke-width="4.5" stroke-linecap="round"/><path d="M114 92 Q122 82 130 92" fill="none" stroke="#2b1d1a" stroke-width="4.5" stroke-linecap="round"/>
<ellipse cx="66" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".75"/><ellipse cx="134" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".6"/>
<path d="M95 98 Q100 95 105 98 Q102 103 100 103 Q98 103 95 98 Z" fill="#f4a3ae" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M88 105 Q100 118 112 105" fill="#a33a46" stroke="#2b1d1a" stroke-width="3.5" stroke-linejoin="round"/>
<g transform="rotate(-6 100 40)">
	<path d="M70 42 C58 38 58 18 74 18 C74 4 96 0 102 12 C110 0 132 6 128 22 C142 22 142 40 130 42 Z" fill="#fffdf8" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M90 16 C92 24 92 32 90 40 M110 16 C108 24 108 32 110 40" fill="none" stroke="#2b1d1a" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
	<rect x="68" y="38" width="64" height="12" rx="5" fill="#e2363b" stroke="#2b1d1a" stroke-width="4"/>
</g>
</g></g><g><path d="M58 100 L40 96 M58 106 L40 108 M142 100 L160 96 M142 106 L160 108" stroke="#2b1d1a" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></g></g></g></svg>
```

### 14. `miso-lost.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" id="miso-lost" viewBox="0 -14 200 232"><ellipse cx="100" cy="198" rx="58" ry="8" fill="rgba(0,0,0,.18)"/><g><g><g><g>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#2b1d1a" stroke-width="26" stroke-linecap="round"/>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#fbf0dc" stroke-width="16" stroke-linecap="round"/>
	<path d="M170 112 C168 104 171 99 178 96" fill="none" stroke="#2a2321" stroke-width="16" stroke-linecap="round"/></g><g><path d="M66 144 Q74 153 72 162" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><g><path d="M134 144 Q126 153 128 162" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><defs><clipPath id="ms17b"><path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z"/></clipPath></defs>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms17b)"><path d="M54 150 C64 138 80 140 84 156 C88 172 70 180 54 178 Z" fill="#2a2321"/></g>
<path d="M78 132 L122 132 L132 188 L68 188 Z" fill="#e2363b" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/>
<path d="M88 132 C88 124 112 124 112 132" fill="none" stroke="#2b1d1a" stroke-width="3"/>
<g transform="translate(100 162)">
	<path d="M-15 0 C-9 -9 6 -9 10 0 C6 9 -9 9 -15 0 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<path d="M10 0 L19 -7 L19 7 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<circle cx="-9" cy="-1.5" r="1.6" fill="#2b1d1a"/>
	<path d="M-4 -5.5 l3 11 M2.5 -5.5 l3 11" stroke="#c4682f" stroke-width="2.2" stroke-linecap="round"/></g>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<ellipse cx="82" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><ellipse cx="118" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><g><path d="M66 144 Q74 153 72 162" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="72" cy="162" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M68 164 v4 M76 164 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g><path d="M134 144 Q126 153 128 162" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="128" cy="162" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M124 164 v4 M132 164 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g><path d="M60 126 L84 134 L116 126 L140 134 L140 176 L116 168 L84 176 L60 168 Z" fill="#fff6dd" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/>
	<path d="M84 134 L84 176 M116 126 L116 168" stroke="#2b1d1a" stroke-width="3" opacity=".35"/>
	<path d="M66 160 C80 140 96 168 110 146 S130 140 134 150" fill="none" stroke="#e2363b" stroke-width="3.5" stroke-dasharray="5 5" stroke-linecap="round"/></g>
	<text x="148" y="58" font-size="44" font-weight="900" font-family="system-ui,sans-serif" fill="#2b1d1a">?</text><ellipse cx="72" cy="162" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M68 164 v4 M76 164 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><ellipse cx="128" cy="162" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M124 164 v4 M132 164 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><g transform="rotate(-8 100 92)">
<path d="M58 72 L52 34 L86 54 Z" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 64 L60 44 L78 55 Z" fill="#f4a3ae"/>
<path d="M142 72 L148 34 L114 54 Z" fill="#2a2321" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M138 64 L140 44 L122 55 Z" fill="#6a4a4f"/>
<defs><clipPath id="ms17h"><path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z"/></clipPath></defs>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms17h)"><path d="M108 40 C140 40 160 60 156 96 C150 104 136 106 128 98 C116 86 104 70 108 40 Z" fill="#2a2321"/></g>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<g><ellipse cx="78" cy="90" rx="6.5" ry="8" fill="#2b1d1a"/><circle cx="80" cy="87" r="2.2" fill="#fff"/></g><g><ellipse cx="122" cy="90" rx="6.5" ry="8" fill="#2b1d1a"/><circle cx="124" cy="87" r="2.2" fill="#fff"/></g><path d="M68 74 L86 79 M132 74 L114 79" stroke="#2b1d1a" stroke-width="4" stroke-linecap="round"/>
<ellipse cx="66" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".75"/><ellipse cx="134" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".6"/>
<path d="M95 98 Q100 95 105 98 Q102 103 100 103 Q98 103 95 98 Z" fill="#f4a3ae" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
<ellipse cx="100" cy="109" rx="4.5" ry="5.5" fill="#a33a46" stroke="#2b1d1a" stroke-width="3"/>
<g transform="rotate(-6 100 40)">
	<path d="M70 42 C58 38 58 18 74 18 C74 4 96 0 102 12 C110 0 132 6 128 22 C142 22 142 40 130 42 Z" fill="#fffdf8" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M90 16 C92 24 92 32 90 40 M110 16 C108 24 108 32 110 40" fill="none" stroke="#2b1d1a" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
	<rect x="68" y="38" width="64" height="12" rx="5" fill="#e2363b" stroke="#2b1d1a" stroke-width="4"/>
</g>
</g></g><g transform="rotate(-8 100 92)"><path d="M58 100 L40 96 M58 106 L40 108 M142 100 L160 96 M142 106 L160 108" stroke="#2b1d1a" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></g></g></g></svg>
```

### 15. `miso-declined.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" id="miso-declined" viewBox="0 -14 200 232"><g><g><g><g><path d="M-10 196 H150" stroke="#2b1d1a" stroke-width="14" stroke-linecap="round"/><path d="M-10 196 H150" stroke="#c9a26b" stroke-width="7" stroke-linecap="round"/>
	<path d="M130 202 V230" stroke="#2b1d1a" stroke-width="10" stroke-linecap="round"/></g><g>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#2b1d1a" stroke-width="26" stroke-linecap="round"/>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#fbf0dc" stroke-width="16" stroke-linecap="round"/>
	<path d="M170 112 C168 104 171 99 178 96" fill="none" stroke="#2a2321" stroke-width="16" stroke-linecap="round"/></g><g><path d="M68 142 Q60 158 62 174" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><g><path d="M132 142 Q151 154 160 166" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><defs><clipPath id="ms18b"><path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z"/></clipPath></defs>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms18b)"><path d="M54 150 C64 138 80 140 84 156 C88 172 70 180 54 178 Z" fill="#2a2321"/></g>
<path d="M78 132 L122 132 L132 188 L68 188 Z" fill="#e2363b" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/>
<path d="M88 132 C88 124 112 124 112 132" fill="none" stroke="#2b1d1a" stroke-width="3"/>
<g transform="translate(100 162)">
	<path d="M-15 0 C-9 -9 6 -9 10 0 C6 9 -9 9 -15 0 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<path d="M10 0 L19 -7 L19 7 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<circle cx="-9" cy="-1.5" r="1.6" fill="#2b1d1a"/>
	<path d="M-4 -5.5 l3 11 M2.5 -5.5 l3 11" stroke="#c4682f" stroke-width="2.2" stroke-linecap="round"/></g>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<ellipse cx="82" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><ellipse cx="118" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><g><g transform="rotate(28 170 176)"><rect x="146" y="160" width="48" height="32" rx="6" fill="#5b7bd5" stroke="#2b1d1a" stroke-width="4"/>
	<rect x="146" y="167" width="48" height="7" fill="#2b1d1a" opacity=".75"/><rect x="152" y="179" width="14" height="6" rx="2" fill="#ffd166"/></g>
	<g transform="translate(184 140)"><circle r="12" fill="#e5484d" stroke="#2b1d1a" stroke-width="3.5"/><path d="M-5 -5 L5 5 M5 -5 L-5 5" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></g></g><g><path d="M68 142 Q60 158 62 174" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="62" cy="174" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M58 176 v4 M66 176 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g><path d="M132 142 Q151 154 160 166" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="160" cy="166" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M156 168 v4 M164 168 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g>
<path d="M58 72 L52 34 L86 54 Z" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 64 L60 44 L78 55 Z" fill="#f4a3ae"/>
<path d="M142 72 L148 34 L114 54 Z" fill="#2a2321" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M138 64 L140 44 L122 55 Z" fill="#6a4a4f"/>
<defs><clipPath id="ms18h"><path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z"/></clipPath></defs>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms18h)"><path d="M108 40 C140 40 160 60 156 96 C150 104 136 106 128 98 C116 86 104 70 108 40 Z" fill="#2a2321"/></g>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<g><ellipse cx="81" cy="89" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="84" cy="86" r="2.3" fill="#fff"/></g><g><ellipse cx="125" cy="89" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="128" cy="86" r="2.3" fill="#fff"/></g>
<ellipse cx="66" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".75"/><ellipse cx="134" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".6"/>
<path d="M95 98 Q100 95 105 98 Q102 103 100 103 Q98 103 95 98 Z" fill="#f4a3ae" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M92 104 Q96 109 100 104 Q104 109 108 104" fill="none" stroke="#2b1d1a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
<g transform="rotate(-6 100 40)">
	<path d="M70 42 C58 38 58 18 74 18 C74 4 96 0 102 12 C110 0 132 6 128 22 C142 22 142 40 130 42 Z" fill="#fffdf8" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M90 16 C92 24 92 32 90 40 M110 16 C108 24 108 32 110 40" fill="none" stroke="#2b1d1a" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
	<rect x="68" y="38" width="64" height="12" rx="5" fill="#e2363b" stroke="#2b1d1a" stroke-width="4"/>
</g>
</g></g><g><path d="M58 100 L40 96 M58 106 L40 108 M142 100 L160 96 M142 106 L160 108" stroke="#2b1d1a" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></g></g></g></svg>
```

### 16. `miso-outside.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" id="miso-outside" viewBox="0 -14 200 232"><ellipse cx="100" cy="198" rx="58" ry="8" fill="rgba(0,0,0,.18)"/><g><g><g><g>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#2b1d1a" stroke-width="26" stroke-linecap="round"/>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#fbf0dc" stroke-width="16" stroke-linecap="round"/>
	<path d="M170 112 C168 104 171 99 178 96" fill="none" stroke="#2a2321" stroke-width="16" stroke-linecap="round"/></g><g><path d="M68 142 Q60 158 62 174" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><g><path d="M132 140 Q151 114 160 88" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><defs><clipPath id="ms19b"><path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z"/></clipPath></defs>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms19b)"><path d="M54 150 C64 138 80 140 84 156 C88 172 70 180 54 178 Z" fill="#2a2321"/></g>
<path d="M78 132 L122 132 L132 188 L68 188 Z" fill="#e2363b" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/>
<path d="M88 132 C88 124 112 124 112 132" fill="none" stroke="#2b1d1a" stroke-width="3"/>
<g transform="translate(100 162)">
	<path d="M-15 0 C-9 -9 6 -9 10 0 C6 9 -9 9 -15 0 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<path d="M10 0 L19 -7 L19 7 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<circle cx="-9" cy="-1.5" r="1.6" fill="#2b1d1a"/>
	<path d="M-4 -5.5 l3 11 M2.5 -5.5 l3 11" stroke="#c4682f" stroke-width="2.2" stroke-linecap="round"/></g>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<ellipse cx="82" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><ellipse cx="118" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><g><path d="M68 142 Q60 158 62 174" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="62" cy="174" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M58 176 v4 M66 176 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g><path d="M132 140 Q151 114 160 88" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="160" cy="88" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M156 90 v4 M164 90 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g transform="rotate(6 100 92)">
<path d="M58 72 L52 34 L86 54 Z" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 64 L60 44 L78 55 Z" fill="#f4a3ae"/>
<path d="M142 72 L148 34 L114 54 Z" fill="#2a2321" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M138 64 L140 44 L122 55 Z" fill="#6a4a4f"/>
<defs><clipPath id="ms19h"><path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z"/></clipPath></defs>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms19h)"><path d="M108 40 C140 40 160 60 156 96 C150 104 136 106 128 98 C116 86 104 70 108 40 Z" fill="#2a2321"/></g>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<g><ellipse cx="78" cy="86" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="80" cy="82" r="2.3" fill="#fff"/></g><g><ellipse cx="122" cy="86" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="124" cy="82" r="2.3" fill="#fff"/></g>
<ellipse cx="66" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".75"/><ellipse cx="134" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".6"/>
<path d="M95 98 Q100 95 105 98 Q102 103 100 103 Q98 103 95 98 Z" fill="#f4a3ae" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M93 108 L107 108" stroke="#2b1d1a" stroke-width="3.5" stroke-linecap="round"/>
<g transform="rotate(-6 100 40)">
	<path d="M70 42 C58 38 58 18 74 18 C74 4 96 0 102 12 C110 0 132 6 128 22 C142 22 142 40 130 42 Z" fill="#fffdf8" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M90 16 C92 24 92 32 90 40 M110 16 C108 24 108 32 110 40" fill="none" stroke="#2b1d1a" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
	<rect x="68" y="38" width="64" height="12" rx="5" fill="#e2363b" stroke="#2b1d1a" stroke-width="4"/>
</g>
</g><g transform="translate(176 46)"><g><path d="M0 22 C-14 4 -14 -14 0 -14 C14 -14 14 4 0 22 Z" fill="#e2363b" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/><circle cy="-2" r="5" fill="#fff" stroke="#2b1d1a" stroke-width="2.5"/></g></g></g><g transform="rotate(6 100 92)"><path d="M58 100 L40 96 M58 106 L40 108 M142 100 L160 96 M142 106 L160 108" stroke="#2b1d1a" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></g><path d="M150 204 C186 196 182 150 168 96" fill="none" stroke="#2b1d1a" stroke-width="4" stroke-dasharray="6 7" stroke-linecap="round" opacity=".5"/></g></g></svg>
```

### 17. `miso-idle.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" id="miso-idle" viewBox="0 -14 200 232"><ellipse cx="100" cy="198" rx="58" ry="8" fill="rgba(0,0,0,.18)"/><g><g><g><g>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#2b1d1a" stroke-width="26" stroke-linecap="round"/>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#fbf0dc" stroke-width="16" stroke-linecap="round"/>
	<path d="M170 112 C168 104 171 99 178 96" fill="none" stroke="#2a2321" stroke-width="16" stroke-linecap="round"/></g><g><path d="M68 142 Q60 158 62 174" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><g><path d="M132 142 Q140 158 138 174" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><defs><clipPath id="ms1b"><path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z"/></clipPath></defs>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms1b)"><path d="M54 150 C64 138 80 140 84 156 C88 172 70 180 54 178 Z" fill="#2a2321"/></g>
<path d="M78 132 L122 132 L132 188 L68 188 Z" fill="#e2363b" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/>
<path d="M88 132 C88 124 112 124 112 132" fill="none" stroke="#2b1d1a" stroke-width="3"/>
<g transform="translate(100 162)">
	<path d="M-15 0 C-9 -9 6 -9 10 0 C6 9 -9 9 -15 0 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<path d="M10 0 L19 -7 L19 7 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<circle cx="-9" cy="-1.5" r="1.6" fill="#2b1d1a"/>
	<path d="M-4 -5.5 l3 11 M2.5 -5.5 l3 11" stroke="#c4682f" stroke-width="2.2" stroke-linecap="round"/></g>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<ellipse cx="82" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><ellipse cx="118" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><g><path d="M68 142 Q60 158 62 174" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="62" cy="174" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M58 176 v4 M66 176 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g><path d="M132 142 Q140 158 138 174" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="138" cy="174" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M134 176 v4 M142 176 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g>
<path d="M58 72 L52 34 L86 54 Z" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 64 L60 44 L78 55 Z" fill="#f4a3ae"/>
<path d="M142 72 L148 34 L114 54 Z" fill="#2a2321" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M138 64 L140 44 L122 55 Z" fill="#6a4a4f"/>
<defs><clipPath id="ms1h"><path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z"/></clipPath></defs>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms1h)"><path d="M108 40 C140 40 160 60 156 96 C150 104 136 106 128 98 C116 86 104 70 108 40 Z" fill="#2a2321"/></g>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<g><ellipse cx="78" cy="89" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="80" cy="86" r="2.3" fill="#fff"/></g><g><ellipse cx="122" cy="89" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="124" cy="86" r="2.3" fill="#fff"/></g>
<ellipse cx="66" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".75"/><ellipse cx="134" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".6"/>
<path d="M95 98 Q100 95 105 98 Q102 103 100 103 Q98 103 95 98 Z" fill="#f4a3ae" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M92 104 Q96 109 100 104 Q104 109 108 104" fill="none" stroke="#2b1d1a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
<g transform="rotate(-6 100 40)">
	<path d="M70 42 C58 38 58 18 74 18 C74 4 96 0 102 12 C110 0 132 6 128 22 C142 22 142 40 130 42 Z" fill="#fffdf8" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M90 16 C92 24 92 32 90 40 M110 16 C108 24 108 32 110 40" fill="none" stroke="#2b1d1a" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
	<rect x="68" y="38" width="64" height="12" rx="5" fill="#e2363b" stroke="#2b1d1a" stroke-width="4"/>
</g>
</g></g><g><path d="M58 100 L40 96 M58 106 L40 108 M142 100 L160 96 M142 106 L160 108" stroke="#2b1d1a" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></g></g></g></svg>
```

### 18. `miso-peek.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" id="miso-peek" viewBox="20 0 160 150"><g><g><g><g>
<path d="M58 72 L52 34 L86 54 Z" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 64 L60 44 L78 55 Z" fill="#f4a3ae"/>
<path d="M142 72 L148 34 L114 54 Z" fill="#2a2321" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M138 64 L140 44 L122 55 Z" fill="#6a4a4f"/>
<defs><clipPath id="ms3h"><path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z"/></clipPath></defs>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms3h)"><path d="M108 40 C140 40 160 60 156 96 C150 104 136 106 128 98 C116 86 104 70 108 40 Z" fill="#2a2321"/></g>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<g><ellipse cx="78" cy="89" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="80" cy="86" r="2.3" fill="#fff"/></g><g><ellipse cx="122" cy="89" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="124" cy="86" r="2.3" fill="#fff"/></g>
<ellipse cx="66" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".75"/><ellipse cx="134" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".6"/>
<path d="M95 98 Q100 95 105 98 Q102 103 100 103 Q98 103 95 98 Z" fill="#f4a3ae" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M92 104 Q96 109 100 104 Q104 109 108 104" fill="none" stroke="#2b1d1a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
<g transform="rotate(-6 100 40)">
	<path d="M70 42 C58 38 58 18 74 18 C74 4 96 0 102 12 C110 0 132 6 128 22 C142 22 142 40 130 42 Z" fill="#fffdf8" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M90 16 C92 24 92 32 90 40 M110 16 C108 24 108 32 110 40" fill="none" stroke="#2b1d1a" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
	<rect x="68" y="38" width="64" height="12" rx="5" fill="#e2363b" stroke="#2b1d1a" stroke-width="4"/>
</g>
</g><ellipse cx="74" cy="134" rx="12" ry="10.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M70 136 v4 M78 136 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/><ellipse cx="126" cy="134" rx="12" ry="10.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M122 136 v4 M130 136 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g><path d="M58 100 L40 96 M58 106 L40 108 M142 100 L160 96 M142 106 L160 108" stroke="#2b1d1a" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></g></g></g></svg>
```

### 19. `miso-side.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" id="miso-side" viewBox="0 -14 200 232"><ellipse cx="100" cy="198" rx="58" ry="8" fill="rgba(0,0,0,.18)"/><g><g><g><g>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#2b1d1a" stroke-width="26" stroke-linecap="round"/>
	<path d="M136 172 C168 176 182 150 170 124 C164 112 168 100 178 96" fill="none" stroke="#fbf0dc" stroke-width="16" stroke-linecap="round"/>
	<path d="M170 112 C168 104 171 99 178 96" fill="none" stroke="#2a2321" stroke-width="16" stroke-linecap="round"/></g><g><path d="M68 142 Q60 158 62 174" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><g><path d="M132 142 Q140 158 138 174" fill="none" stroke="#2b1d1a" stroke-width="27" stroke-linecap="round"/></g><defs><clipPath id="ms4b"><path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z"/></clipPath></defs>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms4b)"><path d="M54 150 C64 138 80 140 84 156 C88 172 70 180 54 178 Z" fill="#2a2321"/></g>
<path d="M78 132 L122 132 L132 188 L68 188 Z" fill="#e2363b" stroke="#2b1d1a" stroke-width="4" stroke-linejoin="round"/>
<path d="M88 132 C88 124 112 124 112 132" fill="none" stroke="#2b1d1a" stroke-width="3"/>
<g transform="translate(100 162)">
	<path d="M-15 0 C-9 -9 6 -9 10 0 C6 9 -9 9 -15 0 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<path d="M10 0 L19 -7 L19 7 Z" fill="#fff4e0" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
	<circle cx="-9" cy="-1.5" r="1.6" fill="#2b1d1a"/>
	<path d="M-4 -5.5 l3 11 M2.5 -5.5 l3 11" stroke="#c4682f" stroke-width="2.2" stroke-linecap="round"/></g>
<path d="M60 188 C54 150 66 120 100 118 C134 120 146 150 140 188 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<ellipse cx="82" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><ellipse cx="118" cy="188" rx="15" ry="8" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><g><path d="M68 142 Q60 158 62 174" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="62" cy="174" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M58 176 v4 M66 176 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g><path d="M132 142 Q140 158 138 174" fill="none" stroke="#fbf0dc" stroke-width="17" stroke-linecap="round"/><ellipse cx="138" cy="174" rx="11" ry="9.5" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5"/><path d="M134 176 v4 M142 176 v4" stroke="#2b1d1a" stroke-width="2" stroke-linecap="round" opacity=".5"/></g><g transform="rotate(-6 100 92)">
<path d="M58 72 L52 34 L86 54 Z" fill="#fbf0dc" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M62 64 L60 44 L78 55 Z" fill="#f4a3ae"/>
<path d="M142 72 L148 34 L114 54 Z" fill="#2a2321" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<path d="M138 64 L140 44 L122 55 Z" fill="#6a4a4f"/>
<defs><clipPath id="ms4h"><path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z"/></clipPath></defs>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="#fbf0dc"/>
<g clip-path="url(#ms4h)"><path d="M108 40 C140 40 160 60 156 96 C150 104 136 106 128 98 C116 86 104 70 108 40 Z" fill="#2a2321"/></g>
<path d="M52 92 C52 64 72 50 100 50 C128 50 148 64 148 92 C148 118 128 130 100 130 C72 130 52 118 52 92 Z" fill="none" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
<g><ellipse cx="81" cy="89" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="84" cy="86" r="2.3" fill="#fff"/></g><g><ellipse cx="125" cy="89" rx="6.5" ry="8.5" fill="#2b1d1a"/><circle cx="128" cy="86" r="2.3" fill="#fff"/></g>
<ellipse cx="66" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".75"/><ellipse cx="134" cy="104" rx="7" ry="4.5" fill="#f4a3ae" opacity=".6"/>
<path d="M95 98 Q100 95 105 98 Q102 103 100 103 Q98 103 95 98 Z" fill="#f4a3ae" stroke="#2b1d1a" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M92 104 Q96 109 100 104 Q104 109 108 104" fill="none" stroke="#2b1d1a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
<g transform="rotate(-6 100 40)">
	<path d="M70 42 C58 38 58 18 74 18 C74 4 96 0 102 12 C110 0 132 6 128 22 C142 22 142 40 130 42 Z" fill="#fffdf8" stroke="#2b1d1a" stroke-width="5" stroke-linejoin="round"/>
	<path d="M90 16 C92 24 92 32 90 40 M110 16 C108 24 108 32 110 40" fill="none" stroke="#2b1d1a" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
	<rect x="68" y="38" width="64" height="12" rx="5" fill="#e2363b" stroke="#2b1d1a" stroke-width="4"/>
</g>
</g></g><g transform="rotate(-6 100 92)"><path d="M58 100 L40 96 M58 106 L40 108 M142 100 L160 96 M142 106 L160 108" stroke="#2b1d1a" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></g></g></g></svg>
```

