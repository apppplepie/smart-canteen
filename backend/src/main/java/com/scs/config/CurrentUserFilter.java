package com.scs.config;

import com.scs.service.AdminSessionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.lang.NonNull;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 全局解析 Authorization: Bearer &lt;token&gt;，将当前用户放入 request 属性，供控制器使用。
 * 无 token 或 token 无效时不拦截，仅不注入用户信息（兼容不传 token 的前端）。
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CurrentUserFilter extends OncePerRequestFilter {

    private final AdminSessionService adminSessionService;

    public CurrentUserFilter(AdminSessionService adminSessionService) {
        this.adminSessionService = adminSessionService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (authorization != null && authorization.startsWith("Bearer ")) {
            String token = authorization.substring(7).trim();
            if (!token.isEmpty()) {
                AdminSessionService.SessionUser sessionUser = adminSessionService.get(token);
                request.setAttribute(CurrentUserHolder.REQUEST_ATTR_SESSION_USER, sessionUser);
            }
        }
        // 未设置或未带 token 时 attribute 不存在，CurrentUserHolder.getCurrentSessionUser 会返回 empty
        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        // 只对 /api 请求做解析，其它请求跳过
        String path = request.getRequestURI();
        return path == null || !path.startsWith("/api");
    }
}
