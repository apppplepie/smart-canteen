package com.scs.controller.v1;

import com.scs.dto.ApiResult;
import org.springframework.web.bind.annotation.*;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Map;

/**
 * 为 admin 登录页提供验证码和登录接口。开发环境默认验证码为 1234，默认账户 admin / 12345678。
 */
@RestController
@RequestMapping("/api/v1")
public class AuthController {

    /** 开发用固定验证码，与生成的图片一致 */
    private static final String CAPTCHA_TEXT = "1234";

    /** 获取验证码图片（data URL，前端直接用于 img src） */
    @GetMapping("/auth/captcha")
    public ApiResult<String> captcha() {
        String dataUrl = "data:image/png;base64," + generateCaptchaImageBase64(CAPTCHA_TEXT);
        return ApiResult.ok(dataUrl);
    }

    /** 登录：admin / 12345678，验证码填 1234 */
    @PostMapping("/auth/login")
    public ApiResult<Map<String, String>> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String code = body.get("code");
        if (!CAPTCHA_TEXT.equalsIgnoreCase(code != null ? code.trim() : ""))
            return ApiResult.fail(400, "验证码错误");
        if (!"admin".equals(username) || !"12345678".equals(password))
            return ApiResult.fail(401, "用户名或密码错误");
        String token = "scs-admin-token-" + System.currentTimeMillis();
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
