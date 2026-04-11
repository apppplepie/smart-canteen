-- 补齐 post_vector_index（旧库升级用；全新库若仅用 scs.sql 全量初始化则已包含此表）
-- 在服务器执行示例：mysql -h127.0.0.1 -uscs -p scs < patch_post_vector_index.sql

CREATE TABLE IF NOT EXISTS `post_vector_index` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `post_id` bigint NOT NULL,
  `source_text` text NULL,
  `embedding_json` longtext NULL,
  `model_name` varchar(64) DEFAULT 'demo-hash-embedding-v1',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_post_vector_post_id` (`post_id`),
  CONSTRAINT `fk_post_vector_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='帖子向量索引';
