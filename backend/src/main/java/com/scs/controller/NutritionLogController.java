package com.scs.controller;

import com.scs.entity.NutritionLog;
import com.scs.repository.NutritionLogRepository;
import com.scs.repository.OrderRepository;
import com.scs.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/nutrition-logs")
public class NutritionLogController {

    private final NutritionLogRepository repo;
    private final UserRepository userRepo;
    private final OrderRepository orderRepo;

    public NutritionLogController(NutritionLogRepository repo, UserRepository userRepo, OrderRepository orderRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
        this.orderRepo = orderRepo;
    }

    @GetMapping
    public List<NutritionLog> list() {
        return repo.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<NutritionLog> listByUser(@PathVariable Long userId) {
        return repo.findByUser_IdOrderByRecordedAtDesc(userId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NutritionLog> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<NutritionLog> create(@RequestBody NutritionLog entity) {
        if (entity.getId() != null) entity.setId(null);
        resolveRelations(entity);
        NutritionLog saved = repo.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<NutritionLog> update(@PathVariable Long id, @RequestBody NutritionLog entity) {
        return repo.findById(id)
                .map(existing -> {
                    entity.setId(id);
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

    private void resolveRelations(NutritionLog entity) {
        Long uid = entity.getUserId();
        Long oid = entity.getOrderId();
        if (uid != null) userRepo.findById(uid).ifPresent(entity::setUser);
        if (oid != null) orderRepo.findById(oid).ifPresent(entity::setOrder);
    }
}
