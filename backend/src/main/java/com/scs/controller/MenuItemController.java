package com.scs.controller;

import com.scs.entity.MenuItem;
import com.scs.entity.Vendor;
import com.scs.repository.MenuItemRepository;
import com.scs.repository.VendorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu-items")
public class MenuItemController {

    private final MenuItemRepository repo;
    private final VendorRepository vendorRepo;

    public MenuItemController(MenuItemRepository repo, VendorRepository vendorRepo) {
        this.repo = repo;
        this.vendorRepo = vendorRepo;
    }

    @GetMapping
    public List<MenuItem> list() {
        return repo.findAll();
    }

    @GetMapping("/vendor/{vendorId}")
    public List<MenuItem> listByVendor(@PathVariable Long vendorId) {
        return repo.findByVendor_Id(vendorId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MenuItem> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<MenuItem> create(@RequestBody MenuItem entity) {
        if (entity.getId() != null) entity.setId(null);
        resolveVendor(entity);
        MenuItem saved = repo.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MenuItem> update(@PathVariable Long id, @RequestBody MenuItem entity) {
        return repo.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    entity.setCreatedAt(existing.getCreatedAt());
                    resolveVendor(entity);
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

    private void resolveVendor(MenuItem entity) {
        Long vid = entity.getVendorId();
        if (vid != null) vendorRepo.findById(vid).ifPresent(entity::setVendor);
    }
}
