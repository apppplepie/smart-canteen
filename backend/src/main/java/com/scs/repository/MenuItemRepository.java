package com.scs.repository;

import com.scs.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findByVendor_Id(Long vendorId);

    List<MenuItem> findByVendor_IdAndIsAvailableTrue(Long vendorId);
}
