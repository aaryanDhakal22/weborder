# animate.py
# quicc › assets › miso › animate.py
"""Reads svg/miso-*.svg (static, brief-compliant) and writes animated copies to
svg-animated/. Animation is SMIL (<animateTransform>/<animate>), so the files
move as <img>, CSS background, or inline, with no CSS or script.
Every animation is additive, so it composes with each group's own transform."""
import glob, os, re

EASE = ".45 0 .55 1"

def _anim(tag, attr, typ, vals, dur, begin, linear, times=None):
    n = len(vals)
    kt = times or ";".join(f"{i/(n-1):.3f}".rstrip("0").rstrip(".") if i else "0" for i in range(n))
    mode = ' calcMode="linear"' if linear else f' calcMode="spline" keySplines="{";".join([EASE]*(n-1))}"'
    t = f' type="{typ}" additive="sum"' if typ else ""
    return (f'<{tag} attributeName="{attr}"{t} values="{";".join(vals)}" keyTimes="{kt}"{mode} '
            f'dur="{dur}s" begin="{begin}s" repeatCount="indefinite"/>')

def rot(cx, cy, angles, dur, begin=0, linear=False, times=None):
    return _anim("animateTransform", "transform", "rotate", [f"{a} {cx} {cy}" for a in angles], dur, begin, linear, times)

def move(pts, dur, begin=0, linear=False, times=None):
    return _anim("animateTransform", "transform", "translate", [f"{x} {y}" for x, y in pts], dur, begin, linear, times)

def squash(cx, cy, pairs, dur, begin=0, linear=False, times=None):
    """Scale about (cx, cy): a translate and a scale with the same timing."""
    tr = [f"{cx*(1-sx):.2f} {cy*(1-sy):.2f}" for sx, sy in pairs]
    sc = [f"{sx} {sy}" for sx, sy in pairs]
    return (_anim("animateTransform", "transform", "translate", tr, dur, begin, linear, times)
            + _anim("animateTransform", "transform", "scale", sc, dur, begin, linear, times))

def fade(vals, dur, begin=0, linear=False, times=None):
    return _anim("animate", "opacity", None, [str(v) for v in vals], dur, begin, linear, times)

def blink(cy, begin=0):
    pairs = [(1, 1), (1, 1), (1, .1), (1, 1)]
    return squash(100, cy, pairs, 4.2, begin, True, "0;0.9;0.95;1")

def pivot(svg, gid):
    m = re.search(rf'<g id="{gid}" data-pivot="([\d.\-]+) ([\d.\-]+)"', svg)
    return (float(m.group(1)), float(m.group(2))) if m else None

def inject(svg, gid, xml):
    m = re.search(rf'<g id="{gid}"[^>]*>', svg)
    if not m:
        raise KeyError(gid)
    return svg[:m.end()] + xml + svg[m.end():]

def wrap(svg, p, start, xml, name="bob"):
    """Wrap every group from `start` to the end in a moving <g>."""
    i = svg.index(f'<g id="{p}-{start}"')
    j = svg.rindex("</svg>")
    return svg[:i] + f'<g id="{p}-{name}">{xml}' + svg[i:j] + "</g>" + svg[j:]

def tail_sway(svg, p, angles=(0, 5, 0, -5, 0), dur=3.2):
    pv = pivot(svg, f"{p}-tail")
    return inject(svg, f"{p}-tail", rot(*pv, angles, dur)) if pv else svg

# ---- per-scene choreography (brief §5 "Moves") -------------------------------
def received(s, p):
    s = inject(s, f"{p}-prop", rot(100, 160, [0, -3, 2, -2, 0], .8))
    return inject(s, f"{p}-arm-right", rot(128, 140, [0, -4, 3, -3, 0], .8))

def cooking(s, p):
    # rises 3 units and spins like a flat disc (horizontal squash), so it never tips past the top
    s = inject(s, f"{p}-prop", move([(0, 0), (0, -3), (0, 0)], 1.1) + squash(100, 2, [(1, 1), (.82, 1), (1, 1)], .55))
    s = inject(s, f"{p}-arm-left", rot(72, 140, [0, 7, 0], 1.1))
    s = inject(s, f"{p}-arm-right", rot(128, 140, [0, -7, 0], 1.1))
    return wrap(s, p, "tail", move([(0, 0), (0, 2.5), (0, 0)], .55))

def ready(s, p):
    s = inject(s, f"{p}-arm-right", rot(128, 140, [0, 9, 0, 0], .8, times="0;0.2;0.45;1"))
    return inject(s, f"{p}-fx-deco", fade([0, 0, 1, 0], .8, times="0;0.2;0.3;1", linear=True))

def out(s, p):
    s = inject(s, f"{p}-fx-deco", move([(2, 0), (-6, 0)], .5, linear=True) + fade([0, 1, 0], .5, linear=True))
    return wrap(s, p, "back", move([(0, 0), (0, -3), (0, 0)], .4))

