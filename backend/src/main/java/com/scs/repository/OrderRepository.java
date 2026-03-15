package com.scs.repository;

import com.scs.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUser_IdOrderByPlacedAtDesc(Long userId);

    Page<Order> findByUser_IdOrderByPlacedAtDesc(Long userId, Pageable pageable);

    List<Order> findByVendor_IdOrderByPlacedAtDesc(Long vendorId);

    List<Order> findByStatus(String status);

    /** 校验评分时：订单是否属于该用户且属于该商家 */
    @Query("SELECT o.user.id, o.vendor.id FROM Order o WHERE o.id = :orderId")
    Optional<Object[]> findUserAndVendorIdsById(@Param("orderId") Long orderId);
}
