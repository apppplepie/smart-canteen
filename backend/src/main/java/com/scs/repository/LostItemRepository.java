package com.scs.repository;

import com.scs.entity.LostItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LostItemRepository extends JpaRepository<LostItem, Long> {

    List<LostItem> findAllByOrderByCreatedAtDesc();
}
