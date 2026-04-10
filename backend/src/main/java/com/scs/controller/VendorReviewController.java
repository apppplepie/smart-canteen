package com.scs.controller;

import com.scs.dto.VendorReviewResponse;
import com.scs.entity.VendorReview;
import com.scs.repository.VendorReviewRepository;
import com.scs.service.VendorReviewService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendor-reviews")
public class VendorReviewController {

    private final VendorReviewRepository repo;
    private final VendorReviewService vendorReviewService;

    public VendorReviewController(VendorReviewRepository repo, VendorReviewService vendorReviewService) {
        this.repo = repo;
        this.vendorReviewService = vendorReviewService;
    }

    @GetMapping("/vendor/{vendorId}")
    public List<VendorReview> listByVendor(@PathVariable Long vendorId) {
        return repo.findByVendor_IdOrderByCreatedAtDesc(vendorId);
    }

    @PostMapping
    public ResponseEntity<VendorReviewResponse> create(@RequestBody VendorReview entity) {
        VendorReviewResponse body = vendorReviewService.create(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }
}
