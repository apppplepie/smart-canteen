package com.scs.controller;

import com.scs.entity.LostItem;
import com.scs.entity.User;
import com.scs.repository.LostItemCommentRepository;
import com.scs.repository.LostItemRepository;
import com.scs.repository.UserRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/lost-items")
public class LostItemController {

    private final LostItemRepository repo;
    private final LostItemCommentRepository commentRepo;
    private final UserRepository userRepo;

    public LostItemController(LostItemRepository repo, LostItemCommentRepository commentRepo, UserRepository userRepo) {
        this.repo = repo;
        this.commentRepo = commentRepo;
        this.userRepo = userRepo;
    }

    @GetMapping
    public List<LostItem> list() {
        List<LostItem> list = repo.findAllByOrderByCreatedAtDesc();
        for (LostItem item : list) {
            item.setCommentCount((int) commentRepo.countByLostItem_Id(item.getId()));
        }
        return list;
    }

    @GetMapping("/user/{userId}")
    public List<LostItem> listByUser(@PathVariable Long userId) {
        List<LostItem> list = repo.findByUser_IdOrderByCreatedAtDesc(userId);
        for (LostItem item : list) {
            item.setCommentCount((int) commentRepo.countByLostItem_Id(item.getId()));
        }
        return list;
    }

    @GetMapping("/{id}")
    public LostItem get(@PathVariable Long id) {
        return repo.findById(id)
                .map(item -> {
                    item.setCommentCount((int) commentRepo.countByLostItem_Id(item.getId()));
                    return item;
                })
                .orElse(null);
    }

    @PostMapping
    public LostItem create(@RequestBody LostItem entity) {
        if (entity.getId() != null) entity.setId(null);
        resolveUser(entity);
        return repo.save(entity);
    }

    @PutMapping("/{id}")
    public LostItem update(@PathVariable Long id, @RequestBody LostItem patch) {
        return repo.findById(id)
                .map(existing -> {
                    if (patch.getItemName() != null && !patch.getItemName().isBlank()) {
                        existing.setItemName(patch.getItemName());
                    }
                    if (patch.getDescription() != null) {
                        existing.setDescription(patch.getDescription());
                    }
                    if (patch.getLocation() != null) {
                        existing.setLocation(patch.getLocation());
                    }
                    if (patch.getUserName() != null) {
                        existing.setUserName(patch.getUserName());
                    }
                    if (patch.getImageUrl() != null) {
                        existing.setImageUrl(patch.getImageUrl());
                    }
                    if (patch.getStatus() != null && !patch.getStatus().isBlank()) {
                        existing.setStatus(patch.getStatus());
                    }
                    if (patch.getUserId() != null) {
                        existing.setUserId(patch.getUserId());
                        resolveUser(existing);
                    }
                    return repo.save(existing);
                })
                .orElse(null);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }

    private void resolveUser(LostItem entity) {
        Long uid = entity.getUserId();
        if (uid != null) userRepo.findById(uid).ifPresent(entity::setUser);
    }
}
