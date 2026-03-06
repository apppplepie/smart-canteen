# 商店评分与食堂圈数据设计说明

## 一、当前 `posts` 表是啥？

**`posts` 表目前混用了两种业务：**

| 用途     | 谁在用           | 特征 |
|----------|------------------|------|
| **反馈** | FeedbackPage、大屏 Feedback | 有 `feedback_type`（food/service/env/other），有 `status` / `reply_content` / `ai_suggestion`，走「反馈→AI建议→官方回复」流程。 |
| **食堂圈动态** | PublishPage 发布、DynamicsTab 展示 | 当前也是写进 `posts`，但**没有** `feedback_type` 或当普通帖子用；DynamicsTab 用 `listPosts()` 会**把反馈和动态混在一起**。 |

所以：**post = 不完全是“反馈”**，表里既有“反馈”又有“食堂圈”的帖子，需要从业务上拆开。

---

## 二、建议：单独一张「商店评分」表

你的需求可以概括为：

- **商店评分**：用户对某次订单/某商家打分（1–5 星），**可以只有评分，也可以带评论**。
- **有评论时**：这条评分除了落库，还要在「食堂圈」里发一条帖子（DynamicsTab 展示）。
- **反馈**：保持现有逻辑，继续用 `posts`（或以后迁到单独 `feedback` 表）。

因此建议：**新增一张「商店评分」表**，和 `posts` 分开；有评论时再往食堂圈（用 `posts` 或单独动态表）写一条。

---

## 三、新表建议：`vendor_reviews`（商店评分）

```sql
-- 商店评分表：用户对商家/订单的评分，评论可选；有评论时可同步到食堂圈
DROP TABLE IF EXISTS `vendor_reviews`;
CREATE TABLE `vendor_reviews` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '用户',
  `vendor_id` bigint NOT NULL COMMENT '商家',
  `order_id` bigint NULL DEFAULT NULL COMMENT '关联订单（可选）',
  `rating` tinyint NOT NULL COMMENT '1-5 星',
  `content` text NULL COMMENT '评论内容，为空则仅评分不发布到食堂圈',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_vendor_reviews_user` (`user_id`),
  INDEX `idx_vendor_reviews_vendor` (`vendor_id`),
  INDEX `idx_vendor_reviews_created` (`created_at` DESC),
  CONSTRAINT `fk_vendor_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_vendor_reviews_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_vendor_reviews_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='商店评分：仅评分或评分+评论；有评论时同步到食堂圈';
```

说明：

- **只有评分**：`content` 为空，只存 `vendor_reviews`，不往食堂圈发帖。
- **有评论**：存 `vendor_reviews`，且后端**再往食堂圈发一条帖子**（见下节）。

---

## 四、食堂圈与 `posts` 的区分方式（二选一）

要避免「反馈」和「食堂圈动态」混在一起，有两种做法。

### 方案 A：在现有 `posts` 表加 `post_type`（推荐，改表少）

- 在 `posts` 增加字段：`post_type` varchar(32) DEFAULT 'feedback'，取值：
  - `feedback`：反馈（FeedbackPage 创建，有 feedback_type / 官方回复等）。
  - `dynamics`：食堂圈动态（来自「带评论的商店评分」或以后其他动态）。
- **反馈**：创建时 `post_type = 'feedback'`，列表/详情只查 `post_type = 'feedback'`。
- **食堂圈**：DynamicsTab 只查 `post_type = 'dynamics'`；创建「带评论的评分」时，由后端写一条 `post_type = 'dynamics'` 的 post。

这样不需要再建一张“动态表”，只区分类型即可。

### 方案 B：食堂圈单独表 `dynamics_posts`

- 新建表 `dynamics_posts`（字段可和当前 post 类似：user_id, vendor_id, content, image_url, like_count, comment_count, created_at 等）。
- 有评论的评分：写 `vendor_reviews` + 写一条 `dynamics_posts`。
- DynamicsTab 只查 `dynamics_posts`；反馈继续用 `posts`。

