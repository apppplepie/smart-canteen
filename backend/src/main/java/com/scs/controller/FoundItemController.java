package com.scs.controller;

import com.scs.entity.FoundItem;
import com.scs.repository.FoundItemRepository;
import com.scs.repository.UserRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/found-items")
public class FoundItemController {

    private final FoundItemRepository repo;
    private final UserRepository userRepo;

    public FoundItemController(FoundItemRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    @GetMapping
    public List<FoundItem> list() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/user/{userId}")
    public List<FoundItem> listByUser(@PathVariable Long userId) {
        return repo.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    @GetMapping("/{id}")
    public FoundItem get(@PathVariable Long id) {
        return repo.findById(id).orElse(null);
    }

    @PostMapping
    public FoundItem create(@RequestBody FoundItem entity) {
        if (entity.getId() != null) entity.setId(null);
        resolveUser(entity);
        return repo.save(entity);
    }

    @PutMapping("/{id}")
    public FoundItem update(@PathVariable Long id, @RequestBody FoundItem patch) {
        return repo.findById(id)
                .map(existing -> {
                    if (patch.getTitle() != null && !patch.getTitle().isBlank()) {
                        existing.setTitle(patch.getTitle());
                    }
                    if (patch.getDescription() != null) {
                        existing.setDescription(patch.getDescription());
                    }
                    if (patch.getLocation() != null) {
                        existing.setLocation(patch.getLocation());
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

    private void resolveUser(FoundItem entity) {
        Long uid = entity.getUserId();
        if (uid != null) userRepo.findById(uid).ifPresent(entity::setUser);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }
}
