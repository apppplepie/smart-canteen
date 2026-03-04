package com.scs.repository;

import com.scs.entity.FoundItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FoundItemRepository extends JpaRepository<FoundItem, Long> {

    List<FoundItem> findAllByOrderByCreatedAtDesc();
}
