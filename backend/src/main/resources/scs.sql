/*
 Navicat Premium Data Transfer

 Source Server         : mysql
 Source Server Type    : MySQL
 Source Server Version : 80044 (8.0.44)
 Source Host           : localhost:3306
 Source Schema         : scs

 Target Server Type    : MySQL
 Target Server Version : 80044 (8.0.44)
 File Encoding         : 65001

 Date: 04/03/2026 14:59:29
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for agent_requests
-- ----------------------------
DROP TABLE IF EXISTS `agent_requests`;
CREATE TABLE `agent_requests`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NULL DEFAULT NULL,
  `prompt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `response` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `agent_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for ai_conversations
-- ----------------------------
DROP TABLE IF EXISTS `ai_conversations`;
CREATE TABLE `ai_conversations`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NULL DEFAULT NULL COMMENT '用户标识，未登录可空',
  `title` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '会话标题，如首条问题摘要',
  `context_summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '超过5轮时此前对话的摘要，约500字',
  `context_summary_message_count` int NULL DEFAULT NULL COMMENT '摘要所覆盖的消息条数',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_updated`(`user_id` ASC, `updated_at` DESC) USING BTREE,
  CONSTRAINT `fk_conversations_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'AI 对话会话' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for ai_messages
-- ----------------------------
DROP TABLE IF EXISTS `ai_messages`;
CREATE TABLE `ai_messages`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint NOT NULL COMMENT '所属会话',
  `role` enum('user','assistant','system','tool') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '正文；tool 时为执行结果',
  `tool_calls` json NULL COMMENT 'assistant 发起的 tool 调用列表',
  `tool_call_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'role=tool 时对应 tool_calls[].id',
  `suggestions` json NULL COMMENT '前端快捷建议 [\"xxx\",\"yyy\"]',
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_conversation_order`(`conversation_id` ASC, `sort_order` ASC) USING BTREE,
  INDEX `idx_conversation_created`(`conversation_id` ASC, `created_at` ASC) USING BTREE,
  CONSTRAINT `fk_msg_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 55 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'AI 对话消息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for audit_logs
-- ----------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actor_id` bigint NULL DEFAULT NULL,
  `action` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `object_type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `object_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `details` json NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for call_events
-- ----------------------------
DROP TABLE IF EXISTS `call_events`;
CREATE TABLE `call_events`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `queue_entry_id` bigint NULL DEFAULT NULL,
  `vendor_id` bigint NULL DEFAULT NULL,
  `event_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `queue_entry_id`(`queue_entry_id` ASC) USING BTREE,
  INDEX `vendor_id`(`vendor_id` ASC) USING BTREE,
  CONSTRAINT `call_events_ibfk_1` FOREIGN KEY (`queue_entry_id`) REFERENCES `queue_entries` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `call_events_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 70 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for menu_items
-- ----------------------------
DROP TABLE IF EXISTS `menu_items`;
CREATE TABLE `menu_items`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `vendor_id` bigint NOT NULL,
  `name` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `price` decimal(8, 2) NOT NULL DEFAULT 0.00,
  `image_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '菜品图片URL',
  `prep_time_seconds` int NULL DEFAULT 300,
  `calories` int NULL DEFAULT NULL,
  `protein` float NULL DEFAULT NULL,
  `fat` float NULL DEFAULT NULL,
  `carbs` float NULL DEFAULT NULL,
  `is_available` tinyint(1) NULL DEFAULT 1,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_menu_vendor`(`vendor_id` ASC) USING BTREE,
  CONSTRAINT `menu_items_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 67 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for nutrition_logs
-- ----------------------------
DROP TABLE IF EXISTS `nutrition_logs`;
CREATE TABLE `nutrition_logs`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NULL DEFAULT NULL,
  `order_id` bigint NULL DEFAULT NULL,
  `calories` int NULL DEFAULT NULL,
  `protein` float NULL DEFAULT NULL,
  `fat` float NULL DEFAULT NULL,
  `carbs` float NULL DEFAULT NULL,
  `recorded_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_nutrition_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `nutrition_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `nutrition_logs_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 32 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for order_items
-- ----------------------------
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `menu_item_id` bigint NULL DEFAULT NULL,
  `quantity` int NULL DEFAULT 1,
  `price_each` decimal(8, 2) NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `menu_item_id`(`menu_item_id` ASC) USING BTREE,
  INDEX `idx_order_items_order`(`order_id` ASC) USING BTREE,
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 156 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NULL DEFAULT NULL,
  `vendor_id` bigint NULL DEFAULT NULL,
  `total_amount` decimal(10, 2) NULL DEFAULT 0.00,
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending',
  `queue_number` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `placed_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reviewed_at` datetime NULL DEFAULT NULL COMMENT '用户对该订单完成商家评分的时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_orders_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_orders_vendor`(`vendor_id` ASC) USING BTREE,
  INDEX `idx_orders_status`(`status` ASC) USING BTREE,
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 33 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for posts
-- ----------------------------
DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NULL DEFAULT NULL,
  `vendor_id` bigint NULL DEFAULT NULL,
  `title` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `feedback_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'other' COMMENT 'food=菜品建议, service=服务态度, env=环境卫生, other=其他',
  `post_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'feedback' COMMENT 'feedback=反馈, dynamics=食堂圈动态',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `image_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '图片URL',
  `media_urls` json NULL,
  `like_count` int NULL DEFAULT 0,
  `comment_count` int NULL DEFAULT 0,
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending' COMMENT '流程: pending=都未回复, ai_replied=AI已建议待官方回复, replied=官方已回复',
  `reply_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '官方回复内容',
  `ai_suggestion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT 'AI建议（预留，可为空）',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_posts_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_posts_vendor`(`vendor_id` ASC) USING BTREE,
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 23 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for queue_entries
-- ----------------------------
DROP TABLE IF EXISTS `queue_entries`;
CREATE TABLE `queue_entries`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `vendor_id` bigint NOT NULL,
  `user_id` bigint NULL DEFAULT NULL,
  `queue_number` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'waiting',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `called_at` datetime NULL DEFAULT NULL,
  `served_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_queue_vendor_status`(`vendor_id` ASC, `status` ASC) USING BTREE,
  CONSTRAINT `queue_entries_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `queue_entries_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 64 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for retained_samples
-- ----------------------------
DROP TABLE IF EXISTS `retained_samples`;
CREATE TABLE `retained_samples`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sample_code` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `vendor_id` bigint NULL DEFAULT NULL,
  `collected_at` datetime NULL DEFAULT NULL,
  `storage_location` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'available',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `sample_code`(`sample_code` ASC) USING BTREE,
  INDEX `idx_samples_vendor`(`vendor_id` ASC) USING BTREE,
  CONSTRAINT `retained_samples_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 33 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for sensor_logs
-- ----------------------------
DROP TABLE IF EXISTS `sensor_logs`;
CREATE TABLE `sensor_logs`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `device_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `metric` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `value` double NULL DEFAULT NULL,
  `unit` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `recorded_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_sensor_metric_time`(`metric` ASC, `recorded_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 33 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for stock_movements
-- ----------------------------
DROP TABLE IF EXISTS `stock_movements`;
CREATE TABLE `stock_movements`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `material` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `qty` int NULL DEFAULT NULL,
  `supplier` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `movement_type` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `vendor_id` bigint NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_stock_vendor`(`vendor_id` ASC) USING BTREE,
  CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 33 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for test_reports
-- ----------------------------
DROP TABLE IF EXISTS `test_reports`;
CREATE TABLE `test_reports`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sample_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `vendor_id` bigint NULL DEFAULT NULL,
  `item_type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `result` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `numeric_value` double NULL DEFAULT NULL,
  `unit` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `lab_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `report_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `image_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '报告封面/缩略图URL',
  `tested_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_test_vendor`(`vendor_id` ASC) USING BTREE,
  CONSTRAINT `test_reports_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 33 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '123456' COMMENT '密码(明文)',
  `display_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `email` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `phone` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `role` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'student',
  `image_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '头像URL',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 24 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for vendors
-- ----------------------------
DROP TABLE IF EXISTS `vendors`;
CREATE TABLE `vendors`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `image_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '图片URL',
  `location_label` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `contact_info` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NULL DEFAULT 1,
  `rating_avg` decimal(3,2) NULL DEFAULT NULL COMMENT '评分平均分，定时从 vendor_reviews 聚合',
  `rating_count` int NULL DEFAULT 0 COMMENT '评分人数',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for materials（食材主数据：过敏原在食材上，入库/菜品都关联此表，便于追溯供应商）
-- ----------------------------
DROP TABLE IF EXISTS `menu_item_materials`;
DROP TABLE IF EXISTS `materials`;
CREATE TABLE `materials` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `vendor_id` bigint NULL DEFAULT NULL COMMENT '所属窗口，NULL 表示全局食材',
  `name` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '食材名称',
  `allergen_tags` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '过敏原，逗号分隔如 麸质,海鲜,坚果',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_materials_vendor`(`vendor_id` ASC) USING BTREE,
  CONSTRAINT `materials_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '食材主数据，挂过敏原；入库与菜品均关联此表，可追溯供应商' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for menu_item_materials（菜品-食材多对多：这道菜用了哪些食材）
-- ----------------------------
CREATE TABLE `menu_item_materials` (
  `menu_item_id` bigint NOT NULL,
  `material_id` bigint NOT NULL,
  `quantity` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '用量描述，如 100g、适量',
  PRIMARY KEY (`menu_item_id`, `material_id`) USING BTREE,
  INDEX `idx_mim_material`(`material_id` ASC) USING BTREE,
  CONSTRAINT `menu_item_materials_ibfk_1` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `menu_item_materials_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '菜品用了哪些食材，用于过敏原公示与追溯' ROW_FORMAT = Dynamic;

-- ----------------------------
-- stock_movements 增加 material_id，便于“学生吃出问题 → 菜品 → 食材 → 入库记录 → 供应商”
-- ----------------------------
ALTER TABLE `stock_movements`
  ADD COLUMN `material_id` bigint NULL DEFAULT NULL COMMENT '关联食材主数据，与 material 可并存过渡' AFTER `material`,
  ADD INDEX `idx_stock_material`(`material_id` ASC) USING BTREE,
  ADD CONSTRAINT `stock_movements_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- ----------------------------
-- Table structure for found_items（捡到失物公示，寻物平台「招领」）
-- ----------------------------
DROP TABLE IF EXISTS `found_items`;
CREATE TABLE `found_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '标题，如 捡到黑色保温杯',
  `location` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '捡到地点',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '描述',
  `image_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '图片URL',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '捡到失物公示' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for lost_items（遗失登记，寻物平台「寻物」）
-- ----------------------------
DROP TABLE IF EXISTS `lost_items`;
CREATE TABLE `lost_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '登记人称呼，如 王同学、匿名同学',
  `user_id` bigint NULL DEFAULT NULL COMMENT '可选：关联用户',
  `item_name` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '遗失物品名称',
  `location` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '遗失地点',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '补充描述',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_lost_created`(`created_at` DESC) USING BTREE,
  CONSTRAINT `lost_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '遗失登记' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for lost_item_comments（寻物启事评论）
-- ----------------------------
DROP TABLE IF EXISTS `lost_item_comments`;
CREATE TABLE `lost_item_comments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `lost_item_id` bigint NOT NULL COMMENT '寻物启事',
  `user_id` bigint NOT NULL COMMENT '评论用户',
  `content` text NOT NULL COMMENT '评论内容',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lost_item_comments_lost` (`lost_item_id`),
  KEY `idx_lost_item_comments_created` (`created_at` DESC),
  CONSTRAINT `fk_lost_item_comments_lost` FOREIGN KEY (`lost_item_id`) REFERENCES `lost_items` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_lost_item_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='寻物启事评论';

-- ----------------------------
-- Table structure for vendor_reviews（商店评分：仅评分或评分+评论；有评论时同步到食堂圈）
-- ----------------------------
DROP TABLE IF EXISTS `vendor_reviews`;
CREATE TABLE `vendor_reviews` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '用户',
  `vendor_id` bigint NOT NULL COMMENT '商家',
  `order_id` bigint NOT NULL COMMENT '关联订单，必须为本人历史订单',
  `rating` tinyint NOT NULL COMMENT '1-5 星',
  `content` text COMMENT '评论内容，为空则仅评分不发布到食堂圈',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vendor_reviews_order` (`order_id`),
  KEY `idx_vendor_reviews_user` (`user_id`),
  KEY `idx_vendor_reviews_vendor` (`vendor_id`),
  KEY `idx_vendor_reviews_created` (`created_at` DESC),
  CONSTRAINT `fk_vendor_reviews_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_vendor_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_vendor_reviews_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='商店评分：仅评分或评分+评论；有评论时同步到食堂圈';

-- posts 关联商家评价（有评论时同步到食堂圈的那条评价的 id，用于展示打分）
ALTER TABLE `posts` ADD COLUMN `vendor_review_id` bigint NULL DEFAULT NULL COMMENT '来自商家评价时关联' AFTER `created_at`;
ALTER TABLE `posts` ADD INDEX `idx_posts_vendor_review` (`vendor_review_id`);
ALTER TABLE `posts` ADD CONSTRAINT `posts_ibfk_vendor_review` FOREIGN KEY (`vendor_review_id`) REFERENCES `vendor_reviews` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- ----------------------------
-- Table structure for post_comments（帖子评论）
-- ----------------------------
DROP TABLE IF EXISTS `post_comments`;
CREATE TABLE `post_comments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `post_id` bigint NOT NULL COMMENT '帖子',
  `user_id` bigint NOT NULL COMMENT '评论用户',
  `content` text NOT NULL COMMENT '评论内容',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_post_comments_post` (`post_id`),
  KEY `idx_post_comments_created` (`created_at` DESC),
  CONSTRAINT `fk_post_comments_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_post_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='帖子评论';

-- ----------------------------
-- Table structure for post_likes（帖子点赞，用于管理点赞数与防重复）
-- ----------------------------
DROP TABLE IF EXISTS `post_likes`;
CREATE TABLE `post_likes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `post_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_post_likes_post_user` (`post_id`, `user_id`),
  KEY `idx_post_likes_post` (`post_id`),
  CONSTRAINT `fk_post_likes_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_post_likes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='帖子点赞';

-- ----------------------------
-- 食堂日快照（经营/内容/词云等聚合结果；由后续定时任务写入，当前不与业务表联动）
-- ----------------------------
DROP TABLE IF EXISTS `canteen_daily_snapshots`;
CREATE TABLE `canteen_daily_snapshots` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `snapshot_date` date NOT NULL COMMENT '自然日',
  `scope_type` varchar(32) NOT NULL DEFAULT 'global' COMMENT 'global | vendor | campus',
  `scope_id` bigint NOT NULL DEFAULT 0 COMMENT '全局用 0',
  `total_orders` int NULL DEFAULT NULL,
  `total_revenue` decimal(14,2) NULL DEFAULT NULL,
  `total_items_sold` int NULL DEFAULT NULL,
  `distinct_diners` int NULL DEFAULT NULL,
  `guest_orders` int NULL DEFAULT NULL,
  `avg_order_amount` decimal(10,2) NULL DEFAULT NULL,
  `top_menu_items_json` json NULL COMMENT '销冠菜品 Top N',
  `top_vendors_json` json NULL COMMENT '窗口排行',
  `menu_catalog_json` json NULL COMMENT '当日在售菜单快照',
  `hourly_orders_json` json NULL COMMENT '按小时订单量',
  `reviews_new_count` int NULL DEFAULT NULL,
  `reviews_avg_rating_that_day` decimal(3,2) NULL DEFAULT NULL,
  `vendors_rating_leaderboard_json` json NULL COMMENT '红黑榜素材等',
  `posts_dynamics_count` int NULL DEFAULT NULL,
  `posts_feedback_count` int NULL DEFAULT NULL,
  `posts_feedback_by_type_json` json NULL,
  `post_comments_count` int NULL DEFAULT NULL,
  `post_likes_count` int NULL DEFAULT NULL,
  `hot_posts_json` json NULL,
  `wordcloud_combined_json` json NULL COMMENT '词云 [{term,weight,count}]',
  `wordcloud_version` varchar(32) NULL DEFAULT NULL,
  `queue_tickets_issued` int NULL DEFAULT NULL,
  `queue_by_vendor_json` json NULL,
  `ai_conversations_new` int NULL DEFAULT NULL,
  `ai_messages_count` int NULL DEFAULT NULL,
  `nutrition_logs_count` int NULL DEFAULT NULL,
  `nutrition_totals_json` json NULL,
  `test_reports_new` int NULL DEFAULT NULL,
  `stock_movements_count` int NULL DEFAULT NULL,
  `computed_at` datetime NULL DEFAULT NULL,
  `data_version` int NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_canteen_snapshot_scope_day` (`snapshot_date`,`scope_type`,`scope_id`),
  KEY `idx_canteen_snapshot_date` (`snapshot_date` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='食堂日统计快照（预留，非业务表实时计算）';

-- ----------------------------
-- AI 周期分析报告（周报食安扫描等；由后续任务/AI 写入，当前不与发帖聚合联动）
-- ----------------------------
DROP TABLE IF EXISTS `ai_period_reports`;
CREATE TABLE `ai_period_reports` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `report_type` varchar(64) NOT NULL COMMENT 'weekly_posts_digest | food_safety_scan 等',
  `period_type` varchar(32) NOT NULL DEFAULT 'weekly' COMMENT 'daily | weekly | monthly | adhoc',
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `scope_type` varchar(32) NOT NULL DEFAULT 'global',
  `scope_id` bigint NOT NULL DEFAULT 0,
  `title` varchar(256) NULL DEFAULT NULL,
  `executive_summary` text NULL,
  `full_analysis_markdown` mediumtext NULL,
  `structured_payload_json` json NULL COMMENT '风险、建议、引用帖 id 等',
  `input_stats_json` json NULL,
  `source_post_ids_json` json NULL,
  `model_name` varchar(64) NULL DEFAULT NULL,
  `prompt_version` varchar(64) NULL DEFAULT NULL,
  `generation_status` varchar(32) NOT NULL DEFAULT 'success',
  `error_message` text NULL,
  `generated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `notify_status` varchar(32) NOT NULL DEFAULT 'none',
  `notify_channels_json` json NULL,
  `notify_sent_at` datetime NULL DEFAULT NULL,
  `acknowledged_by_user_id` bigint NULL DEFAULT NULL,
  `acknowledged_at` datetime NULL DEFAULT NULL,
  `visibility` varchar(32) NOT NULL DEFAULT 'admin_only',
  `pii_redacted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ai_report_period` (`report_type`,`period_start`,`period_end`,`scope_type`,`scope_id`),
  KEY `idx_ai_report_generated` (`generated_at` DESC),
  CONSTRAINT `fk_ai_report_ack_user` FOREIGN KEY (`acknowledged_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI 周期分析快照（预留）';

-- 手工试接口示例（按需取消注释执行；需库内已有 users.id=1 时 AI 报告才可带 ack 外键，可省略 acknowledged 字段）
-- INSERT INTO `canteen_daily_snapshots` (`snapshot_date`,`scope_type`,`scope_id`,`total_orders`,`total_revenue`,`computed_at`,`data_version`)
-- VALUES (CURDATE(),'global',0,0,0.00,NOW(),1);
-- INSERT INTO `ai_period_reports` (`report_type`,`period_type`,`period_start`,`period_end`,`scope_type`,`scope_id`,`title`,`executive_summary`,`generation_status`,`visibility`)
-- VALUES ('weekly_posts_digest','weekly',CURDATE() - INTERVAL 7 DAY,CURDATE(),'global',0,'占位周报','暂无真实聚合，仅占位。','success','admin_only');

SET FOREIGN_KEY_CHECKS = 1;
