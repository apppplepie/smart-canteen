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
 * 映射 /api/images/** 到统一图片根目录（默认 ../images）。
 * 链接规则：DB 存 /api/images/food/000001.jpg、/api/images/commodity/xxx.jpg，
 * 对应文件 images/food/000001.jpg、images/commodity/xxx.jpg。
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${scs.images-dir:./images}")
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
