package com.scs.controller;

import com.scs.entity.OrderItem;
import com.scs.entity.Order;
import com.scs.entity.MenuItem;
import com.scs.repository.OrderItemRepository;
import com.scs.repository.OrderRepository;
import com.scs.repository.MenuItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/order-items")
public class OrderItemController {

    private final OrderItemRepository repo;
    private final OrderRepository orderRepo;
    private final MenuItemRepository menuItemRepo;

    public OrderItemController(OrderItemRepository repo, OrderRepository orderRepo, MenuItemRepository menuItemRepo) {
        this.repo = repo;
        this.orderRepo = orderRepo;
        this.menuItemRepo = menuItemRepo;
    }

    @GetMapping
    public List<OrderItem> list() {
        return repo.findAll();
    }

    @GetMapping("/order/{orderId}")
    public List<OrderItem> listByOrder(@PathVariable Long orderId) {
        return repo.findByOrderId(orderId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderItem> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<OrderItem> create(@RequestBody OrderItem entity) {
        if (entity.getId() != null) entity.setId(null);
        resolveRelations(entity);
        OrderItem saved = repo.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderItem> update(@PathVariable Long id, @RequestBody OrderItem entity) {
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

    private void resolveRelations(OrderItem entity) {
        Long oid = entity.getOrderId();
        Long mid = entity.getMenuItemId();
        if (oid != null) orderRepo.findById(oid).ifPresent(entity::setOrder);
        if (mid != null) menuItemRepo.findById(mid).ifPresent(entity::setMenuItem);
    }
}
