#!/usr/bin/env python3
"""Generate PWA icons (no external deps) for RetroScaffale.

Draws a stylised game cartridge on a deep-indigo field. Emits a normal icon
and a maskable variant (extra padding for the safe zone) at 192 and 512 px.
"""
import os
import struct
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "icons")

# Palette — light "clean arcade"
BG = (243, 243, 239)       # soft paper field
CART = (239, 83, 80)       # coral cartridge body
CART_DK = (208, 64, 62)    # cartridge shadow
LABEL = (23, 162, 166)     # teal label
LABEL_DK = (18, 130, 133)  # label edge
CREAM = (247, 244, 236)    # highlight stripe


def blend(dst, src, a):
    return tuple(int(dst[i] * (1 - a) + src[i] * a) for i in range(3))


class Canvas:
    def __init__(self, n, bg):
        self.n = n
        self.px = [list(bg) for _ in range(n * n)]

    def set(self, x, y, color, a=1.0):
        if 0 <= x < self.n and 0 <= y < self.n:
            i = y * self.n + x
            if a >= 1.0:
                self.px[i] = list(color)
            else:
                self.px[i] = list(blend(self.px[i], color, a))

    def rrect(self, x0, y0, x1, y1, r, color):
        for y in range(int(y0), int(y1)):
            for x in range(int(x0), int(x1)):
                cx = min(max(x, x0 + r), x1 - r)
                cy = min(max(y, y0 + r), y1 - r)
                dx, dy = x + 0.5 - cx, y + 0.5 - cy
                d = (dx * dx + dy * dy) ** 0.5
                if d <= r:
                    a = 1.0 if d <= r - 1 else (r - d)
                    self.set(x, y, color, max(0.0, min(1.0, a)))

    def png(self, path):
        n = self.n
        raw = bytearray()
        for y in range(n):
            raw.append(0)
            for x in range(n):
                raw.extend(self.px[y * n + x])
                raw.append(255)

        def chunk(tag, data):
            c = struct.pack(">I", len(data)) + tag + data
            c += struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
            return c

        sig = b"\x89PNG\r\n\x1a\n"
        ihdr = struct.pack(">IIBBBBB", n, n, 8, 6, 0, 0, 0)
        idat = zlib.compress(bytes(raw), 9)
        with open(path, "wb") as f:
            f.write(sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b""))


def draw(n, pad_frac):
    c = Canvas(n, BG)
    pad = n * pad_frac
    inner = n - 2 * pad
    # cartridge body
    bx0 = pad + inner * 0.16
    bx1 = pad + inner * 0.84
    by0 = pad + inner * 0.10
    by1 = pad + inner * 0.90
    r = inner * 0.07
    # subtle shadow
    c.rrect(bx0 + inner * 0.03, by0 + inner * 0.04, bx1 + inner * 0.03,
            by1 + inner * 0.02, r, CART_DK)
    c.rrect(bx0, by0, bx1, by1, r, CART)
    # top-right notch (angled corner feel via a dark cut)
    notch = inner * 0.16
    for y in range(int(by0), int(by0 + notch)):
        for x in range(int(bx1 - notch), int(bx1)):
            if (x - (bx1 - notch)) + (by0 + notch - y) > notch:
                c.set(x, y, BG)
    # label
    lx0 = bx0 + inner * 0.10
    lx1 = bx1 - inner * 0.10
    ly0 = by0 + inner * 0.14
    ly1 = by0 + inner * 0.44
    c.rrect(lx0 - 1, ly0 - 1, lx1 + 1, ly1 + 1, r * 0.6, LABEL_DK)
    c.rrect(lx0, ly0, lx1, ly1, r * 0.6, LABEL)
    # label stripe
    c.rrect(lx0, ly0 + (ly1 - ly0) * 0.62, lx1, ly0 + (ly1 - ly0) * 0.82,
            r * 0.3, CREAM)
    # contact grooves near bottom
    gy = by1 - inner * 0.20
    for k in range(4):
        gx0 = bx0 + inner * 0.12 + k * inner * 0.16
        c.rrect(gx0, gy, gx0 + inner * 0.10, gy + inner * 0.10, r * 0.3, CART_DK)
    return c


os.makedirs(OUT, exist_ok=True)
for size in (192, 512):
    draw(size, 0.06).png(os.path.join(OUT, f"icon-{size}.png"))
    draw(size, 0.18).png(os.path.join(OUT, f"maskable-{size}.png"))
print("icons written to", OUT)
