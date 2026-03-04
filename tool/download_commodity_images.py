"""
使用 icrawler 从 Bing 下载日用品图片到统一目录 images/commodity。
若某表需要商品图，DB 存 /api/images/commodity/xxx.jpg，后端从 images 根目录提供。
"""
from pathlib import Path

from icrawler.builtin import BingImageCrawler

ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT_DIR / "images" / "commodity"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def main():
    crawler = BingImageCrawler(
        downloader_threads=4,
        storage={"root_dir": str(OUTPUT_DIR)},
    )
    crawler.crawl(
        keyword="日常用品",
        max_num=50,
    )
    print(f"图片已保存到: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