你如果希望「食堂圈」和「反馈」在库上彻底分离，可以用方案 B；否则方案 A 更省事。

---

## 五、需要提供的接口清单

### 1. 商店评分（新表 `vendor_reviews`）

| 方法 | 路径 | 说明 |
|------|------|------|
| **POST** | `/api/vendor-reviews` | 提交一条评分。Body: `{ userId, vendorId, orderId?, rating, content? }`。若带 `content`，后端除写 `vendor_reviews` 外，再发一条食堂圈帖子（方案 A 写 `posts` 且 `post_type=dynamics`，方案 B 写 `dynamics_posts`）。 |
| **GET** | `/api/vendor-reviews/user/{userId}` | 某用户的评分列表（可选分页）。 |
| **GET** | `/api/vendor-reviews/vendor/{vendorId}` | 某商家的评分列表（用于商家页展示评分/评论，可选分页）。 |

### 2. 食堂圈（沿用现有 `posts` 时，需区分类型）

| 方法 | 路径 | 说明 |
|------|------|------|
| **GET** | `/api/posts?postType=dynamics` | 列表只返回 `post_type = 'dynamics'`，供 DynamicsTab 使用。若采用方案 B，则改为 GET `/api/dynamics-posts`。 |

现有：

- `GET /api/posts`：建议改为支持 query `postType`，或保留原样但文档约定「食堂圈只查 dynamics」。
- `GET /api/posts/user/{userId}`：反馈历史继续用；若需要「用户发的动态」可加 `postType=dynamics` 或单独接口。

### 3. 反馈（现有，不变）

| 方法 | 路径 | 说明 |
|------|------|------|
| **POST** | `/api/posts` | FeedbackPage 提交反馈：body 里带 `feedbackType`（及 title 等），后端写 `posts` 且 `post_type = 'feedback'`（或仅通过 feedback_type 区分）。 |
| **GET** | `/api/posts/user/{userId}` | 反馈历史：只查 `post_type = 'feedback'`（或 feedback_type 非空）。 |

---

## 六、前端需要配合的点（你加表/接口之后）

1. **PublishPage（发布动态）**
   - 改为调用 **POST `/api/vendor-reviews`**：传 `userId, vendorId, orderId?, rating, content`。
   - **仅评分、不写评论**：`content` 不传或空，只存评分，不发食堂圈。
   - **有评论**：传 `content`，后端存评分并发食堂圈一条（你按上面方案 A/B 实现即可）。

2. **DynamicsTab（食堂圈）**
   - 列表改为只拉「动态」：**GET `/api/posts?postType=dynamics`**（方案 A）或 **GET `/api/dynamics-posts`**（方案 B），不再用无条件的 `listPosts()`，避免把反馈刷进食堂圈。

3. **FeedbackPage**
   - 保持调用 **POST `/api/posts`** 且带 `feedbackType`；后端保证反馈只写 `post_type = 'feedback'` 或仅用 feedback_type 区分。

---

## 七、小结

| 项目 | 说明 |
|------|------|
| **posts 表** | 当前既存「反馈」又存「食堂圈」；建议加 `post_type`（feedback / dynamics）区分，或食堂圈迁到新表。 |
| **新表** | **`vendor_reviews`**：商店评分，必填 rating，可选 content；有 content 时由后端同步发一条食堂圈帖子。 |
| **新接口** | POST/GET vendor-reviews；GET 食堂圈列表按 `postType=dynamics` 或 dynamics_posts。 |
| **前端** | PublishPage 改调 vendor-reviews 并传 rating+可选 content；DynamicsTab 只请求动态列表。 |

你这边先加好 `vendor_reviews` 表和上面接口，需要的话我可以再按你选的方案（A 或 B）帮你对一下后端具体字段和前端请求示例。
