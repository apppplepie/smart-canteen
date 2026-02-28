package com.scs.repository;

import com.scs.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUser_IdOrderByPlacedAtDesc(Long userId);

    List<Order> findByVendor_IdOrderByPlacedAtDesc(Long vendorId);

    List<Order> findByStatus(String status);
}
