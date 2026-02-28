-- MySQL-compatible schema for Canteen system (generated 2026-02-28T05:50:11.656622Z)
-- Engine: InnoDB, Charset: utf8mb4
SET FOREIGN_KEY_CHECKS=0;

-- Users
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  display_name VARCHAR(128),
  email VARCHAR(256),
  phone VARCHAR(32),
  role VARCHAR(32) DEFAULT 'student',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vendors / Windows
DROP TABLE IF EXISTS vendors;
CREATE TABLE vendors (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  location_label VARCHAR(64),
  contact_info VARCHAR(256),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Menu items
DROP TABLE IF EXISTS menu_items;
CREATE TABLE menu_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  vendor_id BIGINT NOT NULL,
  name VARCHAR(256) NOT NULL,
  description TEXT,
  price DECIMAL(8,2) NOT NULL DEFAULT 0,
  prep_time_seconds INT DEFAULT 300,
  calories INT NULL,
  protein FLOAT NULL,
  fat FLOAT NULL,
  carbs FLOAT NULL,
  is_available TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_menu_vendor ON menu_items(vendor_id);

-- Orders
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT,
  vendor_id BIGINT,
  total_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(32) DEFAULT 'pending',
  queue_number VARCHAR(32),
  placed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_status ON orders(status);

DROP TABLE IF EXISTS order_items;
CREATE TABLE order_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  menu_item_id BIGINT,
  quantity INT DEFAULT 1,
  price_each DECIMAL(8,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Queue entries
DROP TABLE IF EXISTS queue_entries;
CREATE TABLE queue_entries (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  vendor_id BIGINT NOT NULL,
  user_id BIGINT,
  queue_number VARCHAR(32) NOT NULL,
  status VARCHAR(32) DEFAULT 'waiting',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  called_at DATETIME NULL,
  served_at DATETIME NULL,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_queue_vendor_status ON queue_entries(vendor_id, status);

-- Call events
DROP TABLE IF EXISTS call_events;
CREATE TABLE call_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  queue_entry_id BIGINT,
  vendor_id BIGINT,
  event_type VARCHAR(32),
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (queue_entry_id) REFERENCES queue_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sensor logs
DROP TABLE IF EXISTS sensor_logs;
CREATE TABLE sensor_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(64),
  metric VARCHAR(64),
  value DOUBLE,
  unit VARCHAR(16),
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_sensor_metric_time ON sensor_logs(metric, recorded_at);

-- Test reports
DROP TABLE IF EXISTS test_reports;
CREATE TABLE test_reports (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sample_id VARCHAR(64),
  vendor_id BIGINT,
  item_type VARCHAR(64),
  result VARCHAR(32),
  numeric_value DOUBLE,
  unit VARCHAR(16),
  lab_name VARCHAR(128),
  report_url VARCHAR(512),
  tested_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_test_vendor ON test_reports(vendor_id);

-- Retained samples
DROP TABLE IF EXISTS retained_samples;
CREATE TABLE retained_samples (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sample_code VARCHAR(64) UNIQUE,
  vendor_id BIGINT,
  collected_at DATETIME,
  storage_location VARCHAR(128),
  status VARCHAR(32) DEFAULT 'available',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_samples_vendor ON retained_samples(vendor_id);

-- Stock movements
DROP TABLE IF EXISTS stock_movements;
CREATE TABLE stock_movements (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  material VARCHAR(256),
  qty INT,
  supplier VARCHAR(256),
  movement_type VARCHAR(8),
  vendor_id BIGINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_stock_vendor ON stock_movements(vendor_id);

-- Posts (UGC)
DROP TABLE IF EXISTS posts;
CREATE TABLE posts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT,
  vendor_id BIGINT,
  title VARCHAR(256),
  content TEXT,
  media_urls JSON,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_vendor ON posts(vendor_id);

-- Nutrition logs
DROP TABLE IF EXISTS nutrition_logs;
CREATE TABLE nutrition_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT,
  order_id BIGINT,
  calories INT,
  protein FLOAT,
  fat FLOAT,
  carbs FLOAT,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_nutrition_user ON nutrition_logs(user_id);

-- Agent requests (AI assistant logs)
DROP TABLE IF EXISTS agent_requests;
CREATE TABLE agent_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT,
  prompt TEXT,
  response TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit logs
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_id BIGINT,
  action VARCHAR(128),
  object_type VARCHAR(64),
  object_id VARCHAR(64),
  details JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS=1;

-- Sample data
-- Users
INSERT INTO users (username, display_name, email, phone, role) VALUES
('ender','Ender','ender@example.com','+10000000001','student'),
('alice','Alice Chen','alice@example.com','+10000000002','student'),
('vendor01','Vendor 01','vendor01@example.com','+10000000010','vendor');

-- Vendors
INSERT INTO vendors (name, description, location_label, contact_info) VALUES
('香辣小炒','川味快餐','窗口 01','+10000000011'),
('面馆阿强','手工面食','窗口 02','+10000000012'),
('蒸菜坊','健康蒸菜','窗口 03','+10000000013');

-- Menu items
INSERT INTO menu_items (vendor_id, name, description, price, prep_time_seconds, calories) VALUES
(1,'香辣土豆丝','微辣，配米饭',12.00,180,320),
(1,'回锅肉','经典回锅肉',18.00,300,520),
(2,'卤肉面','卤汁浓郁',14.00,240,450),
(2,'牛肉面','大块牛肉',22.00,360,680),
(3,'清蒸鱼','低油清淡',28.00,420,300),
(3,'蒸蔬菜拼盘','时令蔬菜',10.00,120,150);

-- Orders and order items
INSERT INTO orders (user_id, vendor_id, total_amount, status, queue_number) VALUES
(1,1,12.00,'ready','A101'),
(2,2,14.00,'preparing','B202');

INSERT INTO order_items (order_id, menu_item_id, quantity, price_each) VALUES
(1,1,1,12.00),
(2,3,1,14.00);

-- Queue entries
INSERT INTO queue_entries (vendor_id, user_id, queue_number, status, created_at) VALUES
(1,1,'Q001','waiting',NOW() - INTERVAL 5 MINUTE),
(2,2,'Q002','called',NOW() - INTERVAL 2 MINUTE),
(3,NULL,'Q003','waiting',NOW() - INTERVAL 1 MINUTE);

-- Call events
INSERT INTO call_events (queue_entry_id, vendor_id, event_type, message) VALUES
(2,2,'called','请到窗口02取餐 B202');

-- Sensor logs
INSERT INTO sensor_logs (device_id, metric, value, unit, recorded_at) VALUES
('fridge-A','temp',3.5,'C',NOW() - INTERVAL 10 MINUTE),
('sanitizer-1','ppm',750,'ppm',NOW() - INTERVAL 15 MINUTE);

-- Test reports
INSERT INTO test_reports (sample_id, vendor_id, item_type, result, numeric_value, unit, lab_name, report_url, tested_at) VALUES
('S-20260225-01',1,'pesticide','pass',0.02,'ppm','第三方检测所','https://example.com/report1.pdf',NOW() - INTERVAL 2 DAY),
('S-20260225-02',2,'microbiology','pass',0.0,'cfu','第三方检测所','https://example.com/report2.pdf',NOW() - INTERVAL 1 DAY);

-- Retained samples
INSERT INTO retained_samples (sample_code, vendor_id, collected_at, storage_location, status) VALUES
('RS-0001',1,NOW() - INTERVAL 7 DAY,'冰箱A','available'),
('RS-0002',2,NOW() - INTERVAL 3 DAY,'冰箱B','available');

-- Stock movements
INSERT INTO stock_movements (material, qty, supplier, movement_type, vendor_id) VALUES
('大米',100,'供货商A','in',1),
('鸡蛋',200,'供货商B','in',2);

-- Posts (打卡)
INSERT INTO posts (user_id, vendor_id, title, content, media_urls) VALUES
(1,1,'今早的香辣土豆丝不错','味道很棒，排队不长', JSON_ARRAY('https://example.com/photo1.jpg')),
(2,2,'卤肉面超好吃','面条劲道，推荐', JSON_ARRAY('https://example.com/photo2.jpg'));

-- Nutrition logs
INSERT INTO nutrition_logs (user_id, order_id, calories, protein, fat, carbs) VALUES
(1,1,320,12,10,40);

-- Agent requests
INSERT INTO agent_requests (user_id, prompt, response) VALUES
(1,'今天吃什么不排队','推荐窗口03，预计等待 4 分钟');

-- Audit logs
INSERT INTO audit_logs (actor_id, action, object_type, object_id, details) VALUES
(1,'create_order','order','1', JSON_OBJECT('amount',12.00));

-- Example update to mark an order as ready
UPDATE orders SET status='ready' WHERE id=1;

-- Done