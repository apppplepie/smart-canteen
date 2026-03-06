package com.scs.controller;

import com.scs.entity.Post;
import com.scs.repository.PostRepository;
import com.scs.repository.UserRepository;
import com.scs.repository.VendorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostRepository repo;
    private final UserRepository userRepo;
    private final VendorRepository vendorRepo;

    public PostController(PostRepository repo, UserRepository userRepo, VendorRepository vendorRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
        this.vendorRepo = vendorRepo;
    }

    @GetMapping
    public List<Post> list(@RequestParam(required = false) String postType) {
        if (postType != null && !postType.isBlank()) {
            return repo.findByPostTypeOrderByCreatedAtDesc(postType.trim());
        }
        return repo.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<Post> listByUser(@PathVariable Long userId, @RequestParam(required = false) String postType) {
        if (postType != null && !postType.isBlank()) {
            return repo.findByUser_IdAndPostTypeOrderByCreatedAtDesc(userId, postType.trim());
        }
        return repo.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    @GetMapping("/vendor/{vendorId}")
    public List<Post> listByVendor(@PathVariable Long vendorId) {
        return repo.findByVendor_IdOrderByCreatedAtDesc(vendorId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Post> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
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
}
