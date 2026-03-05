package com.scs.controller;

import com.scs.entity.Material;
import com.scs.repository.MaterialRepository;
import com.scs.repository.VendorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/materials")
public class MaterialController {

    private final MaterialRepository repo;
    private final VendorRepository vendorRepo;

    public MaterialController(MaterialRepository repo, VendorRepository vendorRepo) {
        this.repo = repo;
        this.vendorRepo = vendorRepo;
    }

    @GetMapping
    public List<Material> list() {
        return repo.findAll();
    }

    @GetMapping("/vendor/{vendorId}")
    public List<Material> listByVendor(@PathVariable Long vendorId) {
        return repo.findByVendor_Id(vendorId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Material> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
