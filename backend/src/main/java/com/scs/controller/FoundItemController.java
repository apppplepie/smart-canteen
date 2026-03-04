package com.scs.controller;

import com.scs.entity.FoundItem;
import com.scs.repository.FoundItemRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/found-items")
public class FoundItemController {

    private final FoundItemRepository repo;

    public FoundItemController(FoundItemRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<FoundItem> list() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/{id}")
    public FoundItem get(@PathVariable Long id) {
        return repo.findById(id).orElse(null);
    }

    @PostMapping
    public FoundItem create(@RequestBody FoundItem entity) {
        if (entity.getId() != null) entity.setId(null);
        return repo.save(entity);
    }

    @PutMapping("/{id}")
    public FoundItem update(@PathVariable Long id, @RequestBody FoundItem entity) {
        return repo.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    entity.setCreatedAt(existing.getCreatedAt());
                    return repo.save(entity);
                })
                .orElse(null);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }
}
