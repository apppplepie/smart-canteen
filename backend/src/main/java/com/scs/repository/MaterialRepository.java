package com.scs.repository;

import com.scs.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaterialRepository extends JpaRepository<Material, Long> {

    List<Material> findByVendor_Id(Long vendorId);
}
