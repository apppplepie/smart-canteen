package com.scs.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

/**
 * 显式提供磁盘图片；避免仅依赖 {@link org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry}
 * 时在部分环境下对 {@code /api/images/**} 解析异常导致 404。
 * DB 存 /api/images/food/xxx.jpg → 读 {@code scs.images-dir}/food/xxx.jpg。
 */
@RestController
public class ImageStaticController {

    @Value("${scs.images-dir:./images}")
    private String imagesDir;

    @GetMapping("/api/images/{*relPath}")
    public ResponseEntity<Resource> serveApiImage(@PathVariable String relPath) {
        return serve(relPath);
    }

    @GetMapping("/images/{*relPath}")
    public ResponseEntity<Resource> serveShortImage(@PathVariable String relPath) {
        return serve(relPath);
    }

    private ResponseEntity<Resource> serve(String relPath) {
        if (relPath == null || relPath.isBlank()) {
            return ResponseEntity.notFound().build();
        }
        String normalizedRel = relPath.replace('\\', '/');
        if (normalizedRel.contains("..")) {
            return ResponseEntity.notFound().build();
        }
        Path base = Paths.get(imagesDir).toAbsolutePath().normalize();
        Path file = base.resolve(normalizedRel).normalize();
        if (!file.startsWith(base)) {
            return ResponseEntity.notFound().build();
        }
        if (!Files.isRegularFile(file) || !Files.isReadable(file)) {
            return ResponseEntity.notFound().build();
        }
        Resource body = new FileSystemResource(file);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic())
                .contentType(guessMediaType(file))
                .body(body);
    }

    private static MediaType guessMediaType(Path file) {
        try {
            String probed = Files.probeContentType(file);
            if (probed != null) {
                return MediaType.parseMediaType(probed);
            }
        } catch (Exception ignored) {
            // fall through
        }
        String n = file.getFileName().toString().toLowerCase();
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) {
            return MediaType.IMAGE_JPEG;
        }
        if (n.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        if (n.endsWith(".gif")) {
            return MediaType.IMAGE_GIF;
        }
        if (n.endsWith(".webp")) {
            return MediaType.parseMediaType("image/webp");
        }
        return MediaType.APPLICATION_OCTET_STREAM;
    }
}
