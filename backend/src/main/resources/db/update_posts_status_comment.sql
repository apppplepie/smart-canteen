-- 更新 posts.status 注释：支持 pending / ai_replied / replied（已有表执行一次）
ALTER TABLE `posts` MODIFY COLUMN `status` varchar(32) NULL DEFAULT 'pending'
  COMMENT '流程: pending=都未回复, ai_replied=AI已建议待官方回复, replied=官方已回复';
