package com.scs.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

/**
 * 简单上传：评论图片等，保存到 images 目录，返回可访问 URL。
 */
@RestController
@RequestMapping("/api")
public class UploadController {

    @Value("${scs.images-dir:./images}")
    private String imagesDir;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        String ext = getExtension(file.getOriginalFilename());
        String name = "comments/" + UUID.randomUUID().toString().replace("-", "") + ext;
        try {
            Path base = Paths.get(imagesDir).toAbsolutePath().normalize();
            Path target = base.resolve(name);
            Files.createDirectories(target.getParent());
            file.transferTo(target.toFile());
            String url = "/api/images/" + name;
            return ResponseEntity.ok(Map.of("url", url));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private static String getExtension(String filename) {
        if (filename == null) return ".jpg";
        int i = filename.lastIndexOf('.');
        if (i <= 0) return ".jpg";
        return filename.substring(i).toLowerCase();
    }
}
