package com.scs.controller;

import com.scs.entity.RetainedSample;
import com.scs.repository.RetainedSampleRepository;
import com.scs.repository.VendorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/retained-samples")
public class RetainedSampleController {

    private final RetainedSampleRepository repo;
    private final VendorRepository vendorRepo;

    public RetainedSampleController(RetainedSampleRepository repo, VendorRepository vendorRepo) {
        this.repo = repo;
        this.vendorRepo = vendorRepo;
    }

    @GetMapping
    public List<RetainedSample> list() {
        return repo.findAll();
    }

    @GetMapping("/vendor/{vendorId}")
    public List<RetainedSample> listByVendor(@PathVariable Long vendorId) {
        return repo.findByVendor_Id(vendorId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RetainedSample> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<RetainedSample> create(@RequestBody RetainedSample entity) {
        if (entity.getId() != null) entity.setId(null);
        if (entity.getVendorId() != null) vendorRepo.findById(entity.getVendorId()).ifPresent(entity::setVendor);
        RetainedSample saved = repo.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RetainedSample> update(@PathVariable Long id, @RequestBody RetainedSample entity) {
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
