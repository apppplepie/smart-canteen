package com.scs.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 允许 admin / mobile 等前端跨域访问后端 API；
 * 映射 /api/images/** 到 food_images 目录，供菜品图等静态资源（本机与 Docker 通用）。
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${scs.images-dir:../food_images}")
    private String imagesDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path base = Paths.get(imagesDir).toAbsolutePath().normalize();
        String location = "file:" + base + "/";
        registry.addResourceHandler("/api/images/**")
                .addResourceLocations(location)
                .setCachePeriod(3600);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns(
                        "http://localhost:*",
                        "http://127.0.0.1:*",
                        "http://localhost:5175",
                        "http://127.0.0.1:5175"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false)
                .maxAge(3600);
    }
}
