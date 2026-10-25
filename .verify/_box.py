"""_box — the statistics of one rectangle of a PNG (pure stdlib, reuses _crop.decode).

A frame is judged by the owner in one glance, but a fix needs a number that can fail. This prints
the four numbers that have decided every "this looks flat / this looks like a hole" argument in
this repo: mean luminance, luminance sd, how many distinct colours, and what fraction of the box
is darker than the box's own 20th percentile (a "hole") or brighter than its 90th (a blow-out).
    python3 .verify/_box.py SRC X0 Y0 W H [LABEL]
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _crop


def stats(src, x0, y0, cw, ch):
    w, h, bpp, px = _crop.decode(src)
    x1, y1 = min(x0 + cw, w), min(y0 + ch, h)
    lum, cols = [], set()
    for y in range(y0, y1):
        for x in range(x0, x1):
            k = (y * w + x) * bpp
            r, g, b = px[k], px[k + 1], px[k + 2]
            cols.add((r >> 3, g >> 3, b >> 3))
            lum.append(0.2126 * r + 0.7152 * g + 0.0722 * b)
    n = len(lum)
    if not n:
        return None
    mean = sum(lum) / n
    sd = (sum((v - mean) ** 2 for v in lum) / n) ** 0.5
    s = sorted(lum)
    return {"px": n, "mean": round(mean, 1), "sd": round(sd, 1), "colours": len(cols),
            "p20": round(s[n // 5], 1), "p90": round(s[n * 9 // 10], 1),
            "dark": round(sum(1 for v in s if v < s[n // 5]) / n, 3),
            "bright": round(sum(1 for v in s if v > s[n * 9 // 10]) / n, 3)}


if __name__ == "__main__":
    a = sys.argv[1:]
    r = stats(a[0], *(int(v) for v in a[1:5]))
    print((a[5] if len(a) > 5 else a[0]), r)
