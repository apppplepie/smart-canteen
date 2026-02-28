package com.scs.controller;

import com.scs.entity.SensorLog;
import com.scs.repository.SensorLogRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sensor-logs")
public class SensorLogController {

    private final SensorLogRepository repo;

    public SensorLogController(SensorLogRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<SensorLog> list() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SensorLog> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<SensorLog> create(@RequestBody SensorLog entity) {
        if (entity.getId() != null) entity.setId(null);
        SensorLog saved = repo.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SensorLog> update(@PathVariable Long id, @RequestBody SensorLog entity) {
        return repo.findById(id)
                .map(existing -> {
                    entity.setId(id);
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
