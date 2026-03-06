package com.scs.controller.v1;

import com.scs.config.CurrentUserHolder;
import com.scs.dto.ApiResult;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 提供 admin 所需的当前用户接口 GET /api/v1/users/me。
 * 依赖全局 CurrentUserFilter 解析 token，此处仅读取并返回。
 */
@RestController
@RequestMapping("/api/v1")
public class V1UserController {

    /** 获取当前登录用户（由全局 Filter 已解析 token，无 token 或失效返回 401） */
    @GetMapping("/users/me")
    public ApiResult<Map<String, Object>> me(HttpServletRequest request) {
        return CurrentUserHolder.getCurrentSessionUser(request)
                .map(sessionUser -> {
                    Map<String, Object> data = new java.util.HashMap<>(Map.of(
                            "username", sessionUser.username(),
                            "roles", List.of(sessionUser.role())
                    ));
                    if (sessionUser.userId() != null) {
                        data.put("id", sessionUser.userId());
                    }
                    return ApiResult.ok(data);
                })
                .orElse(ApiResult.fail(401, "未登录或登录已失效"));
    }
}
