# 图片统一目录与链接映射

## 目录结构（项目根下）

```
images/
  food/         # 菜品图，供 menu_items 使用
  commodity/    # 日用品图，供商品/寻物等使用
```

## 链接映射规则

| 用途       | 数据库 image_url 示例              | 磁盘文件路径               |
|------------|------------------------------------|----------------------------|
| 菜品       | `/api/images/food/000001.jpg`      | `images/food/000001.jpg`   |
| 日用品/商品| `/api/images/commodity/xxx.jpg`    | `images/commodity/xxx.jpg` |

- 后端用 **一个** 根目录（`scs.images-dir`，默认 `../images`）映射 `/api/images/**`。
- 请求 `/api/images/food/000001.jpg` → 实际读文件 `images/food/000001.jpg`。
- 前端：`baseURL + image_url` 即完整 URL，无需改代码。

## 脚本

- **download_food_images.py**：下载到 `images/food`，再运行 `assign_menu_images.py` 生成 SQL。
- **download_commodity_images.py**：下载到 `images/commodity`；若某表需要商品图，在业务里把 `image_url` 设为 `/api/images/commodity/文件名` 即可。

## 已有数据迁移

若之前用的是 `food_images/` 和 `/api/images/000001.jpg`：

1. 把原 `food_images/` 里的文件挪到 `images/food/`。
2. 执行新的 `menu_image_updates.sql`（或重新运行 `assign_menu_images.py` 再执行生成的 SQL），把库里的 URL 改为 `/api/images/food/xxx.jpg`。
3. 后端配置（可选）：`scs.images-dir=../images`（已是默认）。
