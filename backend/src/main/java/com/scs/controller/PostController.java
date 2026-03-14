package com.scs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scs.entity.Post;
import com.scs.entity.PostLike;
import com.scs.entity.VendorReview;
import com.scs.repository.PostLikeRepository;
import com.scs.repository.PostRepository;
import com.scs.repository.UserRepository;
import com.scs.repository.VendorRepository;
import com.scs.repository.VendorReviewRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private static final Logger log = LoggerFactory.getLogger(PostController.class);

    private final PostRepository repo;
    private final UserRepository userRepo;
    private final VendorRepository vendorRepo;
    private final PostLikeRepository likeRepo;
    private final VendorReviewRepository vendorReviewRepo;
    private final String aiServiceBaseUrl;
    private final ObjectMapper objectMapper;

    public PostController(PostRepository repo, UserRepository userRepo, VendorRepository vendorRepo,
            PostLikeRepository likeRepo, VendorReviewRepository vendorReviewRepo,
            @Value("${ai.service.base-url:http://localhost:8000}") String aiServiceBaseUrl,
            ObjectMapper objectMapper) {
        this.repo = repo;
        this.userRepo = userRepo;
        this.vendorRepo = vendorRepo;
        this.likeRepo = likeRepo;
        this.vendorReviewRepo = vendorReviewRepo;
        this.aiServiceBaseUrl = (aiServiceBaseUrl != null && !aiServiceBaseUrl.isBlank())
                ? aiServiceBaseUrl.trim().replaceAll("/$", "")
                : "http://localhost:8000";
        log.info("[feedback] 使用 ai.service.base-url={}", this.aiServiceBaseUrl);
        this.objectMapper = objectMapper;
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
        if (userId == null)
            return ResponseEntity.badRequest().build();
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
        if (userId == null)
            return ResponseEntity.badRequest().build();
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
        if (entity.getId() != null)
            entity.setId(null);
        if (entity.getPostType() == null || entity.getPostType().isBlank()) {
            String ft = entity.getFeedbackType();
            entity.setPostType((ft != null && !ft.isBlank()) ? "feedback" : "dynamics");
        }
        resolveRelations(entity);
        Post saved = repo.save(entity);
        if ("feedback".equals(saved.getPostType())) {
            Long postId = saved.getId();
            String content = saved.getContent();
            String feedbackType = saved.getFeedbackType() != null ? saved.getFeedbackType() : "other";
            log.info("[feedback] 1/2 反馈已落库 postId={}, 触发异步 AI 分析", postId);
            CompletableFuture.runAsync(() -> triggerFeedbackAnalyze(postId, content, feedbackType));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    private void triggerFeedbackAnalyze(Long postId, String content, String feedbackType) {
        String url = aiServiceBaseUrl + "/api/feedback/analyze";
        log.info("[feedback] 2/2 异步调用 AI 分析 postId={}, url={}", postId, url);
        try {
            Map<String, Object> body = Map.of("postId", postId, "content", content != null ? content : "",
                    "feedbackType", feedbackType != null ? feedbackType : "other");
            String json = objectMapper.writeValueAsString(body);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<byte[]> entity = new HttpEntity<>(json.getBytes(StandardCharsets.UTF_8), headers);
            String responseBody = new RestTemplate().postForObject(url, entity, String.class);
            log.info("[feedback] 2/2 AI 分析请求完成 postId={}, responseLength={}", postId, responseBody != null ? responseBody.length() : 0);
        } catch (Exception e) {
            log.warn("[feedback] 2/2 异步调用 AI 分析失败 postId={}, url={}, error={}", postId, url, e.getMessage());
        }
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

    /**
     * 供 ai-service 回调：仅更新该条反馈的 AI 建议与状态（方案 B：Agent 写库）。
     */
    @PatchMapping("/{id}/ai-suggestion")
    public ResponseEntity<Post> patchAiSuggestion(@PathVariable Long id, @RequestBody Map<String, String> body) {
        log.info("[feedback] ai-service 回调 PATCH /posts/{}/ai-suggestion, bodyKeys={}", id, body != null ? body.keySet() : "null");
        return repo.findById(id)
                .map(post -> {
                    if (body != null) {
                        if (body.containsKey("aiSuggestion"))
                            post.setAiSuggestion(body.get("aiSuggestion"));
                        if (body.containsKey("status"))
                            post.setStatus(body.get("status") != null ? body.get("status") : post.getStatus());
                    }
                    Post saved = repo.save(post);
                    log.info("[feedback] ai_suggestion 已写回 postId={}, suggestionLen={}", id, saved.getAiSuggestion() != null ? saved.getAiSuggestion().length() : 0);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id))
            return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void resolveRelations(Post entity) {
        Long uid = entity.getUserId();
        Long vid = entity.getVendorId();
        if (uid != null)
            userRepo.findById(uid).ifPresent(entity::setUser);
        if (vid != null)
            vendorRepo.findById(vid).ifPresent(entity::setVendor);
    }

    private void enrichWithUser(List<Post> list) {
        for (Post p : list) {
            if (p.getUser() != null) {
                var u = p.getUser();
                String name = u.getDisplayName();
                if (name == null || name.isBlank())
                    name = u.getUsername();
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
