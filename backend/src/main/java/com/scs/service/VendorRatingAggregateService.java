package com.scs.service;

import com.scs.repository.VendorRepository;
import com.scs.repository.VendorReviewRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.util.List;

/**
 * 定时将 vendor_reviews 的评分聚合到 vendors 表的 rating_avg、rating_count。
 * 每 5 分钟执行一次。
 */
@Service
public class VendorRatingAggregateService {

    private static final Logger log = LoggerFactory.getLogger(VendorRatingAggregateService.class);

    private final VendorReviewRepository reviewRepo;
    private final VendorRepository vendorRepo;

    public VendorRatingAggregateService(VendorReviewRepository reviewRepo, VendorRepository vendorRepo) {
        this.reviewRepo = reviewRepo;
        this.vendorRepo = vendorRepo;
    }

    @PostConstruct
    public void onStartup() {
        aggregateRatingsToVendors();
    }

    @Scheduled(fixedRate = 5 * 60 * 1000) // 5 分钟
    @Transactional
    public void aggregateRatingsToVendors() {
        List<Object[]> rows = reviewRepo.getAverageRatingAndCountByVendor();
        for (Object[] row : rows) {
            Long vendorId = (Long) row[0];
            Double avg = row[1] != null ? ((Number) row[1]).doubleValue() : null;
            long count = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            vendorRepo.findById(vendorId).ifPresent(v -> {
                v.setRatingAvg(avg);
                v.setRatingCount((int) count);
                vendorRepo.save(v);
            });
        }
        // 无任何评分的商家保持 rating_avg=null, rating_count=0（不在此处清零，依赖初始值或首次有评分后才会被更新）
        if (!rows.isEmpty()) {
            log.debug("Vendor ratings aggregated: {} vendors updated", rows.size());
        }
    }
}
