#!/usr/bin/env python3
"""Optimise the doctor's portrait for the hero.

The source upload is a landscape press photo — far too heavy for a phone
on 3G, and framed for a website banner rather than a portrait badge.
This crops it to the 4:5 window the hero uses, then writes two responsive
derivatives in WebP and JPEG.

    python3 tools/make-photo.py [source.jpg]

Defaults to the portrait at the repository root.
"""

import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "img")
DEFAULT_SRC = os.path.join(HERE, "..", "..", "..", "الاستاذ-دكتور-أسامة-شعير-أستاذ-الذكورة.jpg")

WIDTHS = (240, 480)

# Portrait window inside the source photo, measured on the 880x608 original.
#
# The source is a landscape press shot with the subject centred. The hero
# renders the picture in a 4:5 frame anchored on the upper third, so the
# crop is pre-cut to that same ratio — the browser then has nothing left to
# trim and the face always lands in the same place.
#
#   head spans x 405..575, y 95..345
#   crop x 300..697 puts the head at 26%..69% of the width
#   crop y  40..536 puts the head at 11%..61% of the height
CROP = (300, 40, 697, 536)


def main():
    src_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
    if not os.path.exists(src_path):
        raise SystemExit(f"الصورة مش موجودة: {src_path}")

    os.makedirs(OUT, exist_ok=True)

    with Image.open(src_path) as im:
        # Flatten any transparency onto the page ivory so JPEG has no black
        # where the alpha channel was.
        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA")
            flat = Image.new("RGB", im.size, (250, 247, 242))
            flat.paste(im, mask=im.split()[-1])
            im = flat
        else:
            im = im.convert("RGB")

        print(f"  المصدر: {im.size[0]}x{im.size[1]}  {os.path.getsize(src_path) / 1024:.0f} KB")

        cropped = im.crop(CROP)
        print(f"  القص: {cropped.size[0]}x{cropped.size[1]}")

        for width in WIDTHS:
            height = round(cropped.height * width / cropped.width)
            frame = cropped.resize((width, height), Image.LANCZOS)

            jpg = os.path.join(OUT, f"doctor-{width}.jpg")
            frame.save(jpg, "JPEG", quality=82, optimize=True, progressive=True)

            webp = os.path.join(OUT, f"doctor-{width}.webp")
            frame.save(webp, "WEBP", quality=80, method=6)

            print(
                f"  doctor-{width}  {width}x{height}  "
                f"jpg {os.path.getsize(jpg) / 1024:.1f} KB   "
                f"webp {os.path.getsize(webp) / 1024:.1f} KB"
            )

    print("Done.")


if __name__ == "__main__":
    main()
