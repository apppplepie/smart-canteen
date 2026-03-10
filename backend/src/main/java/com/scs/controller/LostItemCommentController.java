package com.scs.controller;

import com.scs.entity.LostItem;
import com.scs.entity.LostItemComment;
import com.scs.repository.LostItemCommentRepository;
import com.scs.repository.LostItemRepository;
import com.scs.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lost-item-comments")
public class LostItemCommentController {

    private final LostItemCommentRepository repo;
    private final LostItemRepository lostItemRepo;
    private final UserRepository userRepo;

    public LostItemCommentController(LostItemCommentRepository repo, LostItemRepository lostItemRepo,
                                     UserRepository userRepo) {
        this.repo = repo;
        this.lostItemRepo = lostItemRepo;
        this.userRepo = userRepo;
    }

    @GetMapping("/lost-item/{lostItemId}")
    public List<LostItemComment> listByLostItem(@PathVariable Long lostItemId) {
        List<LostItemComment> list = repo.findByLostItem_IdOrderByCreatedAtAsc(lostItemId);
        for (LostItemComment c : list) {
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
    public ResponseEntity<LostItemComment> create(@RequestBody LostItemComment entity) {
        if (entity.getId() != null) entity.setId(null);
        if (entity.getContent() == null || entity.getContent().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (entity.getLostItemId() != null) {
            lostItemRepo.findById(entity.getLostItemId()).ifPresent(entity::setLostItem);
        }
        if (entity.getUserId() != null) {
            userRepo.findById(entity.getUserId()).ifPresent(entity::setUser);
        }
        if (entity.getLostItem() == null || entity.getUser() == null) {
            return ResponseEntity.badRequest().build();
        }
        LostItemComment saved = repo.save(entity);
        if (saved.getUser() != null) {
            String name = saved.getUser().getDisplayName();
            if (name == null || name.isBlank()) name = saved.getUser().getUsername();
            saved.setUserDisplayName(name);
            if (saved.getUser().getImageUrl() != null) saved.setUserImageUrl(saved.getUser().getImageUrl());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
