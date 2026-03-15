package com.scs.repository;

import com.scs.entity.OrderItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrder_Id(Long orderId);

    Page<OrderItem> findByOrder_User_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
