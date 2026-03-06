package com.scs.controller;

import com.scs.entity.Post;
import com.scs.entity.PostComment;
import com.scs.repository.PostCommentRepository;
import com.scs.repository.PostRepository;
import com.scs.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/post-comments")
public class PostCommentController {

    private final PostCommentRepository repo;
    private final PostRepository postRepo;
    private final UserRepository userRepo;

    public PostCommentController(PostCommentRepository repo, PostRepository postRepo, UserRepository userRepo) {
        this.repo = repo;
        this.postRepo = postRepo;
        this.userRepo = userRepo;
    }

    @GetMapping("/post/{postId}")
    public List<PostComment> listByPost(@PathVariable Long postId) {
        List<PostComment> list = repo.findByPost_IdOrderByCreatedAtAsc(postId);
        for (PostComment c : list) {
            if (c.getUser() != null) {
                String name = c.getUser().getDisplayName();
                if (name == null || name.isBlank()) name = c.getUser().getUsername();
                c.setUserDisplayName(name);
            }
            if (c.getUser() != null && c.getUser().getImageUrl() != null) {
                c.setUserImageUrl(c.getUser().getImageUrl());
            }
        }
        return list;
    }

    @PostMapping
    public ResponseEntity<PostComment> create(@RequestBody PostComment entity) {
        if (entity.getId() != null) entity.setId(null);
        if (entity.getContent() == null || entity.getContent().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (entity.getPostId() != null) {
            postRepo.findById(entity.getPostId()).ifPresent(entity::setPost);
        }
        if (entity.getUserId() != null) {
            userRepo.findById(entity.getUserId()).ifPresent(entity::setUser);
        }
        if (entity.getPost() == null || entity.getUser() == null) {
            return ResponseEntity.badRequest().build();
        }
        PostComment saved = repo.save(entity);
        Post post = entity.getPost();
        post.setCommentCount((post.getCommentCount() != null ? post.getCommentCount() : 0) + 1);
        postRepo.save(post);
        if (saved.getUser() != null) {
            String name = saved.getUser().getDisplayName();
            if (name == null || name.isBlank()) name = saved.getUser().getUsername();
            saved.setUserDisplayName(name);
            if (saved.getUser().getImageUrl() != null) saved.setUserImageUrl(saved.getUser().getImageUrl());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
