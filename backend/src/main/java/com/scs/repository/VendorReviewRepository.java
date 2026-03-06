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
}
