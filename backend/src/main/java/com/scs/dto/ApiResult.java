package com.scs.dto;

/**
 * 与 v3-admin-vite 前端约定的统一响应格式：code=0 表示成功，data 为业务数据。
 */
public record ApiResult<T>(int code, T data, String message) {

    public static <T> ApiResult<T> ok(T data) {
        return new ApiResult<>(0, data, "ok");
    }

    public static <T> ApiResult<T> fail(int code, String message) {
        return new ApiResult<>(code, null, message);
    }
}
