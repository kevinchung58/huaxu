"""_crop — cut a box out of a PNG (pure stdlib; the sandbox has no image libs).

Written because every review of the falls comes down to "look at this 500x300 region", and the
only viewer available in this environment is a file. Handles the two PNG kinds Chrome writes
(RGB and RGBA, 8-bit, non-interlaced); refuses anything else loudly rather than writing garbage.
    python3 .verify/_crop.py SRC OUT X0 Y0 W H
"""
import struct, sys, zlib


def decode(path):
    b = open(path, "rb").read()
    pos, idat, w, h, ct = 8, b"", 0, 0, 0
    while pos < len(b):
        ln = struct.unpack(">I", b[pos:pos + 4])[0]
        typ = b[pos + 4:pos + 8]
        data = b[pos + 8:pos + 8 + ln]
        if typ == b"IHDR":
            w, h, bd, ct = struct.unpack(">IIBB", data[:10])
            assert bd == 8 and ct in (2, 6), f"unsupported PNG: depth {bd}, colour type {ct}"
        if typ == b"IDAT":
            idat += data
        pos += 12 + ln
    raw = zlib.decompress(idat)
    bpp = 4 if ct == 6 else 3
    stride = w * bpp
    out = bytearray(w * h * bpp)
    prev = bytearray(stride)
    for y in range(h):
        f = raw[y * (stride + 1)]
        line = bytearray(raw[y * (stride + 1) + 1:(y + 1) * (stride + 1)])
        for i in range(stride):
            a = line[i - bpp] if i >= bpp else 0
            up = prev[i]
            upa = prev[i - bpp] if i >= bpp else 0
            v = line[i]
            if f == 1: v += a
            elif f == 2: v += up
            elif f == 3: v += (a + up) >> 1
            elif f == 4:
                q = a + up - upa
                pa, pb, pc = abs(q - a), abs(q - up), abs(q - upa)
                v += a if (pa <= pb and pa <= pc) else (up if pb <= pc else upa)
            line[i] = v & 255
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return w, h, bpp, out


def write(path, w, h, px):
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        raw += px[y * w * 3:(y + 1) * w * 3]

    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)

    open(path, "wb").write(b"\x89PNG\r\n\x1a\n"
                           + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
                           + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b""))


def crop(src, dst, x0, y0, cw, ch, scale=1):
    w, h, bpp, px = decode(src)
    x1, y1 = min(x0 + cw, w), min(y0 + ch, h)
    out = bytearray()
    for y in range(y0, y1):
        for x in range(x0, x1):
            k = (y * w + x) * bpp
            row = bytes((px[k], px[k + 1], px[k + 2])) * scale
            out += row * scale
    write(dst, (x1 - x0) * scale, (y1 - y0) * scale, out)
    return (x1 - x0) * scale, (y1 - y0) * scale


if __name__ == "__main__":
    a = sys.argv[1:]
    res = crop(a[0], a[1], *(int(v) for v in a[2:6]), scale=int(a[6]) if len(a) > 6 else 1)
    print("wrote", a[1], res)
