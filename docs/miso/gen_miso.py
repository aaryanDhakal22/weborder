# gen_miso.py
# quicc › assets › miso › gen_miso.py
"""Builds the 19 Miso scenes (miso-<scene>.svg) from shared, hand-tuned parts.

Every scene reuses the same head, body, tail and arm parts so the character
stays identical across files. Run:  python3 gen_miso.py  -> ./svg/*.svg
"""
import os

# ---- reserved colours (brief §4) -------------------------------------------
O = "#2B1D1A"   # outline + fx
F = "#FBF0DC"   # fur
K = "#2A2321"   # black patches / right ear / tail tip
S = "#E2363B"   # store colour: apron, hat band, map pin (+ scooter deck, §5)
# ---- free colours ------------------------------------------------------------
HAT, PINK, MAUVE, MOUTH = "#FFFDF8", "#F4A3AE", "#6A4A4F", "#A33A46"
FISH, GRILL = "#FFF4E0", "#C4682F"

def f(x):
    return f"{x:.1f}".rstrip("0").rstrip(".") if isinstance(x, float) else str(x)

def st(d, w, c=O, extra=""):
    return (f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{f(w)}" '
            f'stroke-linecap="round" stroke-linejoin="round"{extra}/>')

def fl(d, c, w=5, extra=""):
    return (f'<path d="{d}" fill="{c}" stroke="{O}" stroke-width="{f(w)}" '
            f'stroke-linejoin="round"{extra}/>')

def nf(d, c, extra=""):
    return f'<path d="{d}" fill="{c}"{extra}/>'

def el(cx, cy, rx, ry, c, w=5, extra=""):
    s = f' stroke="{O}" stroke-width="{f(w)}"' if w else ""
    return f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(rx)}" ry="{f(ry)}" fill="{c}"{s}{extra}/>'

def grp(gid, inner, tf="", pivot=None):
    t = f' transform="{tf}"' if tf else ""
    pv = f' data-pivot="{pivot}"' if pivot else ""
    return f'<g id="{gid}"{pv}{t}>{inner}</g>'

def rim(d, w=4.5):
    """A dark line drawn on the black patch: mauve rim so it stays visible."""
    return st(d, w + 3.5, MAUVE) + st(d, w)

# ---- head ---------------------------------------------------------------------
HEAD_D = ("M100 50C128 50 146 62 148 86C149 100 146 112 140 119C130 128 116 131 100 131"
          "C84 131 70 128 60 119C54 112 51 100 52 86C54 62 72 50 100 50Z")
EAR_L = "M58 76C53 62 50 47 52 38Q54 31 61 34C71 39 81 46 90 56Z"
EAR_R = "M142 76C147 62 150 47 148 38Q146 31 139 34C129 39 119 46 110 56Z"
IN_L = "M62 66C60 57 59 49 60 43C66 46 72 50 78 56Z"
IN_R = "M138 66C140 57 141 49 140 43C134 46 128 50 122 56Z"
# the ear "spills" into this patch: upper-right quarter, over the eye, fades on the cheek
PATCH = "M108 40C116 56 113 72 111 84C110 98 118 108 132 109C140 109 147 105 153 97L158 40Z"
HAT_D = "M70 43C57 40 57 18 73 18C72 4 96 -1 102 11C109 -1 133 5 129 21C143 21 144 41 130 43Z"

