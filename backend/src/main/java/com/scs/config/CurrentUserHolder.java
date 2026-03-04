package com.scs.config;

import com.scs.service.AdminSessionService;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Optional;

/**
 * 从当前请求中获取「全局解析 token 后注入」的登录用户信息。
 * 无 token 或 token 无效时返回 empty，兼容不传 token 的前端。
 */
public final class CurrentUserHolder {

    /** 请求属性 key：当前会话用户（{@link AdminSessionService.SessionUser} 或 null） */
    public static final String REQUEST_ATTR_SESSION_USER = "currentSessionUser";

    private CurrentUserHolder() {}

    /**
     * 获取当前请求对应的登录用户（由 {@link CurrentUserFilter} 注入）。
     * 未带 token、token 无效或非 API 请求时为 empty。
     */
    public static Optional<AdminSessionService.SessionUser> getCurrentSessionUser(HttpServletRequest request) {
        if (request == null) return Optional.empty();
        Object attr = request.getAttribute(REQUEST_ATTR_SESSION_USER);
        if (attr instanceof AdminSessionService.SessionUser sessionUser) {
            return Optional.of(sessionUser);
        }
        return Optional.empty();
    }
}
