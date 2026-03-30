package com.scs.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 显式提供磁盘图片；避免仅依赖 {@link org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry}
 * 时在部分环境下对 {@code /api/images/**} 解析异常导致 404。
 * DB 存 /api/images/food/xxx.jpg → 读 {@code scs.images-dir}/food/xxx.jpg。
 */
@RestController
public class ImageStaticController {
    private static final Logger log = LoggerFactory.getLogger(ImageStaticController.class);
    private static final String API_PREFIX = "/api/images/";
    private static final String SHORT_PREFIX = "/images/";

    @Value("${scs.images-dir:./images}")
    private String imagesDir;

    @RequestMapping(value = {"/api/images/**", "/images/**"}, method = {RequestMethod.GET, RequestMethod.HEAD})
    public void serveImage(HttpServletRequest request, HttpServletResponse response) {
        String uri = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && uri.startsWith(contextPath)) {
            uri = uri.substring(contextPath.length());
        }
        serve(request.getMethod(), uri, extractRelativePath(uri), response);
    }

    private void serve(String method, String uri, String relPath, HttpServletResponse response) {
        if (relPath == null || relPath.isBlank()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }
        String normalizedRel = relPath.replace('\\', '/').replaceFirst("^/+", "");
        if (normalizedRel.contains("..")) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }
        Path base = Paths.get(imagesDir).toAbsolutePath().normalize();
        Path file = base.resolve(normalizedRel).normalize();
        if (!file.startsWith(base)) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }
        if (!Files.isRegularFile(file) || !Files.isReadable(file)) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }
        try {
            long size = Files.size(file);
            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType(guessMediaType(file).toString());
            response.setHeader("Cache-Control", "public, max-age=3600");
            response.setContentLengthLong(size);
            if (!"HEAD".equalsIgnoreCase(method)) {
                Files.copy(file, response.getOutputStream());
                response.flushBuffer();
            }
        } catch (Exception e) {
            log.error("Failed to serve image uri={}, relPath={}, imagesDir={}", uri, normalizedRel, imagesDir, e);
            if (!response.isCommitted()) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }

    private static String extractRelativePath(String uri) {
        if (uri == null || uri.isBlank()) {
            return "";
        }
        if (uri.startsWith(API_PREFIX)) {
            return uri.substring(API_PREFIX.length());
        }
        if (uri.startsWith(SHORT_PREFIX)) {
            return uri.substring(SHORT_PREFIX.length());
        }
        return "";
    }

    private static MediaType guessMediaType(Path file) {
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
