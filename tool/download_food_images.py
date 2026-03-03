"""
使用 icrawler 从 Bing 下载美食图片到项目根目录下的 food_images 文件夹。
可替换 BingImageCrawler 为 GoogleImageCrawler、BaiduImageCrawler 等。
"""
from pathlib import Path

from icrawler.builtin import BingImageCrawler

# 项目根目录（当前脚本在 tool/ 下，上级即根目录）
ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT_DIR / "food_images"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def main():
    crawler = BingImageCrawler(
        downloader_threads=4,
        storage={"root_dir": str(OUTPUT_DIR)},
    )
    crawler.crawl(
        keyword="美食",
        max_num=100,
    )
    print(f"图片已保存到: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
