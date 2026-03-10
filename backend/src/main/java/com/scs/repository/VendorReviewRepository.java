package com.scs.repository;

import com.scs.entity.VendorReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VendorReviewRepository extends JpaRepository<VendorReview, Long> {

    List<VendorReview> findByVendor_IdOrderByCreatedAtDesc(Long vendorId);

    @Query("SELECT AVG(v.rating) FROM VendorReview v WHERE v.vendor.id = :vendorId")
    Optional<Double> getAverageRatingByVendorId(@Param("vendorId") Long vendorId);

    /** 按商家聚合：商家 id、平均分、评分人数，供定时任务写回 vendors */
    @Query("SELECT v.vendor.id, AVG(v.rating), COUNT(v) FROM VendorReview v GROUP BY v.vendor.id")
    List<Object[]> getAverageRatingAndCountByVendor();
}
