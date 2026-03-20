package com.scs.repository;

import com.scs.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findByVendor_Id(Long vendorId);

    List<MenuItem> findByVendor_IdAndIsAvailableTrue(Long vendorId);

    @Query("SELECT m FROM MenuItem m JOIN FETCH m.vendor v WHERE m.id = :id")
    Optional<MenuItem> findByIdWithVendor(@Param("id") Long id);
}
