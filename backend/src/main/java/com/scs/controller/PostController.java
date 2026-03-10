package com.scs.controller;

import com.scs.entity.Post;
import com.scs.entity.PostLike;
import com.scs.entity.VendorReview;
import com.scs.repository.PostLikeRepository;
import com.scs.repository.PostRepository;
import com.scs.repository.UserRepository;
import com.scs.repository.VendorRepository;
import com.scs.repository.VendorReviewRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostRepository repo;
    private final UserRepository userRepo;
    private final VendorRepository vendorRepo;
    private final PostLikeRepository likeRepo;
    private final VendorReviewRepository vendorReviewRepo;

    public PostController(PostRepository repo, UserRepository userRepo, VendorRepository vendorRepo,
                         PostLikeRepository likeRepo, VendorReviewRepository vendorReviewRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
        this.vendorRepo = vendorRepo;
        this.likeRepo = likeRepo;
        this.vendorReviewRepo = vendorReviewRepo;
    }

    @GetMapping
    public List<Post> list(@RequestParam(required = false) String postType) {
        List<Post> list = postType != null && !postType.isBlank()
                ? repo.findByPostTypeOrderByCreatedAtDesc(postType.trim())
                : repo.findAll();
        enrichWithUser(list);
        enrichWithRating(list);
        return list;
    }

    @GetMapping("/user/{userId}")
    public List<Post> listByUser(@PathVariable Long userId, @RequestParam(required = false) String postType) {
        List<Post> list = postType != null && !postType.isBlank()
                ? repo.findByUser_IdAndPostTypeOrderByCreatedAtDesc(userId, postType.trim())
                : repo.findByUser_IdOrderByCreatedAtDesc(userId);
        enrichWithUser(list);
        enrichWithRating(list);
        return list;
    }

    @GetMapping("/vendor/{vendorId}")
    public List<Post> listByVendor(@PathVariable Long vendorId) {
        List<Post> list = repo.findByVendor_IdOrderByCreatedAtDesc(vendorId);
        enrichWithUser(list);
        enrichWithRating(list);
        return list;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Post> get(@PathVariable Long id,
                                    @RequestParam(required = false) Long userId) {
        return repo.findById(id)
                .map(post -> {
                    if (userId != null && likeRepo.existsByPost_IdAndUser_Id(post.getId(), userId)) {
                        post.setLikedByCurrentUser(true);
                    }
                    enrichWithUser(java.util.Collections.singletonList(post));
                    enrichWithRating(java.util.Collections.singletonList(post));
                    return ResponseEntity.ok(post);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Post> like(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        Long userId = body != null ? body.get("userId") : null;
        if (userId == null) return ResponseEntity.badRequest().build();
        return repo.findById(id)
                .map(post -> {
                    if (likeRepo.existsByPost_IdAndUser_Id(id, userId)) {
                        return ResponseEntity.ok(post);
                    }
                    PostLike like = new PostLike();
                    like.setPostId(id);
                    like.setUserId(userId);
                    repo.findById(id).ifPresent(like::setPost);
                    userRepo.findById(userId).ifPresent(like::setUser);
                    likeRepo.save(like);
                    post.setLikeCount((post.getLikeCount() != null ? post.getLikeCount() : 0) + 1);
                    repo.save(post);
                    return ResponseEntity.ok(post);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}/like")
    public ResponseEntity<Post> unlike(@PathVariable Long id, @RequestParam Long userId) {
        if (userId == null) return ResponseEntity.badRequest().build();
        return repo.findById(id)
                .map(post -> {
                    likeRepo.findByPost_IdAndUser_Id(id, userId).ifPresent(likeRepo::delete);
                    int count = (post.getLikeCount() != null ? post.getLikeCount() : 0);
                    if (count > 0) {
                        post.setLikeCount(count - 1);
                        repo.save(post);
                    }
                    return ResponseEntity.ok(post);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Post> create(@RequestBody Post entity) {
        if (entity.getId() != null) entity.setId(null);
        if (entity.getPostType() == null || entity.getPostType().isBlank()) {
            String ft = entity.getFeedbackType();
            entity.setPostType((ft != null && !ft.isBlank()) ? "feedback" : "dynamics");
        }
        resolveRelations(entity);
        Post saved = repo.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Post> update(@PathVariable Long id, @RequestBody Post entity) {
        return repo.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    entity.setCreatedAt(existing.getCreatedAt());
                    resolveRelations(entity);
                    return ResponseEntity.ok(repo.save(entity));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void resolveRelations(Post entity) {
        Long uid = entity.getUserId();
        Long vid = entity.getVendorId();
        if (uid != null) userRepo.findById(uid).ifPresent(entity::setUser);
        if (vid != null) vendorRepo.findById(vid).ifPresent(entity::setVendor);
    }

    private void enrichWithUser(List<Post> list) {
        for (Post p : list) {
            if (p.getUser() != null) {
                var u = p.getUser();
                String name = u.getDisplayName();
                if (name == null || name.isBlank()) name = u.getUsername();
                p.setUserDisplayName(name);
                p.setUserImageUrl(u.getImageUrl());
            }
        }
    }

    private void enrichWithRating(List<Post> list) {
        for (Post p : list) {
            if (p.getVendorReviewId() != null) {
                vendorReviewRepo.findById(p.getVendorReviewId())
                        .map(VendorReview::getRating)
                        .ifPresent(p::setRating);
            }
        }
    }
}
