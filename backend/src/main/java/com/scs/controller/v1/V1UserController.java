package com.scs.controller.v1;

import com.scs.dto.ApiResult;
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

    /** 获取当前登录用户（与 admin 登录默认账户一致，不校验 token） */
    @GetMapping("/users/me")
    public ApiResult<Map<String, Object>> me() {
        return ApiResult.ok(Map.of(
                "username", "admin",
                "roles", List.of("admin")
        ));
    }
}
