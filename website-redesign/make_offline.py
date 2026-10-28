import re, os, base64, urllib.request, html, mimetypes, sys
D = r"C:\Users\User\OneDrive\Desktop\MY GYM\website-redesign"
os.chdir(D)
sys.path.insert(0, D)
from grade import grade_bytes as _grade_bytes
GRADE = False                          # owner wants original colours on every photo; set True to apply the brand grade again
def grade_bytes(b, *a, **k):
    return _grade_bytes(b, *a, **k) if GRADE else b
s = open("site-w.html", encoding="utf-8").read()
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

def get(url, accept="*/*"):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read(), r.headers.get("Content-Type", "")

def data_uri(b, mime):
    return "data:%s;base64,%s" % (mime, base64.b64encode(b).decode())

# ---- 1. fonts (Google Fonts -> inline woff2) ----
m = re.search(r'<link href="(https://fonts\.googleapis\.com/css2[^"]+)" rel="stylesheet">', s)
css_url = html.unescape(m.group(1))
css = get(css_url)[0].decode()
blocks = re.findall(r"/\* ([a-z\-]+) \*/\s*(@font-face\s*\{.*?\})", css, re.S)
keep = []
for subset, blk in blocks:
    if subset != "latin":
        continue
    u = re.search(r"url\((https://[^)]+)\)", blk).group(1)
    b, _ = get(u)
    keep.append(blk.replace(u, data_uri(b, "font/woff2")))
assert keep, "no latin font blocks"
font_css = "<style>" + "\n".join(keep) + "</style>"
s = s.replace(m.group(0), font_css)
print("fonts:", len(keep), "faces")

# ---- 2. remote photos (own Wix site) ----
os.makedirs("offline-assets", exist_ok=True)
urls = sorted(set(re.findall(r'https://static\.wixstatic\.com/media/[^"\') ]+', s)))
for i, u in enumerate(urls):
    clean = html.unescape(u)
    b, ct = get(clean, accept="image/jpeg,image/png,image/*;q=0.8")
    mime = ct.split(";")[0] or "image/jpeg"
    ext = mimetypes.guess_extension(mime) or ".jpg"
    open(os.path.join("offline-assets", "wix-%02d%s" % (i, ext)), "wb").write(b)
    if any(k in u for k in ("cb324400bc33", "dad9105170", "c22336652ab7", "2f76f53cf2bb", "c979697e7470")):   # page banners: original photos, no grade                        # the Home hero (turf START photo) stays original: it looked better
        s = s.replace(u, data_uri(b, mime))
    else:
        s = s.replace(u, data_uri(grade_bytes(b), "image/jpeg" if GRADE else mime))
print("wix photos:", len(urls))

# ---- 3. local images ----
def inline_local(match):
    q, path = match.group(1), match.group(2)
    if path.startswith(("data:", "http", "#")) or not os.path.exists(path):
        return match.group(0)
    mime = mimetypes.guess_type(path)[0] or "image/jpeg"
    raw = open(path, "rb").read()
    if path.lower().endswith((".jpg", ".jpeg")) and not path.startswith(("hero-full", "gallery-")) and not path.endswith("-banner.jpg"):      # photos get the grade; logo, QR and app screens do not
        raw, mime = grade_bytes(raw), "image/jpeg"
    return "src=%s%s%s" % (q, data_uri(raw, mime), q)
s = re.sub(r'src=(["\'])([^"\']+\.(?:jpg|jpeg|png|webp|gif))\1', inline_local, s)

# ---- 4. map -> static card ----
iframe = re.search(r'<div class="map"><iframe.*?</iframe></div>', s, re.S)
assert iframe
import base64 as _b64
_map = _b64.b64encode(open("map-static.jpg", "rb").read()).decode()
card = ('<div class="map" style="position:relative;overflow:hidden;min-height:300px;background:#e8e6e2">'
        '<a href="https://www.google.com/maps/search/?api=1&amp;query=MyGym%20London%2C%20Main%20Avenue%2C%20Bush%20Hill%20Park%2C%20Enfield%20EN1%201DS" target="_blank" rel="noopener" aria-label="Open MyGym London in Google Maps" style="display:block;height:100%">'
        '<img src="data:image/jpeg;base64,' + _map + '" alt="Map showing MyGym London on Main Avenue, Bush Hill Park, Enfield" style="width:100%;height:100%;min-height:300px;object-fit:cover;display:block"></a>'
        '<a href="https://www.google.com/maps/search/?api=1&amp;query=MyGym%20London%2C%20Main%20Avenue%2C%20Bush%20Hill%20Park%2C%20Enfield%20EN1%201DS" target="_blank" rel="noopener" class="btn sm" style="position:absolute;left:14px;top:14px">Open in Google Maps</a></div>')
s = s.replace(iframe.group(0), card)

s = s.replace("<title>MyGym London – Website Design B (White)</title>", "<title>MyGym London – Website Design (offline copy)</title>")
open("site-offline.html", "w", encoding="utf-8").write(s)
rest = re.findall(r'(?:src|href)=["\'](https?://[^"\']+)', s)
print("size MB:", round(len(s) / 1e6, 2))
print("remaining external refs:", sorted(set(re.sub(r"(https?://[^/]+).*", r"\1", r) for r in rest)))
