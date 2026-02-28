package com.scs.controller;

import com.scs.entity.QueueEntry;
import com.scs.repository.QueueEntryRepository;
import com.scs.repository.UserRepository;
import com.scs.repository.VendorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/queue-entries")
public class QueueEntryController {

    private final QueueEntryRepository repo;
    private final VendorRepository vendorRepo;
    private final UserRepository userRepo;

    public QueueEntryController(QueueEntryRepository repo, VendorRepository vendorRepo, UserRepository userRepo) {
        this.repo = repo;
        this.vendorRepo = vendorRepo;
        this.userRepo = userRepo;
    }

    @GetMapping
    public List<QueueEntry> list() {
        return repo.findAll();
    }

    @GetMapping("/vendor/{vendorId}")
    public List<QueueEntry> listByVendor(@PathVariable Long vendorId) {
        return repo.findByVendorIdOrderByCreatedAtAsc(vendorId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<QueueEntry> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<QueueEntry> create(@RequestBody QueueEntry entity) {
        if (entity.getId() != null) entity.setId(null);
        resolveRelations(entity);
        QueueEntry saved = repo.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<QueueEntry> update(@PathVariable Long id, @RequestBody QueueEntry entity) {
        return repo.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    entity.setCreatedAt(existing.getCreatedAt());
                    resolveRelations(entity);
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

    private void resolveRelations(QueueEntry entity) {
        Long vid = entity.getVendorId();
        Long uid = entity.getUserId();
        if (vid != null) vendorRepo.findById(vid).ifPresent(entity::setVendor);
        if (uid != null) userRepo.findById(uid).ifPresent(entity::setUser);
    }
}
