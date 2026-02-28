package com.scs.controller;

import com.scs.entity.Order;
import com.scs.repository.OrderRepository;
import com.scs.repository.UserRepository;
import com.scs.repository.VendorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository repo;
    private final UserRepository userRepo;
    private final VendorRepository vendorRepo;

    public OrderController(OrderRepository repo, UserRepository userRepo, VendorRepository vendorRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
        this.vendorRepo = vendorRepo;
    }

    @GetMapping
    public List<Order> list() {
        return repo.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<Order> listByUser(@PathVariable Long userId) {
        return repo.findByUser_IdOrderByPlacedAtDesc(userId);
    }

    @GetMapping("/vendor/{vendorId}")
    public List<Order> listByVendor(@PathVariable Long vendorId) {
        return repo.findByVendor_IdOrderByPlacedAtDesc(vendorId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Order> create(@RequestBody Order entity) {
        if (entity.getId() != null) entity.setId(null);
        resolveRelations(entity);
        Order saved = repo.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Order> update(@PathVariable Long id, @RequestBody Order entity) {
        return repo.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    entity.setPlacedAt(existing.getPlacedAt());
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

    private void resolveRelations(Order entity) {
        Long uid = entity.getUserId();
        Long vid = entity.getVendorId();
        if (uid != null) userRepo.findById(uid).ifPresent(entity::setUser);
        if (vid != null) vendorRepo.findById(vid).ifPresent(entity::setVendor);
    }
}
