#!/usr/bin/env python3
"""Generate the header avatar from the doctor's portrait.

    python3 tools/make-photo.py

Writes img/avatar-96.* and img/avatar-192.*. The face sits in the upper
third of the portrait, so the crop is anchored there rather than centred.
"""

import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PROTO = os.path.join(HERE, "..")
IMG = os.path.join(PROTO, "img")
SOURCE = os.path.join(PROTO, "img", "doctor-480.webp")

# Square window around the head, measured on the 480x600 derivative.
#
# The header shows the avatar at 38px, where anything smaller than a clear
# head-and-shoulders reads as a smudge. This window keeps the whole head
# with even margins — the same framing the reference portrait uses.
#
#   head spans x 127..332, y 66..366 in the 480x600 derivative
FACE_BOX = (30, 46, 430, 446)


def main():
    with Image.open(SOURCE) as im:
        im = im.convert("RGB")
        face = im.crop(FACE_BOX)

        print(f"  وجه: {face.size[0]}x{face.size[1]} من {im.size[0]}x{im.size[1]}")

        for size in (96, 192):
            frame = face.resize((size, size), Image.LANCZOS)

            webp = os.path.join(IMG, f"avatar-{size}.webp")
            frame.save(webp, "WEBP", quality=86, method=6)

            jpg = os.path.join(IMG, f"avatar-{size}.jpg")
            frame.save(jpg, "JPEG", quality=88, optimize=True, progressive=True)

            print(
                f"  avatar-{size:<4} {size}x{size}  "
                f"webp {os.path.getsize(webp) / 1024:.1f} KB   "
                f"jpg {os.path.getsize(jpg) / 1024:.1f} KB"
            )

    print("Done.")


if __name__ == "__main__":
    main()
