package com.scs.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 简单内存会话服务：服务重启后会话自动失效，满足“重启需重新登录”。
 */
@Service
public class AdminSessionService {

    private final Map<String, SessionUser> sessionMap = new ConcurrentHashMap<>();

    public void put(String token, SessionUser sessionUser) {
        sessionMap.put(token, sessionUser);
    }

    public SessionUser get(String token) {
        return sessionMap.get(token);
    }

    public void remove(String token) {
        sessionMap.remove(token);
    }

    /** userId 用于 mobile（student/teacher），admin 登录也会写入便于 /users/me 统一返回 */
    public record SessionUser(String username, String role, Long userId) {}
}
