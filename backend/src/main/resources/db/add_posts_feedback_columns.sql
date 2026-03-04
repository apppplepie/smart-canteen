-- 已有 posts 表时单独执行，为留言墙/反馈页增加「已回复/待处理」及回复内容（仅执行一次）
ALTER TABLE `posts`
  ADD COLUMN `status` varchar(32) NULL DEFAULT 'pending' COMMENT 'pending=待处理, replied=已回复' AFTER `comment_count`,
  ADD COLUMN `reply_content` text NULL COMMENT '管理员回复内容' AFTER `status`;
