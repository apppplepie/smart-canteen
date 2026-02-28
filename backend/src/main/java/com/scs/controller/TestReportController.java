package com.scs.controller;

import com.scs.entity.TestReport;
import com.scs.repository.TestReportRepository;
import com.scs.repository.VendorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/test-reports")
public class TestReportController {

    private final TestReportRepository repo;
    private final VendorRepository vendorRepo;

    public TestReportController(TestReportRepository repo, VendorRepository vendorRepo) {
        this.repo = repo;
        this.vendorRepo = vendorRepo;
    }

    @GetMapping
    public List<TestReport> list() {
        return repo.findAll();
    }

    @GetMapping("/vendor/{vendorId}")
    public List<TestReport> listByVendor(@PathVariable Long vendorId) {
        return repo.findByVendor_IdOrderByTestedAtDesc(vendorId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TestReport> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TestReport> create(@RequestBody TestReport entity) {
        if (entity.getId() != null) entity.setId(null);
        if (entity.getVendorId() != null) vendorRepo.findById(entity.getVendorId()).ifPresent(entity::setVendor);
        TestReport saved = repo.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TestReport> update(@PathVariable Long id, @RequestBody TestReport entity) {
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
