-- ============================================================
-- SCS 最小实现数据库 schema（含图片资源表）
-- 适用：MySQL 8.x / MariaDB 10.x（若用 H2/PostgreSQL 需微调类型）
-- ============================================================

-- ------------------------------
-- 1. 图片资源表（尺寸、比例、缩略图路径统一维护，供多模块复用）
-- ------------------------------
CREATE TABLE IF NOT EXISTS image_asset (
  id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  path         VARCHAR(512) NOT NULL COMMENT '相对路径，如 images/dishes/xxx.jpg，前端访问 /images/dishes/xxx.jpg',
  thumbnail_path VARCHAR(512) DEFAULT NULL COMMENT '缩略图相对路径，如 images/thumbnails/dishes/xxx.jpg',
  width        INT          DEFAULT NULL COMMENT '宽度 px',
  height       INT          DEFAULT NULL COMMENT '高度 px',
  aspect_ratio DECIMAL(5,3) DEFAULT NULL COMMENT '宽高比 width/height，便于列表/卡片统一比例',
  asset_type   VARCHAR(32)  NOT NULL COMMENT '类型: dish, window, zone, lost_found, other',
  name         VARCHAR(255) DEFAULT NULL COMMENT '可选备注名，便于后台管理',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_path (path(255)),
  KEY idx_asset_type (asset_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图片资源：路径、尺寸、缩略图、类型';

-- ------------------------------
-- 2. 窗口（大屏状态流 + 菜单窗口）
-- ------------------------------
CREATE TABLE IF NOT EXISTS window (
  id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code            VARCHAR(16)  NOT NULL COMMENT '如 W01, W02',
  name            VARCHAR(64)  NOT NULL COMMENT '如 1号特色窗',
  status          VARCHAR(16)  NOT NULL DEFAULT 'idle' COMMENT 'idle|busy|congested',
  queue_count     INT          NOT NULL DEFAULT 0,
  wait_minutes    INT          NOT NULL DEFAULT 0 COMMENT '预计等待分钟',
  featured_dish   VARCHAR(128) DEFAULT NULL COMMENT '主打菜名，展示用',
  image_asset_id  BIGINT       DEFAULT NULL COMMENT '头图',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_code (code),
  KEY idx_status (status),
  KEY fk_window_image (image_asset_id),
  CONSTRAINT fk_window_image FOREIGN KEY (image_asset_id) REFERENCES image_asset (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='窗口';

-- ------------------------------
-- 3. 菜品
-- ------------------------------
CREATE TABLE IF NOT EXISTS dish (
  id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(128) NOT NULL,
  merchant        VARCHAR(64)  NOT NULL,
  window_id       BIGINT       DEFAULT NULL,
  price           DECIMAL(10,2) NOT NULL,
  rating          DECIMAL(2,1) DEFAULT NULL COMMENT '如 4.8',
  image_asset_id  BIGINT       DEFAULT NULL,
  description     VARCHAR(512) DEFAULT NULL,
  calories        INT          DEFAULT NULL,
  sales           INT          NOT NULL DEFAULT 0 COMMENT '月售',
  category        VARCHAR(32)  DEFAULT NULL COMMENT '招牌|盖浇饭|面食|烧烤|饮品|轻食|其他，与前端分类对应',
  tags            JSON         DEFAULT NULL COMMENT '["招牌","微辣"]',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_window (window_id),
  KEY idx_category (category),
  KEY fk_dish_image (image_asset_id),
  CONSTRAINT fk_dish_window FOREIGN KEY (window_id) REFERENCES window (id) ON DELETE SET NULL,
  CONSTRAINT fk_dish_image FOREIGN KEY (image_asset_id) REFERENCES image_asset (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜品';

-- ------------------------------
-- 4. 叫号/取餐
-- ------------------------------
CREATE TABLE IF NOT EXISTS serving_ticket (
  id         BIGINT   NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ticket_no  VARCHAR(32) NOT NULL COMMENT '取餐号，如 A042',
  window_id  BIGINT   NOT NULL,
  status     VARCHAR(16) NOT NULL DEFAULT 'waiting' COMMENT 'waiting|served',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_window_status (window_id, status),
  KEY idx_created (created_at),
  CONSTRAINT fk_ticket_window FOREIGN KEY (window_id) REFERENCES window (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='叫号取餐';

-- ------------------------------
-- 5. 食堂区域（Bento 卡片）
-- ------------------------------
CREATE TABLE IF NOT EXISTS cafeteria_zone (
  id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(64)  NOT NULL,
  description VARCHAR(256) DEFAULT NULL,
  col_span    VARCHAR(32)  DEFAULT NULL COMMENT '如 md:col-span-2',
  row_span    VARCHAR(32)  DEFAULT NULL COMMENT '如 md:row-span-2',
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='食堂区域';

-- 区域与图片多对多（一个区域多张轮播图）
CREATE TABLE IF NOT EXISTS zone_image (
  id          BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  zone_id     BIGINT NOT NULL,
  image_asset_id BIGINT NOT NULL,
  sort_order  INT    NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_zone (zone_id),
  CONSTRAINT fk_zone_image_zone FOREIGN KEY (zone_id) REFERENCES cafeteria_zone (id) ON DELETE CASCADE,
  CONSTRAINT fk_zone_image_asset FOREIGN KEY (image_asset_id) REFERENCES image_asset (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='区域轮播图';

-- ------------------------------
-- 6. 餐段时间
-- ------------------------------
CREATE TABLE IF NOT EXISTS meal_period (
  id         BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(32) NOT NULL COMMENT '如 晨光早餐',
  time_range VARCHAR(32) NOT NULL COMMENT '如 06:30-09:00',
  sort_order INT         NOT NULL DEFAULT 0,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='餐段时间';

-- ------------------------------
-- 7. 失物招领
-- ------------------------------
CREATE TABLE IF NOT EXISTS found_item (
  id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(128) NOT NULL,
  location     VARCHAR(128) NOT NULL,
  description  VARCHAR(512) DEFAULT NULL,
  image_asset_id BIGINT     DEFAULT NULL,
  created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY fk_found_image (image_asset_id),
  CONSTRAINT fk_found_image FOREIGN KEY (image_asset_id) REFERENCES image_asset (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='失物招领';

-- ------------------------------
-- 8. 寻物启事
-- ------------------------------
CREATE TABLE IF NOT EXISTS lost_item (
  id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_name   VARCHAR(64)  NOT NULL COMMENT '发布人昵称',
  item        VARCHAR(128) NOT NULL COMMENT '丢失物品名',
  location    VARCHAR(128) NOT NULL,
  description VARCHAR(512) DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='寻物启事';

-- ------------------------------
-- 9. 环境监测（温度/消毒液时序）
-- ------------------------------
CREATE TABLE IF NOT EXISTS env_monitor (
  id          BIGINT    NOT NULL AUTO_INCREMENT PRIMARY KEY,
  record_time DATETIME  NOT NULL COMMENT '记录时间点',
  temp        DECIMAL(4,1) NOT NULL COMMENT '冷柜温度 °C',
  ppm         INT       NOT NULL COMMENT '消毒液浓度 ppm',
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_record_time (record_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='环境监测';

-- ------------------------------
-- 10. 检测报告
-- ------------------------------
CREATE TABLE IF NOT EXISTS safety_report (
  id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  report_type VARCHAR(64) NOT NULL COMMENT '如 农药残留检测',
  result      VARCHAR(16) NOT NULL COMMENT 'PASS|FAIL',
  agency      VARCHAR(128) DEFAULT NULL,
  report_time DATETIME    NOT NULL,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_report_time (report_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='检测报告';

-- ------------------------------
-- 11. 留样追踪
-- ------------------------------
CREATE TABLE IF NOT EXISTS sample_retention (
  id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sample_no   VARCHAR(64) NOT NULL COMMENT '如 S-20260226-01',
  meal        VARCHAR(32) NOT NULL COMMENT '早餐|午餐|晚餐等',
  sample_time VARCHAR(16) NOT NULL COMMENT '如 07:30',
  location    VARCHAR(64) NOT NULL COMMENT '如 A区冷藏柜',
  status      VARCHAR(32) NOT NULL COMMENT '冷藏中(48h)|待入库|已销毁',
  operator    VARCHAR(32) NOT NULL,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_sample_no (sample_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='留样追踪';

-- ------------------------------
-- 12. 窗口过敏原
-- ------------------------------
CREATE TABLE IF NOT EXISTS window_allergen (
  id            BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
  window_id     BIGINT      NOT NULL,
  allergen_name VARCHAR(32) NOT NULL COMMENT '如 麸质、海鲜、坚果、乳制品',
  created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_window_allergen (window_id, allergen_name),
  CONSTRAINT fk_allergen_window FOREIGN KEY (window_id) REFERENCES window (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='窗口过敏原';

-- ------------------------------
-- 13. 反馈
-- ------------------------------
CREATE TABLE IF NOT EXISTS feedback (
  id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  type       VARCHAR(32)  NOT NULL COMMENT '菜品建议|服务态度|环境卫生|其他',
  content    TEXT         NOT NULL,
  contact    VARCHAR(64)  DEFAULT NULL COMMENT '选填',
  reply      TEXT         DEFAULT NULL,
  status     VARCHAR(16)  NOT NULL DEFAULT 'pending' COMMENT 'pending|replied',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_status (status),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='反馈';

-- ============================================================
-- 表汇总（最小实现共 14 张表）
-- ============================================================
-- image_asset      图片资源（路径、尺寸、缩略图、类型）
-- window           窗口
-- dish             菜品 → window, image_asset
-- serving_ticket   叫号 → window
-- cafeteria_zone   食堂区域
-- zone_image       区域轮播图 → cafeteria_zone, image_asset
-- meal_period      餐段时间
-- found_item       失物招领 → image_asset
-- lost_item        寻物启事
-- env_monitor      环境监测
-- safety_report    检测报告
-- sample_retention 留样追踪
-- window_allergen  窗口过敏原 → window
-- feedback         反馈
