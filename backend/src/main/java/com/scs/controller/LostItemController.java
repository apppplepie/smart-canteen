package com.scs.controller;

import com.scs.entity.LostItem;
import com.scs.entity.User;
import com.scs.repository.LostItemRepository;
import com.scs.repository.UserRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/lost-items")
public class LostItemController {

    private final LostItemRepository repo;
    private final UserRepository userRepo;

    public LostItemController(LostItemRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    @GetMapping
    public List<LostItem> list() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/{id}")
    public LostItem get(@PathVariable Long id) {
        return repo.findById(id).orElse(null);
    }

    @PostMapping
    public LostItem create(@RequestBody LostItem entity) {
        if (entity.getId() != null) entity.setId(null);
        resolveUser(entity);
        return repo.save(entity);
    }

    @PutMapping("/{id}")
    public LostItem update(@PathVariable Long id, @RequestBody LostItem entity) {
        return repo.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    entity.setCreatedAt(existing.getCreatedAt());
                    resolveUser(entity);
                    return repo.save(entity);
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
