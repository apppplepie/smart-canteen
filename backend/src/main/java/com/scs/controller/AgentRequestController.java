package com.scs.controller;

import com.scs.entity.AgentRequest;
import com.scs.repository.AgentRequestRepository;
import com.scs.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/agent-requests")
public class AgentRequestController {

    private final AgentRequestRepository repo;
    private final UserRepository userRepo;

    public AgentRequestController(AgentRequestRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    @GetMapping
    public List<AgentRequest> list() {
        return repo.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<AgentRequest> listByUser(@PathVariable Long userId) {
        return repo.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AgentRequest> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<AgentRequest> create(@RequestBody AgentRequest entity) {
        if (entity.getId() != null) entity.setId(null);
        if (entity.getUserId() != null) userRepo.findById(entity.getUserId()).ifPresent(entity::setUser);
        AgentRequest saved = repo.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AgentRequest> update(@PathVariable Long id, @RequestBody AgentRequest entity) {
        return repo.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    entity.setCreatedAt(existing.getCreatedAt());
                    if (entity.getUserId() != null) userRepo.findById(entity.getUserId()).ifPresent(entity::setUser);
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
