package com.scs.controller.v1;

import com.scs.dto.ApiResult;
import com.scs.service.AdminSessionService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

/**
 * 为 admin 登录页提供验证码和登录接口。
 */
@RestController
@RequestMapping("/api/v1")
public class AuthController {

    /** 开发用固定验证码，与生成的图片一致 */
    private static final String CAPTCHA_TEXT = "1234";
    private final JdbcTemplate jdbcTemplate;
    private final AdminSessionService adminSessionService;

    public AuthController(JdbcTemplate jdbcTemplate, AdminSessionService adminSessionService) {
        this.jdbcTemplate = jdbcTemplate;
        this.adminSessionService = adminSessionService;
    }

    /** 获取验证码图片（data URL，前端直接用于 img src） */
    @GetMapping("/auth/captcha")
    public ApiResult<String> captcha() {
        String dataUrl = "data:image/png;base64," + generateCaptchaImageBase64(CAPTCHA_TEXT);
        return ApiResult.ok(dataUrl);
    }

    /** 登录：用户名/密码来自数据库 users 表，仅允许 admin/vendor 角色 */
    @PostMapping("/auth/login")
    public ApiResult<Map<String, String>> login(@RequestBody Map<String, String> body) {
        String username = body.get("username") == null ? "" : body.get("username").trim();
        String password = body.get("password") == null ? "" : body.get("password");
        // 验证码已关闭：任意输入均放行
        if (username.isEmpty() || password.isEmpty()) {
            return ApiResult.fail(400, "用户名和密码不能为空");
        }

        Map<String, Object> row;
        try {
            row = jdbcTemplate.queryForMap(
                    "select username, password, role, is_deleted from users where username = ? limit 1",
                    username
            );
        } catch (Exception e) {
            return ApiResult.fail(401, "用户名或密码错误");
        }

        Object isDeletedValue = row.get("is_deleted");
        boolean isDeleted = false;
        if (isDeletedValue instanceof Boolean b) {
            isDeleted = b;
        } else if (isDeletedValue instanceof Number n) {
            isDeleted = n.intValue() == 1;
        }
        if (isDeleted) {
            return ApiResult.fail(401, "用户已被禁用");
        }

        String dbPassword = row.get("password") == null ? "" : String.valueOf(row.get("password"));
        if (!dbPassword.equals(password)) {
            return ApiResult.fail(401, "用户名或密码错误");
        }

        String role = row.get("role") == null ? "" : String.valueOf(row.get("role")).trim().toLowerCase();
        if (!"admin".equals(role) && !"vendor".equals(role)) {
            return ApiResult.fail(403, "当前角色无后台访问权限");
        }

        String token = "scs-admin-token-" + UUID.randomUUID();
        adminSessionService.put(token, new AdminSessionService.SessionUser(username, role));
        return ApiResult.ok(Map.of("token", token));
    }

    private static String generateCaptchaImageBase64(String text) {
        int w = 100, h = 36;
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, w, h);
        g.setColor(Color.DARK_GRAY);
        g.setFont(new Font("SansSerif", Font.BOLD, 22));
        g.drawString(text, 12, 26);
        g.dispose();
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(img, "png", baos);
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
