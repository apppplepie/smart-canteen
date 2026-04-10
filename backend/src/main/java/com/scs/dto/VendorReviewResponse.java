package com.scs.dto;

import java.time.LocalDateTime;

/** 商家评价 API 响应（避免直接序列化 JPA 实体导致 Hibernate 代理等问题） */
public record VendorReviewResponse(
        Long id,
        Long userId,
        Long vendorId,
        Long orderId,
        Integer rating,
        String content,
        LocalDateTime createdAt
) {}
