package com.scs.repository;

import com.scs.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    List<StockMovement> findByVendor_IdOrderByCreatedAtDesc(Long vendorId);
}