def hop(s, p, deco):
    # base lift is 10; this moves between lift 0 (paws on the ground, squashed) and lift 13
    s = inject(s, f"{p}-lift", move([(0, 10), (0, -3), (0, 10)], .8)
               + squash(100, 204, [(1.015, .9), (.99, 1), (1.015, .9)], .8))
    s = inject(s, f"{p}-shadow", squash(100, 198, [(1.25, 1.25), (.85, .85), (1.25, 1.25)], .8))
    return inject(s, f"{p}-fx-deco", deco)

def done(s, p):
    return hop(s, p, fade([1, .25, 1], 1.4))

def placed(s, p):
    return hop(s, p, move([(0, -6), (0, 24)], 1.6, linear=True) + fade([0, 1, 1, 0], 1.6, linear=True, times="0;0.1;0.7;1"))

def closed(s, p):
    s = inject(s, f"{p}-body", squash(110, 190, [(1, 1), (1.012, 1.04), (1, 1)], 3.4))
    for g in ("head", "whiskers"):
        s = inject(s, f"{p}-{g}", move([(0, 0), (0, -2), (0, 0)], 3.4))
    return inject(s, f"{p}-fx-deco", move([(-2, 6), (4, -8)], 2.6, linear=True) + fade([0, 1, 1, 0], 2.6, linear=True, times="0;0.2;0.7;1"))

def paused(s, p):
    s = inject(s, f"{p}-prop", move([(0, 0), (-6, -6), (0, 0)], 2.4) + rot(170, 58, [0, -14, 0], 2.4))
    return wrap(s, p, "body", rot(100, 198, [0, -2.5, 0, 2.5, 0], 1.1))

def loading(s, p):
    s = inject(s, f"{p}-tail", rot(164, 182, [0, 8, 0, -12, 0], .6))
    return wrap(s, p, "tail", move([(0, 0), (0, -2), (0, 0)], 1.6))

def empty_cart(s, p):
    for g in ("head", "whiskers"):
        s = inject(s, f"{p}-{g}", move([(0, 3), (0, -5), (0, -5), (0, 3)], 2.6, times="0;0.35;0.65;1"))
    return s

def no_deals(s, p):
    return inject(s, f"{p}-prop", rot(100, 162, [0, 4, 0, -4, 0], 2.4))

def no_orders(s, p):
    return inject(s, f"{p}-prop", rot(100, 130, [0, 3, 0, -3, 0], 2.6))

def lost(s, p):
    s = inject(s, f"{p}-prop", rot(100, 150, [0, -5, 0, 5, 0], 2.6))
    return inject(s, f"{p}-fx-deco", move([(0, 0), (0, -6), (0, 0)], 1.8))

def declined(s, p):
    s = inject(s, f"{p}-arm-right", rot(128, 142, [0, 0, -10, 0, 0], 1.8, times="0;0.15;0.35;0.5;1"))
    # pushed from the table edge, falls and fades before it reaches the canvas edge
    return inject(s, f"{p}-card", move([(-12, -14), (-12, -14), (0, 0), (2, 6)], 1.8, times="0;0.15;0.35;1")
                  + fade([1, 1, 1, 0, 0], 1.8, times="0;0.15;0.45;0.6;1", linear=True))

def outside(s, p):
    return inject(s, f"{p}-prop", move([(0, 0), (0, -7), (0, 0)], 2))

def wave(s, p):
    s = inject(s, f"{p}-arm-right", rot(128, 140, [0, -16, 8, -16, 0], 1.4))
    return wrap(s, p, "tail", move([(0, 0), (0, -1.5), (0, 0)], 2.8))

def peek(s, p):
    return wrap(s, p, "head", move([(0, 3), (0, -4), (0, 3)], 2.6))

CUSTOM_TAIL = {"loading", "out"}   # tail handled by the scene (or inside a wrap only)
SCENES = {n.replace("_", "-"): fn for n, fn in globals().items()
          if callable(fn) and n in {"received", "cooking", "ready", "out", "done", "placed", "closed", "paused",
                                     "loading", "empty_cart", "no_deals", "no_orders", "lost", "declined",
                                     "outside", "wave", "peek"}}

def animate(path):
    s = open(path).read()
    p = re.search(r'<svg[^>]* id="miso-([a-z-]+)"', s).group(1)
    if p not in CUSTOM_TAIL:
        amp = (0, 2, 0, -2, 0) if p == "closed" else (0, 5, 0, -5, 0)
        s = tail_sway(s, p, amp, 3.4 if p == "closed" else 3.2)
    eyes = re.search(rf'<g id="{p}-eyes" data-pivot="100 ([\d.\-]+)">(.*?)</g>', s)
    if eyes and "<ellipse" in eyes.group(2):
        s = inject(s, f"{p}-eyes", blink(float(eyes.group(1)), begin=(len(p) % 5) * .3))
    if p in SCENES:
        s = SCENES[p](s, p)
    return p, s

if __name__ == "__main__":
    os.makedirs("svg-animated", exist_ok=True)
    for fp in sorted(glob.glob("svg/miso-*.svg")):
        p, s = animate(fp)
        out_fp = f"svg-animated/miso-{p}.svg"
        open(out_fp, "w").write(s.replace(f"quicc › assets › miso › miso-{p}.svg",
                                          f"quicc › assets › miso › animated › miso-{p}.svg"))
        print(f"✔ {out_fp}  {os.path.getsize(out_fp)/1024:.1f} KB")
