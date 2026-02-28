package com.scs.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.scs.entity.User;

import java.time.format.DateTimeFormatter;

/**
 * 与 v3-admin-vite 表格页约定的单行数据结构。
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record TableDataDto(
        Long id,
        String username,
        String email,
        String phone,
        String roles,
        Boolean status,
        String createTime
) {
    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public static TableDataDto fromUser(User u) {
        return new TableDataDto(
                u.getId(),
                u.getUsername(),
                u.getEmail(),
                u.getPhone(),
                u.getRole() != null ? u.getRole() : "",
                Boolean.FALSE.equals(u.getIsDeleted()),
                u.getCreatedAt() != null ? u.getCreatedAt().format(ISO) : null
        );
    }
}
