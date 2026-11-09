# check_bounds.py
# quicc › assets › miso › check_bounds.py
"""Samples each scene in headless Chromium across its whole loop and reports how far
any visible shape (stroke included) goes outside the viewBox. Shapes inside a
clip-path and fully transparent shapes are skipped. Usage: python3 check_bounds.py [dir]"""
import glob, json, sys
from playwright.sync_api import sync_playwright

DIR = sys.argv[1] if len(sys.argv) > 1 else "svg-animated"
JS = r"""
(t) => {
  const out = {};
  for (const svg of document.querySelectorAll('svg')) {
    svg.pauseAnimations(); svg.setCurrentTime(t);
    const vb = svg.viewBox.baseVal, r = svg.getBoundingClientRect(), k = vb.width / r.width;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const el of svg.querySelectorAll('path,ellipse,rect,circle,line')) {
      if (el.closest('defs') || el.parentElement.closest('[clip-path]')) continue;
      let op = 1;
      for (let a = el; a && a !== svg; a = a.parentElement) op *= parseFloat(getComputedStyle(a).opacity);
      if (op < 0.05) continue;
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const sw = cs.stroke !== 'none' ? parseFloat(cs.strokeWidth) / 2 : 0;
      const m = el.getScreenCTM(); const sc = Math.hypot(m.a, m.b) * k;   // user units per local unit
      const pad = sw * sc;
      x0 = Math.min(x0, vb.x + (b.left - r.left) * k - pad);  y0 = Math.min(y0, vb.y + (b.top - r.top) * k - pad);
      x1 = Math.max(x1, vb.x + (b.right - r.left) * k + pad); y1 = Math.max(y1, vb.y + (b.bottom - r.top) * k + pad);
    }
    out[svg.id] = {left: vb.x - x0, top: vb.y - y0, right: x1 - (vb.x + vb.width), bottom: y1 - (vb.y + vb.height)};
  }
  return out;
}
"""
files = sorted(glob.glob(f"{DIR}/miso-*.svg"))
html = "<html><body>" + "".join(
    f'<div style="width:400px">{open(f).read().split("-->", 2)[2]}</div>' for f in files) + "</body></html>"
open("/tmp/bounds.html", "w").write(html.replace("<svg ", '<svg width="400" ', 1).replace("<svg xmlns", '<svg width="400" xmlns'))
worst = {}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=glob.glob("/opt/pw-browsers/chromium-*/chrome-linux*/chrome")[0])
    pg = b.new_page(viewport={"width": 420, "height": 800})
    pg.goto("file:///tmp/bounds.html")
    for i in range(60):
        for sid, v in pg.evaluate(JS, i * 4.2 / 60).items():
            w = worst.setdefault(sid, {k: -99 for k in v})
            for k in v:
                w[k] = max(w[k], v[k])
    b.close()
bad = 0
for sid, w in sorted(worst.items()):
    over = {k: round(v, 1) for k, v in w.items() if v > 0.5}
    bad += bool(over)
    print(("✘ " if over else "✔ ") + sid + ("  " + json.dumps(over) if over else ""))
print(f"\n{len(worst) - bad}/{len(worst)} scenes stay inside the canvas")
