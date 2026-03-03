"""
用 food_images 下已有图片（如 000001.jpg, 000011.jpg）直接生成 UPDATE menu_items 的 SQL，
不复制文件，数据库里存 /api/images/000001.jpg 等，后端从 food_images 目录提供。
用法：
  1. 先运行 download_food_images.py 下载约 100 张图到 food_images
  2. 本脚本：python assign_menu_images.py [数量，默认66]
  3. 执行 tool/menu_image_updates.sql
"""
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
FOOD_IMAGES = ROOT_DIR / "food_images"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

def main():
    n = 66
    if len(sys.argv) > 1:
        try:
            n = int(sys.argv[1])
        except ValueError:
            n = 66

    if not FOOD_IMAGES.is_dir():
        print(f"NOT FOUND: {FOOD_IMAGES}, run download_food_images.py first.")
        sys.exit(1)

    # 根目录下图片按文件名排序（000001.jpg, 000002.jpg, ...），取前 n 个
    files = sorted(
        [f for f in FOOD_IMAGES.iterdir() if f.is_file() and f.suffix.lower() in IMAGE_EXTS],
        key=lambda p: p.name,
    )[:n]

    if not files:
        print(f"No images in {FOOD_IMAGES}. Run download_food_images.py first.")
        sys.exit(1)

    if len(files) < n:
        print(f"WARN: only {len(files)} images, requested {n}.")

    # 菜单 id 1 -> 第 1 张图(000001.jpg)，id 2 -> 第 2 张...；URL 用原名 /api/images/000001.jpg
    pairs = [(i, f.name) for i, f in enumerate(files, start=1)]

    print(f"Using {len(pairs)} images from {FOOD_IMAGES} (e.g. {files[0].name})")

    lines = [
        "-- UPDATE menu_items.image_url -> /api/images/000001.jpg etc. (run in MySQL)",
        "",
    ]
    for menu_id, filename in pairs:
        lines.append(f"UPDATE menu_items SET image_url = '/api/images/{filename}' WHERE id = {menu_id};")
    lines.append("")
    sql_text = "\n".join(lines)

    out_file = ROOT_DIR / "tool" / "menu_image_updates.sql"
    out_file.write_text(sql_text, encoding="utf-8")
    print(f"SQL written to: {out_file}")

    print()
    print(sql_text)

if __name__ == "__main__":
    main()
