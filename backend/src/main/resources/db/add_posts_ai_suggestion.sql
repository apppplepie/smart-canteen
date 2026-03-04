-- 为 posts 表增加「AI建议」字段；status 语义为流程状态（pending=待处理, in_progress=处理中, replied=已回复）（已有表执行一次）
ALTER TABLE `posts`
  ADD COLUMN `ai_suggestion` text NULL COMMENT 'AI建议（预留，可为空）' AFTER `reply_content`;
