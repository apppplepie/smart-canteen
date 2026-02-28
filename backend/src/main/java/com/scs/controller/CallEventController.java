package com.scs.controller;

import com.scs.entity.CallEvent;
import com.scs.repository.CallEventRepository;
import com.scs.repository.QueueEntryRepository;
import com.scs.repository.VendorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/call-events")
public class CallEventController {

    private final CallEventRepository repo;
    private final QueueEntryRepository queueEntryRepo;
    private final VendorRepository vendorRepo;

    public CallEventController(CallEventRepository repo, QueueEntryRepository queueEntryRepo, VendorRepository vendorRepo) {
        this.repo = repo;
        this.queueEntryRepo = queueEntryRepo;
        this.vendorRepo = vendorRepo;
    }

    @GetMapping
    public List<CallEvent> list() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CallEvent> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<CallEvent> create(@RequestBody CallEvent entity) {
        if (entity.getId() != null) entity.setId(null);
        resolveRelations(entity);
        CallEvent saved = repo.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CallEvent> update(@PathVariable Long id, @RequestBody CallEvent entity) {
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

    private void resolveRelations(CallEvent entity) {
        Long qid = entity.getQueueEntryId();
        Long vid = entity.getVendorId();
        if (qid != null) queueEntryRepo.findById(qid).ifPresent(entity::setQueueEntry);
        if (vid != null) vendorRepo.findById(vid).ifPresent(entity::setVendor);
    }
}
