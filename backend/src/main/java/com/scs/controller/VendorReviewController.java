package com.scs.controller;

import com.scs.entity.Post;
import com.scs.entity.VendorReview;
import com.scs.repository.OrderRepository;
import com.scs.repository.PostRepository;
import com.scs.repository.UserRepository;
import com.scs.repository.VendorRepository;
import com.scs.repository.VendorReviewRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendor-reviews")
public class VendorReviewController {

    private static final double DEFAULT_RATING_WHEN_EMPTY = 4.5;

    private final VendorReviewRepository repo;
    private final UserRepository userRepo;
    private final VendorRepository vendorRepo;
    private final OrderRepository orderRepo;
    private final PostRepository postRepo;

    public VendorReviewController(VendorReviewRepository repo, UserRepository userRepo,
                                  VendorRepository vendorRepo, OrderRepository orderRepo,
                                  PostRepository postRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
        this.vendorRepo = vendorRepo;
        this.orderRepo = orderRepo;
        this.postRepo = postRepo;
    }

    @GetMapping("/vendor/{vendorId}")
    public List<VendorReview> listByVendor(@PathVariable Long vendorId) {
        return repo.findByVendor_IdOrderByCreatedAtDesc(vendorId);
    }

    @PostMapping
    public ResponseEntity<VendorReview> create(@RequestBody VendorReview entity) {
        if (entity.getId() != null) entity.setId(null);
        if (entity.getRating() == null || entity.getRating() < 1 || entity.getRating() > 5) {
            return ResponseEntity.badRequest().build();
        }
        if (entity.getUserId() != null) {
            userRepo.findById(entity.getUserId()).ifPresent(entity::setUser);
        }
        if (entity.getVendorId() != null) {
            vendorRepo.findById(entity.getVendorId()).ifPresent(entity::setVendor);
        }
        if (entity.getOrderId() != null) {
            orderRepo.findById(entity.getOrderId()).ifPresent(entity::setOrder);
        }
        VendorReview saved = repo.save(entity);

        // 有评论时同步到食堂圈
        if (entity.getContent() != null && !entity.getContent().isBlank()) {
            Post post = new Post();
            post.setUserId(entity.getUserId());
            post.setVendorId(entity.getVendorId());
            post.setContent(entity.getContent().trim());
            post.setPostType("dynamics");
            if (entity.getUser() != null) post.setUser(entity.getUser());
            if (entity.getVendor() != null) post.setVendor(entity.getVendor());
            postRepo.save(post);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
