"""PWA 아이콘 생성 — 청록 배경 + '빈' 한글 중앙."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public"

BG = (77, 142, 255, 255)  # primary-container #4d8eff
FG = (255, 255, 255, 255)
CHAR = "빈"

FONT_CANDIDATES = [
    "C:/Windows/Fonts/malgunbd.ttf",
    "C:/Windows/Fonts/malgun.ttf",
]


def get_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    raise RuntimeError(f"Korean font not found: {FONT_CANDIDATES}")


def make_icon(size: int, radius_ratio: float = 0.22) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = int(size * radius_ratio)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=BG)
    font = get_font(int(size * 0.6))
    bbox = font.getbbox(CHAR)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1]
    draw.text((x, y), CHAR, font=font, fill=FG)
    return img


def make_maskable(size: int) -> Image.Image:
    """maskable: full-bleed square background (safe zone = center 80%)."""
    img = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(img)
    font = get_font(int(size * 0.44))
    bbox = font.getbbox(CHAR)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1]
    draw.text((x, y), CHAR, font=font, fill=FG)
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    make_icon(192).save(OUT / "pwa-192.png")
    make_icon(512).save(OUT / "pwa-512.png")
    make_icon(180).save(OUT / "apple-touch-icon.png")
    make_maskable(512).save(OUT / "pwa-maskable-512.png")
    make_icon(32).save(OUT / "favicon-32.png")
    print(f"생성 완료: {OUT}")


if __name__ == "__main__":
    main()
