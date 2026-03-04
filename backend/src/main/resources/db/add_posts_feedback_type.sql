-- 为 posts 表增加「问题类型」字段（已有表时执行一次）
ALTER TABLE `posts`
  ADD COLUMN `feedback_type` varchar(32) NULL DEFAULT 'other' COMMENT 'food=菜品建议, service=服务态度, env=环境卫生, other=其他' AFTER `title`;
