#!/usr/bin/env python3
"""v4-test レベルカード描画 (Pillow). 引数JSONを stdin から受け取り PNG を stdout へ返す.
失敗時は非ゼロ終了し、呼び出し側 (TS) は Embed のみにフォールバックする。
デザイン: 淡色グラスカード (AGO の v3 モック準拠)。"""
import io
import json
import sys
import urllib.request

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1000, 360


def load_font(size, bold=True):
    candidates = [
        "/home/luna/BOT/font.ttf",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()


def fetch_avatar(url, size=220):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "v4-test-levelcard"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            raw = resp.read()
        img = Image.open(io.BytesIO(raw)).convert("RGBA")
    except Exception:
        img = Image.new("RGBA", (size, size), (148, 163, 184, 255))
    img = img.resize((size, size))
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse((0, 0, size, size), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def rounded(draw_img, box, radius, fill):
    d = ImageDraw.Draw(draw_img)
    d.rounded_rectangle(box, radius=radius, fill=fill)


def main():
    p = json.load(sys.stdin)
    name = str(p.get("name", "user"))[:24]
    level = int(p.get("level", 1))
    current = int(p.get("current", 0))
    nxt = max(1, int(p.get("next", 50)))
    total = int(p.get("total", 0))
    server_rank = int(p.get("serverRank", 0))
    global_rank = int(p.get("globalRank", 0))
    avatar_url = str(p.get("avatarUrl", ""))

    # 背景: 淡いグラデーション + ぼかした色玉
    bg = Image.new("RGBA", (W, H), (224, 231, 255, 255))
    grad = Image.linear_gradient("L").resize((W, H)).rotate(0)
    tint = Image.new("RGBA", (W, H), (186, 230, 253, 255))
    bg = Image.composite(tint, bg, grad.point(lambda v: v // 3))
    deco = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dd = ImageDraw.Draw(deco)
    dd.ellipse((700, -120, 1120, 300), fill=(167, 243, 208, 160))
    dd.ellipse((-120, 180, 260, 520), fill=(253, 224, 171, 140))
    dd.ellipse((420, 220, 760, 520), fill=(199, 210, 254, 120))
    bg.alpha_composite(deco.filter(ImageFilter.GaussianBlur(40)))

    # グラスパネル
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rounded(shadow, (36, 40, W - 36, H - 36), 36, (100, 116, 139, 90))
    bg.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(14)))
    panel = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rounded(panel, (28, 30, W - 28, H - 30), 36, (255, 255, 255, 150))
    pd = ImageDraw.Draw(panel)
    pd.rounded_rectangle((28, 30, W - 28, H - 30), radius=36, outline=(255, 255, 255, 200), width=2)
    bg.alpha_composite(panel)

    d = ImageDraw.Draw(bg)

    # アバター
    avatar = fetch_avatar(avatar_url)
    bg.alpha_composite(avatar, (64, 70))
    d.ellipse((64, 70, 284, 290), outline=(255, 255, 255, 230), width=4)

    ink = (30, 41, 59, 255)
    sub = (100, 116, 139, 255)
    accent = (16, 185, 129, 255)

    d.text((330, 58), name, font=load_font(42), fill=ink)
    d.text((330, 116), f"Lv.{level}", font=load_font(58), fill=ink)

    # 進捗バー
    bx0, by0, bx1, by1 = 330, 206, 936, 242
    d.rounded_rectangle((bx0, by0, bx1, by1), radius=18, fill=(226, 232, 240, 220))
    ratio = min(1.0, current / nxt)
    if ratio > 0:
        fx1 = bx0 + int((bx1 - bx0) * ratio)
        d.rounded_rectangle((bx0, by0, max(fx1, bx0 + 36), by1), radius=18, fill=accent)
    d.text((330, 254), f"{current} / {nxt} EXP", font=load_font(27), fill=sub)

    stats = f"総EXP {total}    サーバー内 {server_rank}位    全体 {global_rank}位"
    d.text((330, 294), stats, font=load_font(24), fill=sub)

    out = io.BytesIO()
    bg.convert("RGB").save(out, format="PNG")
    sys.stdout.buffer.write(out.getvalue())


if __name__ == "__main__":
    main()
