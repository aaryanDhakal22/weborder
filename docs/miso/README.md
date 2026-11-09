<!-- README.md -->
<!-- quicc › assets › miso › README.md -->
# Miso — v4, 19 scenes, animated

- `svg/` — the 19 files, named per §5. Flat vector, plain-hex colours, no text/filters/gradients, ids prefixed with the scene name.
- `sheet-red.png` — all scenes on #170D0E (with a simulated halo) and #FAFAFF.
- `sheet-green.png`, `sheet-blue.png`, `sheet-lavender.png` — store-colour checks.
- `sheet-64px.png` — every scene rendered at 64 px, upscaled.
- `svg-animated/` — the same 19 files with the animation built in (SMIL `<animateTransform>`/`<animate>`). They play as `<img src>`, as a CSS background, or inline; no CSS or JavaScript needed. Every animation is additive, so it rides on top of each group's own transform.
- `preview.html` — all 19 animated scenes, with dark/light, the four store colours and a pause button. It starts paused when the visitor has reduced motion turned on.
- `gen_miso.py` — the source: every scene is built from the same head/body/tail/arm parts. `sheet.py` rebuilds the previews.

`animate.py` builds `svg-animated/` from `svg/`; `build_preview.py` builds the preview; `frames.py` screenshots frames in headless Chromium.

Animation (all loop):
- every scene: blink every ~4 s (open eyes only), tail sway on its base
- received: notepad and writing paw wiggle · cooking: dough tosses and spins, arms pump, Miso bobs · ready: paw taps the bell, ring lines flash
- out: Miso and scooter bounce, speed lines stream · done / placed: hop with squash and stretch, shadow shrinks, sparkles twinkle / confetti falls
- closed: slow breathing, Z's float up · paused: wobble, the loose ticket floats · loading: fast tail flick, gentle bob
- empty-cart: peeks up and down · no-deals / no-orders: the tag / receipt sways · wave: paw waves
- lost: map turns, the "?" floats · declined: paw pushes, the card falls off the edge · outside: the pin floats · peek: rises and sinks
- Reduced motion: an `<img>` can't see the visitor's setting, so on the site either swap to the static file under `prefers-reduced-motion: reduce` (a `<picture>` with a media query does this), or inline the SVG and call `svg.pauseAnimations()`.

Pivots are on each animated group as `data-pivot="x y"` (canvas units).

Deviations from the §6 stacking order (needed by the pose):
- Held props (notepad, tag, receipt, map, card, scooter bar) sit *before* the arms so the paws are in front.
- `outside`: the pin is after the arms.
- `closed`, `paused`: the tail is in front of the body (it wraps around the front).
- `empty-cart`: head → box front (`prop`) → paws, so the box hides the chin.
- `peek`: paws after the head.
- `paused`: tickets on the back are inside `body`, the one on the head is inside `head`; only the flying ticket is `prop`.
- `done`, `placed`: Miso is wrapped in a `<scene>-lift` group (translate 0 −18).
- `out`: side view riding right, head three-quarter (black ear still on the viewer's right). `arm-left` is the far arm (behind the body), `arm-right` the near arm. The deck uses the store colour (as §5 asks).

Changelog

v2:
- Arms: no cover patch. Each arm's outline is clipped away only inside the body near the shoulder (`<scene>-clip-arm-<side>`), so the fur flows into the arm.
- Apron: narrower bib-and-skirt with a waist seam and a front pocket. No logo on the apron.
- Fish logo: moved to the hat front, filled `#F6C27A` so it reads on the white hat.

v3:
- Added `svg-animated/`, `preview.html` and the animation scripts.

v4:
- Jumps (done, placed): resting lift is now 10 (was 18) with shorter dangling legs. The hop runs from paws-on-the-ground (squashed) up to lift 13, so the hat and confetti stay inside the canvas at the top of the hop.
- Cooking: the dough sits 4 units lower and spins as a flat disc (horizontal squash) instead of tipping, so it stays inside.
- Empty cart: the face sits 8 units higher, so the mouth clears the rim. The flaps now hang outward below the whiskers.
- Paused: redrawn as a real loaf (wide, low dome, paws tucked, head low on the front, tail wrapped round) with the tickets lying on its back and head.
- Out: speed lines start further in and the wheels sit 2 units higher. Loading: the tail curls tighter and the flick is smaller.
- Declined: the table is drawn with filled shapes that end exactly on the left and bottom edges, and the card fades out before it reaches the edge.
- `check_bounds.py`: samples every scene at 60 points through its loop in Chromium and reports anything outside the viewBox. All 19 static and all 19 animated files pass.
