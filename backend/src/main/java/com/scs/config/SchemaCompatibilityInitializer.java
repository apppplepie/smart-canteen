package com.scs.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

@Component
public class SchemaCompatibilityInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SchemaCompatibilityInitializer.class);

    private final JdbcTemplate jdbcTemplate;

    public SchemaCompatibilityInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        ensureLostAndFoundColumns();
    }

    private void ensureLostAndFoundColumns() {
        if (hasTable("lost_items")) {
            ensureColumn(
                    "lost_items",
                    "image_url",
                    "ALTER TABLE `lost_items` ADD COLUMN `image_url` varchar(512) NULL DEFAULT NULL COMMENT '物品图片 URL' AFTER `description`");
            ensureColumn(
                    "lost_items",
                    "status",
                    "ALTER TABLE `lost_items` ADD COLUMN `status` varchar(32) NULL DEFAULT 'pending' COMMENT 'pending|found' AFTER `image_url`");
        }
        if (hasTable("found_items")) {
            ensureColumn(
                    "found_items",
                    "user_id",
                    "ALTER TABLE `found_items` ADD COLUMN `user_id` bigint NULL DEFAULT NULL COMMENT '发布用户' AFTER `id`");
            ensureColumn(
                    "found_items",
                    "image_url",
                    "ALTER TABLE `found_items` ADD COLUMN `image_url` varchar(512) NULL DEFAULT NULL COMMENT '图片URL' AFTER `description`");
            ensureColumn(
                    "found_items",
                    "status",
                    "ALTER TABLE `found_items` ADD COLUMN `status` varchar(32) NULL DEFAULT 'pending' COMMENT 'pending|returned' AFTER `image_url`");
        }
    }

    private void ensureColumn(@NonNull String tableName, @NonNull String columnName, @NonNull String addColumnDdl) {
        if (!hasColumn(tableName, columnName)) {
            runDdl(addColumnDdl);
        }
    }

    private boolean hasTable(@NonNull String tableName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
                Integer.class,
                tableName);
        return count != null && count > 0;
    }

    private boolean hasColumn(@NonNull String tableName, @NonNull String columnName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
                Integer.class,
                tableName,
                columnName);
        return count != null && count > 0;
    }

    private void runDdl(@NonNull String sql) {
        try {
            jdbcTemplate.execute(sql);
        } catch (Exception ex) {
            log.warn("[schema-compat] failed to execute ddl: {}", sql, ex);
        }
    }
}
