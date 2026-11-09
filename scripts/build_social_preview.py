#!/usr/bin/env python3
"""Build a dedicated WhatsApp / Open Graph preview from the original Nadi mascot.

The mascot is NEVER regenerated: the transparent PNG from the Nadi application
is composited directly, at a smaller displayed size, onto a 1200x630 canvas.
"""
from pathlib import Path
from math import hypot
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "nadi-mascot-neutral.png"
DEST = ROOT / "assets" / "nadi-og-preview.jpg"
W, H = 1200, 630

def font(size, bold=False):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold
        else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    for name in candidates:
        if Path(name).exists():
            return ImageFont.truetype(name, size)
    raise RuntimeError("No supported TrueType font found on runner")

# Dark navy background and a subtle BLUE ONLY radial light behind the mascot.
pixels = bytearray(W * H * 3)
for y in range(H):
    for x in range(W):
        dx = (x - 294) / 470
        dy = (y - 314) / 390
        halo = max(0.0, 1.0 - (dx*dx + dy*dy)**0.5)
        bloom = 0.17 * halo**2
        r = int(5 + 28*bloom)
        g = int(8 + 93*bloom)
        b = int(19 + 188*bloom)
        i = (y*W+x)*3
        pixels[i:i+3] = bytes((r,g,b))
card = Image.frombytes("RGB", (W,H), bytes(pixels))
card = card.convert("RGBA")

# The original 512px source is alpha-cropped and DOWNSAMPLED, not upscaled.
mascot = Image.open(SOURCE).convert("RGBA")
alpha = mascot.getchannel("A")
bounds = alpha.getbbox()
if bounds is None:
    raise RuntimeError("Mascot has no opaque pixels")
mascot = mascot.crop(bounds)
mascot.thumbnail((490, 445), Image.Resampling.LANCZOS)
x = 302 - mascot.width//2
y = 310 - mascot.height//2
card.alpha_composite(mascot, (x,y))

draw = ImageDraw.Draw(card)
title = font(98, bold=True)
description = font(38, bold=True)
support = font(23)
muted = (173, 194, 221, 255)

draw.text((600, 156), "Nadi", font=title, fill=(248,251,255,255), stroke_width=0)
draw.rounded_rectangle((603, 282, 650, 287), radius=2, fill=(79,164,255,255))
draw.text((600, 319), "The adaptive notch", font=description, fill=(236,244,255,255))
draw.text((600, 371), "for Windows.", font=description, fill=(236,244,255,255))
draw.text((604, 480), "WINDOWS 10 & 11  ·  COMING SOON", font=support, fill=muted)

# High-quality, progressive JPEG: predictable WhatsApp crawler compatibility.
card.convert("RGB").save(DEST, "JPEG", quality=90, subsampling=0,
                         optimize=True, progressive=True)
size = DEST.stat().st_size
if size >= 600_000:
    card.convert("RGB").save(DEST, "JPEG", quality=84, subsampling=0,
                             optimize=True, progressive=True)
    size = DEST.stat().st_size
if size >= 600_000:
    raise RuntimeError(f"Open Graph preview too large for WhatsApp: {size}")
print(f"Generated {DEST.relative_to(ROOT)}: {W}x{H}, {size} bytes")
