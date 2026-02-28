package com.scs.controller;

import com.scs.entity.StockMovement;
import com.scs.repository.StockMovementRepository;
import com.scs.repository.VendorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-movements")
public class StockMovementController {

    private final StockMovementRepository repo;
    private final VendorRepository vendorRepo;

    public StockMovementController(StockMovementRepository repo, VendorRepository vendorRepo) {
        this.repo = repo;
        this.vendorRepo = vendorRepo;
    }

    @GetMapping
    public List<StockMovement> list() {
        return repo.findAll();
    }

    @GetMapping("/vendor/{vendorId}")
    public List<StockMovement> listByVendor(@PathVariable Long vendorId) {
        return repo.findByVendorIdOrderByCreatedAtDesc(vendorId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockMovement> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<StockMovement> create(@RequestBody StockMovement entity) {
        if (entity.getId() != null) entity.setId(null);
        if (entity.getVendorId() != null) vendorRepo.findById(entity.getVendorId()).ifPresent(entity::setVendor);
        StockMovement saved = repo.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StockMovement> update(@PathVariable Long id, @RequestBody StockMovement entity) {
        return repo.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    entity.setCreatedAt(existing.getCreatedAt());
                    if (entity.getVendorId() != null) vendorRepo.findById(entity.getVendorId()).ifPresent(entity::setVendor);
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
}