def eyes(p, kind="open", dx=0, dy=0, ry=8.5):
    out = []
    if kind == "open":
        for cx, right in ((78, False), (122, True)):
            x, y = cx + dx, 89 + dy
            ring = f' stroke="{MAUVE}" stroke-width="2.2"' if right else ""
            out.append(f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="6.5" ry="{f(ry)}" fill="{O}"{ring}/>')
            out.append(f'<circle cx="{f(x + 2.4)}" cy="{f(y - ry * .42)}" r="2.4" fill="#FFFFFF"/>')
    elif kind == "happy":   # ^ ^
        out.append(st(f"M{70+dx} {93+dy}Q{78+dx} {83+dy} {86+dx} {93+dy}", 4.5))
        out.append(rim(f"M{114+dx} {93+dy}Q{122+dx} {83+dy} {130+dx} {93+dy}"))
    elif kind == "sleep":   # closed, calm
        out.append(st("M70 89Q78 96 86 89", 4.5))
        out.append(rim("M114 89Q122 96 130 89"))
    return grp(f"{p}-eyes", "".join(out), pivot=f"100 {89 + dy}")

MOUTHS = {
    "smile": st("M91 105Q95.5 110 100 105Q104.5 110 109 105", 3.5),
    "grin": fl("M89 105Q100 107 111 105Q109 118 100 118Q91 118 89 105Z", MOUTH, 3.5)
            + nf("M94 114Q100 111 106 114Q103 117 100 117Q97 117 94 114Z", PINK),
    "open": fl("M93 106Q100 107 107 106Q106.5 119 100 119Q93.5 119 93 106Z", MOUTH, 3.5),
    "o": el(100, 110, 4, 5, MOUTH, 3),
    "flat": st("M93 108.5H107", 3.5),
    "wobble": st("M89 109.5q2.75-3.5 5.5 0t5.5 0 5.5 0 5.5 0", 3.5),
    "sly": st("M91 105Q96 110 101 105Q105 109 110 103", 3.5),
}

def hat(rot=-6, tx=0, ty=0):
    t = (f"translate({tx} {ty}) " if (tx or ty) else "") + f"rotate({rot} 100 44) translate(100 46) scale(.8 .86) translate(-100 -46)"
    return (f'<g transform="{t}">' + fl(HAT_D, HAT)
            + st("M90 17C92 25 92 33 90 41M110 17C108 25 108 33 110 41", 2.5, O, ' opacity=".3"')
            + f'<rect x="67" y="37" width="66" height="12" rx="6" fill="{S}" stroke="{O}" stroke-width="4"/>'
            + fish(98, 27, .62, "#F6C27A", 3.5) + "</g>")

def head(p, eye="open", mouth="smile", hat_rot=-6, hat_t=(0, 0), brows=False, tf="",
         eye_dx=0, eye_dy=0, eye_ry=8.5, extra="", face_dx=0):
    """face_dx > 0 turns the face toward the viewer's right (three-quarter view);
    ears, patch and hat stay put so the black ear is still on the viewer's right."""
    face = [el(66, 106, 7, 4.5, PINK, 0, ' opacity=".75"'),
            el(134, 106, 7, 4.5, PINK, 0, ' opacity=".45"'),
            fl("M95 98Q100 95.5 105 98Q103 103 100 103.5Q97 103 95 98Z", PINK, 2.5),
            eyes(p, eye, eye_dx, eye_dy, eye_ry)]
    if brows:
        face.append(st("M68 73L85 78", 4))
        face.append(rim("M132 73L115 78", 4))
    face.append(MOUTHS[mouth])
    ft = "".join(face)
    if face_dx:
        ft = f'<g transform="translate({face_dx} 0)">{ft}</g>'
    b = [fl(EAR_L, F), nf(IN_L, PINK), fl(EAR_R, K), nf(IN_R, MAUVE),
         nf(HEAD_D, F),
         f'<g clip-path="url(#{p}-clip-head)">{nf(PATCH, K)}</g>',
         st(HEAD_D, 5), ft, hat(hat_rot, *hat_t), extra]
    return grp(f"{p}-head", "".join(b), tf, "100 130")

WHISK = "M58 100L37 95M58 106L37 108M142 100L163 95M142 106L163 108"

WP = [""]

def whiskers(tf=""):
    t = f' transform="{tf}"' if tf else ""
    return f'<g id="{WP[0]}-whiskers"{t}>' + st(WHISK, 2.5, O, ' opacity=".7"') + "</g>"

# ---- body -----------------------------------------------------------------------
BODY_D = "M100 119C122 119 134 132 138 150C142 166 144 180 140 190H60C56 180 58 166 62 150C66 132 78 119 100 119Z"
BODY_OUT = "M60 190C56 180 58 166 62 150C66 132 78 119 100 119C122 119 134 132 138 150C142 166 144 180 140 190"
BODY_PATCH = "M46 162C60 154 77 157 81 171C84 183 77 194 62 197H46Z"
APRON = "M88 131Q100 128 112 131L114 150Q121 152 124 157L130 186Q100 191 70 186L76 157Q79 152 86 150Z"

def fish(cx, cy, sc=1, c=FISH, w=2.5):
    t = f"translate({cx} {cy})" + (f" scale({sc})" if sc != 1 else "")
    return (f'<g transform="{t}">'
            + fl("M-15 0C-9-9.5 6-9.5 10 0C6 9.5-9 9.5-15 0Z", c, w)
            + fl("M10 0L19-7Q17 0 19 7Z", c, w)
            + f'<circle cx="-9" cy="-1.5" r="1.7" fill="{O}"/>'
            + st("M-4-5.5l3 11M2.5-5.5l3 11", 2.2, GRILL) + "</g>")

def apron(d=APRON, strap=True, pocket=(100, 170), waist="M86 151Q100 154 114 151"):
    s = st("M89 131C89 122 111 122 111 131", 3) if strap else ""
    px, py = pocket
    pk = (f'<rect x="{px-11}" y="{py}" width="22" height="13" rx="3.5" fill="{S}" stroke="{O}" stroke-width="3"/>'
          + st(f"M{px-7} {py+4}h14", 2.5, O, ' opacity=".45"'))
    w = st(waist, 3) if waist else ""
    return fl(d, S, 4) + s + w + pk

def toes(x, y):
    return st(f"M{f(x-3.5)} {f(y+1.5)}v4M{f(x+3.5)} {f(y+1.5)}v4", 2, O, ' opacity=".5"')

def foot(x, y, rx=14, ry=8):
    return el(x, y, rx, ry, F) + toes(x, y)

def body_sit(p, feet=True):
    b = [nf(BODY_D, F), f'<g clip-path="url(#{p}-clip-body)">{nf(BODY_PATCH, K)}</g>', apron(),
         st(BODY_OUT, 5)]
    if feet:
        b += [st("M60 190H140", 5), foot(82, 190), foot(118, 190)]
    return grp(f"{p}-body", "".join(b))

def body_jump(p):
    legs = ("M82 178L79 194", "M118 178L121 194")
    b = [st(legs[0], 27), st(legs[1], 27), nf(BODY_D, F),
         st(legs[0], 17, F), st(legs[1], 17, F),
         f'<g clip-path="url(#{p}-clip-body)">{nf(BODY_PATCH, K)}</g>', apron(),
         st(BODY_OUT, 5), st("M60 190H73.5M90.5 190H109.5M126.5 190H140", 5),
         el(79, 196, 10.5, 8.5, F) + toes(79, 196), el(121, 196, 10.5, 8.5, F) + toes(121, 196)]
    return grp(f"{p}-body", "".join(b))

# ---- tail -----------------------------------------------------------------------
TAIL = ("M134 176C166 182 184 154 172 126C166 112 168 100 178 94", "M171 113C168 104 171 98 178 94")

def tail(p, d=TAIL, pivot="134 176"):
    return grp(f"{p}-tail", st(d[0], 26) + st(d[0], 16, F) + st(d[1], 16, K), pivot=pivot)

# ---- arms -----------------------------------------------------------------------
DEFS = []
BIG = "M-60-60H260V260H-60Z"

def arm(p, side, d, sh, paw, rot=0, clip=True, body_d=None):
    """Tube arm that grows out of the body. Its outline is clipped away only
    where it is inside the body AND near the shoulder, so the fur flows into
    the arm with no seam and nothing is painted over the apron."""
    px, py = paw
    sx, sy = sh
    r = 13.6
    pr = f' transform="rotate({rot} {px} {py})"' if rot else ""
    outline = st(d, 27)
    if clip:
        cid = f"{p}-clip-arm-{side}"
        circ = f"M{f(sx - r)} {sy}a{r} {r} 0 1 0 {f(2 * r)} 0a{r} {r} 0 1 0 {f(-2 * r)} 0Z"
        DEFS.append(f'<clipPath id="{cid}"><path clip-rule="evenodd" d="{BIG}{body_d or BODY_D}"/>'
                    f'<path clip-rule="evenodd" d="{BIG}{circ}"/></clipPath>')
        outline = f'<g clip-path="url(#{cid})">{outline}</g>'
    parts = [outline,
             f'<g{pr}>' + el(px, py, 11, 9.5, F) + "</g>",
             st(d, 17, F),
             f'<g{pr}>' + el(px, py, 8.5, 7, F, 0) + toes(px, py) + "</g>"]
    return grp(f"{p}-arm-{side}", "".join(parts), pivot=f"{sx} {sy}")

def paw_only(p, side, x, y, rx=12, ry=10):
    return grp(f"{p}-arm-{side}", el(x, y, rx, ry, F) + toes(x, y + 1), pivot=f"{x} {y}")

L_SH, R_SH = (72, 140), (128, 140)
ARMS = {
    "rest":  (("M72 140Q60 156 62 172", (62, 174), 0), ("M128 140Q140 156 138 172", (138, 174), 0)),
    "hold":  (("M72 140Q64 152 70 162", (70, 163), -20), ("M128 140Q136 152 130 162", (130, 163), 20)),
    "holdw": (("M72 140Q60 150 64 160", (64, 161), -20), ("M128 140Q140 150 136 160", (136, 161), 20)),
    "up":    (("M72 140Q54 122 48 100", (48, 98), 20), ("M128 140Q146 122 152 100", (152, 98), -20)),
    "wave":  (None, ("M128 140Q148 122 153 98", (154, 96), -25)),
    "bell":  (None, ("M128 140Q148 136 162 146", (162, 147), 0)),
    "point": (None, ("M128 140Q150 114 158 90", (159, 88), -25)),
    "push":  (None, ("M128 142Q146 158 152 180", (153, 182), -10)),
    "bar":   (("M72 140Q62 144 64 150", (64, 151), 0), ("M128 140Q138 144 136 150", (136, 151), 0)),
}

def arms(p, left="rest", right="rest"):
    l = ARMS[left][0] or ARMS["rest"][0]
    r = ARMS[right][1] or ARMS["rest"][1]
    return (arm(p, "left", l[0], L_SH, l[1], l[2]), arm(p, "right", r[0], R_SH, r[1], r[2]))

def shadow(p, cy=198, rx=58, ry=8, op=".18"):
    return grp(f"{p}-shadow", f'<ellipse cx="100" cy="{cy}" rx="{rx}" ry="{ry}" fill="#000000" fill-opacity="{op}"/>')

def defs(p, body=BODY_D, extra=""):
    return (f'<defs><clipPath id="{p}-clip-head"><path d="{HEAD_D}"/></clipPath>'
            f'<clipPath id="{p}-clip-body"><path d="{body}"/></clipPath>'
            f'{extra}</defs>')

def svg(name, groups, vb="0 -14 200 232", d=None):
    p = name
    extra = "".join(DEFS)
    DEFS.clear()
    if d is None:
        d = defs(p)
    d = d.replace("</defs>", extra + "</defs>")
    return (f"<!-- miso-{name}.svg -->\n<!-- quicc › assets › miso › miso-{name}.svg -->\n"
            f'<svg xmlns="http://www.w3.org/2000/svg" id="miso-{name}" viewBox="{vb}">'
            + d + "".join(groups) + "</svg>\n")

def fx(p, inner):
    inner = inner.replace(f'id="-whiskers"', f'id="{p}-whiskers"')
    i = inner.find("</g>") + 4 if inner.startswith(f'<g id="{p}-whiskers"') else 0
    wh, deco = inner[:i], inner[i:]
    if deco:
        deco = f'<g id="{p}-fx-deco">{deco}</g>'
    return grp(f"{p}-fx", wh + deco)

def Z(x, y, s, w=5):
    return st(f"M{x} {y}h{s}l{-s} {s}h{s}", w)

def sparkle(x, y, r):
    a = r * .28
    return fl(f"M{x} {y-r}L{f(x+a)} {f(y-a)}L{x+r} {y}L{f(x+a)} {f(y+a)}L{x} {y+r}"
              f"L{f(x-a)} {f(y+a)}L{x-r} {y}L{f(x-a)} {f(y-a)}Z", "#FFD166", 2.5)

def tilt(a):
    return f"rotate({a} 100 130)"

# ---- scenes -----------------------------------------------------------------------
def sitting(p, head_kw, left="rest", right="rest", prop="", prop_first=True, back="", fxi="",
            shadow_g=None, tf_head=""):
    a_l, a_r = arms(p, left, right)
    gs = [shadow_g if shadow_g is not None else shadow(p)]
    if back:
        gs.append(grp(f"{p}-back", back))
    gs += [tail(p), body_sit(p)]
    if prop and prop_first:   # held props sit behind the paws
        gs.append(grp(f"{p}-prop", prop))
    gs += [a_l, a_r]
    if prop and not prop_first:
        gs.append(grp(f"{p}-prop", prop))
    gs.append(head(p, tf=tf_head, **head_kw))
    gs.append(fx(p, whiskers(tf_head) + fxi))
    return gs

SC = {}

def scene(fn):
    SC[fn.__name__.replace("_", "-")] = fn
    return fn

@scene
def received():
    p = "received"
    prop = (f'<rect x="80" y="138" width="40" height="44" rx="5" fill="#FFFFFF" stroke="{O}" stroke-width="4"/>'
            + st("M87 151h26M87 159h20M87 167h24", 3, "#C9BFB6")
            + st("M86 138v-4M100 138v-4M114 138v-4", 3)
            + st("M112 168L148 138", 9) + st("M115 165.5L148 138", 4.5, "#FFD166")
            + st("M112 168L115.5 165", 4, "#3B3330"))
    return sitting(p, dict(eye="open", eye_dy=3.5, eye_ry=7, mouth="smile"), "hold", "hold", prop)

@scene
def cooking():
    p = "cooking"
    prop = ('<g data-pivot="100 2">' + el(100, 2, 37, 9.5, "#F7D58A")
            + el(100, 0, 26, 5, "#F08A5D", 0, ' opacity=".9"')
            + '<circle cx="88" cy="0" r="3.2" fill="#B5413A"/><circle cx="110" cy="-1" r="3.2" fill="#B5413A"/></g>')
    f_ = st("M52 -4q-6 6 0 12M148 -4q6 6 0 12", 3, O, ' opacity=".6"')
    return sitting(p, dict(eye="open", eye_dy=-4, mouth="open"), "up", "up", prop, fxi=f_)

@scene
def ready():
    p = "ready"
    prop = (f'<rect x="134" y="184" width="60" height="10" rx="4" fill="#C9A26B" stroke="{O}" stroke-width="4"/>'
            + fl("M140 184C140 158 188 158 188 184Z", "#FFD166")
            + st("M149 174C151 166 157 163 163 163", 3.5, "#FFFFFF", ' opacity=".8"')
            + f'<rect x="159" y="150" width="10" height="11" rx="3" fill="#FFD166" stroke="{O}" stroke-width="3.5"/>')
    f_ = st("M180 150l8-7M184 162h10M150 146l-6-7", 4)
    return sitting(p, dict(eye="happy", mouth="grin"), "rest", "bell", prop, fxi=f_)

SIDE_BODY = "M88 120C112 116 130 132 132 158C134 178 126 192 106 192H82C66 190 62 174 66 154C68 136 76 122 88 120Z"
SIDE_PATCH = "M56 160C68 150 86 156 90 170C93 184 84 196 64 198H56Z"
SIDE_APRON = "M116 128C127 140 133 160 130 188L113 190C118 170 118 150 110 132Z"

@scene
def out():
    """Side view: Miso rides toward the viewer's right; the stem rises from the
    front (right) wheel. Head is three-quarter so the black ear stays on the right."""
    p = "out"
    back = (f'<g transform="rotate(-4 42 180)"><rect x="22" y="166" width="40" height="28" rx="4" fill="#D9A066" stroke="{O}" stroke-width="4"/>'
            + st("M22 178h40", 3, "#C78D55") + st("M42 166v28", 3, "#3B3330") + "</g>"
            + st("M24 197H170", 13) + st("M24 197H170", 6, S)
            + el(40, 205, 10, 10, "#3B3330") + '<circle cx="40" cy="205" r="3.5" fill="#C9BFB6"/>'
            + el(166, 205, 10, 10, "#3B3330") + '<circle cx="166" cy="205" r="3.5" fill="#C9BFB6"/>')
    tl = grp(f"{p}-tail", st("M72 160C44 162 28 142 34 118C37 106 34 96 24 90", 26)
             + st("M72 160C44 162 28 142 34 118C37 106 34 96 24 90", 16, F)
             + st("M35 104C36 97 31 92 24 90", 16, K), pivot="72 160")
    far = arm(p, "left", "M104 140Q128 134 150 130", (104, 140), (151, 129), -10, clip=False)
    body = grp(f"{p}-body", foot(86, 190, 13, 7.5) + nf(SIDE_BODY, F)
               + f'<g clip-path="url(#{p}-clip-body)">{nf(SIDE_PATCH, K)}</g>'
               + fl(SIDE_APRON, S, 4) + st(SIDE_BODY, 5) + foot(110, 191, 14, 8))
    stem = (st("M166 203L150 128", 10) + st("M166 203L150 128", 4, "#9AA3AD")
            + st("M141 129L158 124", 10) + st("M141 129L158 124", 4, "#9AA3AD")
            + f'<rect x="153" y="119" width="12" height="9" rx="4" fill="#3B3330" stroke="{O}" stroke-width="3" transform="rotate(-16 159 124)"/>')
    near = arm(p, "right", "M100 142Q124 146 146 136", (100, 142), (147, 135), -10, body_d=SIDE_BODY)
    htf = "translate(4 0)"
    hd = head(p, eye="open", eye_dx=4, mouth="grin", face_dx=7, tf=htf)
    f_ = (f'<g id="{p}-whiskers" transform="translate(11 0)">' + st(WHISK, 2.5, O, ' opacity=".7"') + "</g>"
          + st("M14 150h20M10 168h22M20 132h14", 4.5, O, ' opacity=".55"'))
    gs = [shadow(p, 212, 76, 4), grp(f"{p}-back", back), tl, far, body,
          grp(f"{p}-prop", stem, pivot="166 205"), near, hd, fx(p, f_)]
    return svg(p, gs, d=defs(p, SIDE_BODY))

def jumping(p, head_kw, fxi):
    a_l, a_r = arms(p, "up", "up")
    lift = "translate(0 -10)"
    miso = [tail(p), body_jump(p), a_l, a_r, head(p, **head_kw), fx(p, whiskers() + fxi)]
    return [shadow(p, 198, 40, 6, ".14"), f'<g id="{p}-lift" transform="{lift}">' + "".join(miso) + "</g>"]

@scene
def done():
    f_ = sparkle(28, 54, 9) + sparkle(170, 62, 7) + sparkle(158, 22, 5.5)
    return jumping("done", dict(eye="happy", mouth="grin"), f_)

@scene
def placed():
    cols = ["#FFD166", "#5BD1A3", "#8FB8FF", "#FF8FA3"]
    pts = [(20, 40, 20), (172, 30, -25), (34, 88, 40), (166, 94, -10), (124, 10, 70), (58, 14, 15), (148, 12, 50), (182, 64, 30), (12, 70, -40)]
    f_ = "".join(f'<rect x="{x}" y="{y}" width="10" height="5" rx="1.5" fill="{cols[i % 4]}" stroke="{O}" '
                 f'stroke-width="2" transform="rotate({r} {x+5} {y+2.5})"/>' for i, (x, y, r) in enumerate(pts))
    return jumping("placed", dict(eye="open", eye_dy=-2, mouth="open"), f_)

# curled (closed / loading)
CURL = "M40 176C38 154 70 142 112 142C152 142 182 152 182 174C182 192 154 198 112 198C70 198 42 194 40 176Z"
CURL_PATCH = "M112 136C142 132 172 142 178 160C162 170 134 166 118 158C106 150 102 140 112 136Z"
CURL_HEAD = "translate(72 158) rotate(-14) scale(.78) translate(-100 -92)"

def curled(p, oy, head_kw, tail_g, tail_front, back="", fxi="", shadow_g=""):
    tfb = f"translate(0 {oy})" if oy else ""
    body = grp(f"{p}-body", nf(CURL, F) + f'<g clip-path="url(#{p}-clip-body)">{nf(CURL_PATCH, K)}</g>' + st(CURL, 5), tfb)
    htf = (f"translate(0 {oy}) " if oy else "") + CURL_HEAD
    gs = [shadow_g]
    if back:
        gs.append(grp(f"{p}-back", back))
    if not tail_front:
        gs.append(tail_g)
    gs.append(body)
    if tail_front:
        gs.append(tail_g)
    gs += [paw_only(p, "left", 54, 186 + oy, 11, 8.5), paw_only(p, "right", 78, 191 + oy, 11, 8.5),
           head(p, tf=htf, **head_kw), fx(p, whiskers(htf) + fxi)]
    return svg(p, gs, d=defs(p, CURL))

@scene
def closed():
    p = "closed"
    oy = -6
    back = (fl("M10 200L24 188H178L192 200Z", "#D9A066") + fl("M10 200H192V214H10Z", "#C78D55")
            + st("M60 194H140", 3, O, ' opacity=".3"'))
    tl = grp(f"{p}-tail", f'<g transform="translate(0 {oy})">'
             + st("M178 178C190 202 132 210 92 204C70 201 52 196 46 188", 26)
             + st("M178 178C190 202 132 210 92 204C70 201 52 196 46 188", 16, F)
             + st("M62 199C55 197 49 193 46 188", 16, K) + "</g>", pivot=f"178 {178+oy}")
    f_ = Z(136, 108, 9, 4.5) + Z(152, 82, 13, 5) + Z(170, 50, 17, 5.5)
    return curled(p, oy, dict(eye="sleep", mouth="smile", hat_rot=-26, hat_t=(-10, 8)), tl, True, back, f_,
                  shadow(p, 214, 92, 3.5))

@scene
def loading():
    p = "loading"
    TD = "M164 182C182 172 180 136 158 124"
    tl = grp(f"{p}-tail", st(TD, 26) + st(TD, 16, F) + st("M169 129C166 126 162 124 158 124", 16, K), pivot="164 182")
    return curled(p, 0, dict(eye="open", eye_dx=4, eye_dy=-3, mouth="o"), tl, False, shadow_g=shadow(p, 198, 76, 7))

LOAF = "M28 198C22 168 52 146 100 146C148 146 178 168 172 198Z"
LOAF_PATCH = "M14 172C30 160 54 164 58 180C61 194 50 204 30 204H14Z"

def ticket(x, y, w, h, rot, line=True):
    """A paper order ticket lying at an angle (x, y = its centre)."""
    t = (f'<g transform="rotate({rot} {x} {y})"><rect x="{x-w/2:g}" y="{y-h/2:g}" width="{w}" height="{h}" rx="2.5" '
         f'fill="#FFFFFF" stroke="{O}" stroke-width="3.5"/>')
    if line:
        t += st(f"M{x-w/2+7:g} {y-1.5:g}h{w-18:g}M{x-w/2+7:g} {y+2.5:g}h{w-24:g}", 2, "#C9BFB6")
    return t + "</g>"

@scene
def paused():
    """A real loaf: a wide low dome, paws tucked out of sight, head sitting low
    on the front, tail wrapped round, tickets piled on the back and head."""
    p = "paused"
    pile = (ticket(56, 155, 40, 15, -24) + ticket(44, 162, 38, 14, -34) + ticket(62, 150, 36, 13, -14)
            + ticket(144, 155, 40, 15, 24) + ticket(156, 163, 38, 14, 36))
    body = grp(f"{p}-body", nf(LOAF, F) + f'<g clip-path="url(#{p}-clip-body)">{nf(LOAF_PATCH, K)}</g>'
               + apron("M84 160Q100 157 116 160L120 196Q100 199 80 196Z", False, (100, 177), None)
               + st(LOAF, 5) + pile)
    TD = "M166 182C177 196 132 200 108 196"
    tl = grp(f"{p}-tail", st(TD, 26) + st(TD, 16, F) + st("M119 198C115 198 111 197 108 196", 16, K), pivot="166 182")
    on_head = (ticket(76, 58, 40, 14, -16) + ticket(128, 56, 34, 13, 20, False)
               + fl("M155 90q7 10 0 15q-7-5 0-15Z", "#8FD3FF", 2.5))
    htf = "translate(100 120) scale(.86) translate(-100 -92)"
    prop = (f'<g data-pivot="170 58">' + ticket(170, 58, 34, 13, 22) + "</g>")
    f_ = st("M150 34q8-4 14 2M140 46q6-6 12-4", 3, O, ' opacity=".55"')
    return svg("paused", [shadow(p, 198, 74, 7), body, tl, grp(f"{p}-prop", prop),
                          head(p, eye="open", mouth="wobble", brows=True, hat_rot=-18, tf=htf, extra=on_head),
                          fx(p, whiskers(htf) + f_)], d=defs(p, LOAF))

@scene
def empty_cart():
    p = "empty-cart"
    back = (fl("M42 136L50 125L26 134L16 150Z", "#C78D55", 4) + fl("M158 136L150 125L174 134L184 150Z", "#C78D55", 4)
            + fl("M42 136L50 124H150L158 136Z", "#B07A47", 4))
    tl = grp(f"{p}-tail", st("M146 150C168 140 176 110 164 94", 26) + st("M146 150C168 140 176 110 164 94", 16, F)
             + st("M168 106C168 101 166 97 164 94", 16, K), pivot="146 150")
    htf = "translate(0 10) rotate(8 100 130)"
    box = fl("M40 136H160L156 198H44Z", "#D9A066") + st("M62 168h76", 3, O, ' opacity=".2"') + st("M100 136v12", 4, "#C78D55")
    gs = [shadow(p, 198, 66, 7), grp(f"{p}-back", back), tl,
          head(p, eye="open", eye_dy=3.5, eye_ry=7, mouth="o", tf=htf),
          grp(f"{p}-prop", box, pivot="100 167"),
          paw_only(p, "left", 80, 136), paw_only(p, "right", 120, 136),
          fx(p, whiskers(htf))]
    return svg(p, gs)

@scene
def no_deals():
    p = "no-deals"
    prop = (fl("M66 141H112L134 162L112 183H66Z", "#FFD166", 4)
            + f'<circle cx="114" cy="162" r="5" fill="{FISH}" stroke="{O}" stroke-width="3"/>'
            + st("M80 162h22", 3.5, O, ' stroke-dasharray="3 6" opacity=".5"'))
    return sitting(p, dict(eye="open", eye_dx=-2, eye_dy=-4, mouth="flat"), "hold", "hold", prop, tf_head=tilt(-8))

@scene
def no_orders():
    p = "no-orders"
    prop = (fl("M80 130H120V190l-6.7-5-6.6 5-6.7-5-6.7 5-6.6-5-6.7 5Z", "#FFFFFF", 4)
            + st("M88 146h24M88 156h16M88 166h20", 3, "#E1D8CF"))
    return sitting(p, dict(eye="open", mouth="smile"), "hold", "hold", prop)

@scene
def wave():
    p = "wave"
    f_ = st("M168 86q8 9 5 20M164 72q10 2 14 10", 3.5, O, ' opacity=".6"')
    return sitting(p, dict(eye="happy", mouth="grin"), "rest", "wave", fxi=f_)

@scene
def lost():
    p = "lost"
    prop = (fl("M60 126L84 134L116 126L140 134V176L116 168L84 176L60 168Z", "#DCEFD2", 4)
            + st("M84 134V176M116 126V168", 3, O, ' opacity=".3"')
            + st("M66 160C80 140 96 168 110 146S130 140 134 150", 3.5, "#C94A3F", ' stroke-dasharray="5 6"')
            + st("M128 144l6 6M134 144l-6 6", 3, "#C94A3F"))
    q = st("M154 32C154 18 174 18 174 31C174 40 164 41 164 50", 6.5) + f'<circle cx="164" cy="61" r="4" fill="{O}"/>'
    return sitting(p, dict(eye="open", eye_ry=8, mouth="o", brows=True), "holdw", "holdw", prop,
                   fxi=f'<g data-pivot="164 42">{q}</g>', tf_head=tilt(-8))

@scene
def declined():
    p = "declined"
    # table: filled shapes so it ends exactly on the canvas edges
    back = (f'<path d="M0 191H150a7 7 0 0 1 0 14H0Z" fill="{O}"/>'
            + '<path d="M0 194.5H150a3.5 3.5 0 0 1 0 7H0Z" fill="#C9A26B"/>'
            + f'<rect x="127" y="204" width="10" height="14" fill="{O}"/>')
    card = (f'<g id="{p}-card" data-pivot="166 190"><g transform="rotate(28 166 190)"><rect x="146" y="177" width="40" height="26" rx="5" fill="#5B7BD5" stroke="{O}" stroke-width="4"/>'
            + f'<rect x="146" y="183" width="40" height="6" fill="{O}" opacity=".7"/>'
            + '<rect x="151" y="193" width="11" height="6" rx="2" fill="#FFD166"/></g></g>'
            + f'<g id="{p}-badge" transform="translate(182 146)"><circle r="12" fill="#E5484D" stroke="{O}" stroke-width="3.5"/>'
            + st("M-5-5L5 5M5-5L-5 5", 3.5, "#FFFFFF") + "</g>")
    f_ = st("M188 176q4 6 1 13", 3, O, ' opacity=".55"')
    return sitting(p, dict(eye="open", eye_ry=7, mouth="sly"), "rest", "push", card, back=back, fxi=f_)

@scene
def outside():
    p = "outside"
    pin = ('<g transform="translate(176 38)">' + fl("M0 22C-14 4-14-14 0-14S14 4 0 22Z", S, 4)
           + f'<circle cy="-2" r="5" fill="#FFFFFF" stroke="{O}" stroke-width="2.5"/></g>')
    f_ = st("M150 196C190 186 190 120 176 68", 4, O, ' stroke-dasharray="1 9" opacity=".55"')
    return sitting(p, dict(eye="open", eye_dx=3, eye_dy=-4, mouth="flat"), "rest", "point", pin,
                   prop_first=False, fxi=f_, tf_head=tilt(6))

@scene
def idle():
    return sitting("idle", dict(eye="open", mouth="smile"))

@scene
def peek():
    p = "peek"
    gs = [head(p, eye="open", mouth="smile"), paw_only(p, "left", 74, 134), paw_only(p, "right", 126, 134),
          fx(p, whiskers())]
    return svg(p, gs, vb="20 0 160 150", d=defs(p))

@scene
def side():
    return sitting("side", dict(eye="open", eye_dx=3.5, mouth="smile"), tf_head=tilt(5))

if __name__ == "__main__":
    os.makedirs("svg", exist_ok=True)
    for name, fn in SC.items():
        res = fn()
        txt = res if isinstance(res, str) else svg(name, res)
        with open(f"svg/miso-{name}.svg", "w") as fh:
            fh.write(txt)
        print(f"✔ miso-{name}.svg  {len(txt.encode())/1024:.1f} KB")
