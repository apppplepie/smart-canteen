-- 为需要图片的表添加 image_url 字段
-- 若某列已存在会报错，请注释掉对应 ALTER 再执行。

-- 1. 用户头像
ALTER TABLE `users`
  ADD COLUMN `image_url` VARCHAR(512) DEFAULT NULL COMMENT '头像URL' AFTER `role`;

-- 2. 商家/窗口封面
ALTER TABLE `vendors`
  ADD COLUMN `image_url` VARCHAR(512) DEFAULT NULL AFTER `contact_info`;

-- 3. 菜品主图
ALTER TABLE `menu_items`
  ADD COLUMN `image_url` VARCHAR(512) DEFAULT NULL AFTER `carbs`;

-- 4. 帖子主图
ALTER TABLE `posts`
  ADD COLUMN `image_url` VARCHAR(512) DEFAULT NULL COMMENT '图片URL' AFTER `content`;

-- 5. 检测报告封面/缩略图
ALTER TABLE `test_reports`
  ADD COLUMN `image_url` VARCHAR(512) DEFAULT NULL COMMENT '报告封面/缩略图URL' AFTER `report_url`;
