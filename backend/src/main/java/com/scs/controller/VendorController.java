package com.scs.controller;

import com.scs.entity.Vendor;
import com.scs.repository.VendorRepository;
import com.scs.repository.VendorReviewRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendors")
public class VendorController {

    private static final double DEFAULT_RATING_WHEN_EMPTY = 4.5;

    private final VendorRepository repo;
    private final VendorReviewRepository reviewRepo;

    public VendorController(VendorRepository repo, VendorReviewRepository reviewRepo) {
        this.repo = repo;
        this.reviewRepo = reviewRepo;
    }

    @GetMapping
    public List<Vendor> list() {
        List<Vendor> list = repo.findAll();
        for (Vendor v : list) {
            v.setAverageRating(reviewRepo.getAverageRatingByVendorId(v.getId())
                    .orElse(DEFAULT_RATING_WHEN_EMPTY));
        }
        return list;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vendor> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(v -> {
                    v.setAverageRating(reviewRepo.getAverageRatingByVendorId(v.getId())
                            .orElse(DEFAULT_RATING_WHEN_EMPTY));
                    return ResponseEntity.ok(v);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Vendor> create(@RequestBody Vendor entity) {
        if (entity.getId() != null) entity.setId(null);
        Vendor saved = repo.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vendor> update(@PathVariable Long id, @RequestBody Vendor entity) {
        return repo.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    entity.setCreatedAt(existing.getCreatedAt());
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
