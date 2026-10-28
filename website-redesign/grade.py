"""MyGym London photo grade: one consistent look for every photo on the site.

Brand palette: white, near-black #17171a, red #e03939.
What it does:
  - turf greens/yellows and blues are calmed so they stop fighting the red and black
  - reds and magentas get a little more depth so the red wall and plates match the brand red
  - shadows settle into the brand near-black (slightly cool), highlights stay clean warm white
  - a gentle S-curve adds contrast
Run with a Python that has Pillow and numpy.
"""
import io
import numpy as np
from PIL import Image


def _smooth(h, centre, half_width):
    """1 at `centre` (hue, degrees), fading to 0 at `half_width` away. Handles the wrap-around at 360."""
    d = np.abs((h - centre + 180.0) % 360.0 - 180.0)
    return np.clip(1.0 - d / half_width, 0.0, 1.0) ** 0.8


def grade_array(rgb):
    x = rgb.astype(np.float32) / 255.0
    hsv = np.array(Image.fromarray(rgb).convert("HSV")).astype(np.float32)
    h = hsv[..., 0] * 360.0 / 255.0
    s = hsv[..., 1] / 255.0
    v = hsv[..., 2] / 255.0

    green = np.maximum(_smooth(h, 95, 55), _smooth(h, 60, 30))     # yellow-green, turf
    blue = _smooth(h, 215, 50)                                     # blue balls, sky, mats
    red = np.maximum(_smooth(h, 355, 28), _smooth(h, 8, 22))       # brand reds
    purple = _smooth(h, 288, 42)                                   # stray purples (stock gym renders)
    s = s * (1 - 0.50 * green) * (1 - 0.40 * blue) * (1 - 0.72 * purple)
    s = s * (1 + 0.14 * red)
    v = v * (1 - 0.10 * green) * (1 - 0.06 * blue)
    s = np.clip(s * 0.96, 0, 1)

    hsv2 = np.stack([hsv[..., 0], s * 255.0, np.clip(v, 0, 1) * 255.0], axis=-1).astype(np.uint8)
    x = np.array(Image.fromarray(hsv2, "HSV").convert("RGB")).astype(np.float32) / 255.0

    # S-curve (smoothstep blend) for contrast
    c = x * x * (3 - 2 * x)
    x = x * 0.62 + c * 0.38

    # split tone: shadows toward brand near-black (cool), highlights toward clean warm white
    lum = (0.299 * x[..., 0] + 0.587 * x[..., 1] + 0.114 * x[..., 2])[..., None]
    shadow = np.clip(1 - lum * 2.2, 0, 1)
    high = np.clip((lum - 0.55) * 2.2, 0, 1)
    shadow_col = np.array([0.075, 0.075, 0.095], dtype=np.float32)   # #131318
    high_col = np.array([1.0, 0.985, 0.96], dtype=np.float32)
    x = x * (1 - 0.18 * shadow) + shadow_col * (0.18 * shadow)
    x = x * (1 - 0.10 * high) + x * high_col * (0.10 * high)

    # lift the very darkest values a touch so blacks are rich, not crushed
    x = np.clip(x, 0, 1) * 0.97 + 0.012
    return (np.clip(x, 0, 1) * 255.0 + 0.5).astype(np.uint8)


def grade_image(im):
    im = im.convert("RGB")
    return Image.fromarray(grade_array(np.array(im)), "RGB")


def grade_bytes(data, quality=86):
    """bytes of any image in -> graded JPEG bytes out"""
    im = Image.open(io.BytesIO(data))
    out = io.BytesIO()
    grade_image(im).save(out, "JPEG", quality=quality, optimize=True, progressive=True)
    return out.getvalue()


if __name__ == "__main__":
    import sys
    for p in sys.argv[1:]:
        im = Image.open(p)
        grade_image(im).save(p.rsplit(".", 1)[0] + "-graded.jpg", quality=88)
