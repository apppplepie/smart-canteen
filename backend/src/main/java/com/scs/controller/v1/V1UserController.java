package com.scs.controller.v1;

import com.scs.dto.ApiResult;
import com.scs.service.AdminSessionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 提供 admin 所需的当前用户接口 GET /api/v1/users/me。
 */
@RestController
@RequestMapping("/api/v1")
public class V1UserController {

    private final AdminSessionService adminSessionService;

    public V1UserController(AdminSessionService adminSessionService) {
        this.adminSessionService = adminSessionService;
    }

    /** 获取当前登录用户（校验 Bearer token） */
    @GetMapping("/users/me")
    public ApiResult<Map<String, Object>> me(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return ApiResult.fail(401, "未登录或登录已失效");
        }
        String token = authorization.substring("Bearer ".length()).trim();
        if (token.isEmpty()) {
            return ApiResult.fail(401, "未登录或登录已失效");
        }
        AdminSessionService.SessionUser sessionUser = adminSessionService.get(token);
        if (sessionUser == null) {
            return ApiResult.fail(401, "登录已失效，请重新登录");
        }

        return ApiResult.ok(Map.of(
                "username", sessionUser.username(),
                "roles", List.of(sessionUser.role())
        ));
    }
}
