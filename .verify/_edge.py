"""_edge -- the height of a coloured band's top edge, column by column, and how rough it is.

The argument this settles: "the tree line is a straight rule across the sky". A line can look
straight to a reader and be 2 px rough; the number that matters is the standard deviation of the
first row that is the band's colour, and the number of distinct steps in it. A ruled edge is sd < 2
and one or two steps; a tree line of 7-9 m trees at 200 m is sd > 4 with a step every few columns.
    python3 .verify/_edge.py SRC X0 X1 Y0 Y1 [LABEL]   # band = green- dominant, not sky
"""
import sys, os, statistics
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _crop


def top_edge(src, x0, x1, y0, y1):
    w, h, bpp, px = _crop.decode(src)
    ys = []
    for x in range(x0, min(x1, w)):
        for y in range(y0, min(y1, h)):
            k = (y * w + x) * bpp
            r, g, b = px[k], px[k + 1], px[k + 2]
            if g > r + 6 and g > b + 6 and g < 150:
                ys.append(y)
                break
    if len(ys) < 8:
        return None
    steps = sum(1 for a, b in zip(ys, ys[1:]) if abs(a - b) >= 2)
    return {"cols": len(ys), "mean": round(statistics.mean(ys), 1),
            "sd": round(statistics.pstdev(ys), 2), "range": max(ys) - min(ys), "steps": steps}


if __name__ == "__main__":
    a = sys.argv[1:]
    x0, x1, y0, y1 = (int(v) for v in a[1:5])
    print((a[5] if len(a) > 5 else a[0]), top_edge(a[0], x0, x1, y0, y1))
