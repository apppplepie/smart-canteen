package com.scs.repository;

import com.scs.entity.CanteenDailySnapshot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CanteenDailySnapshotRepository extends JpaRepository<CanteenDailySnapshot, Long> {

    Page<CanteenDailySnapshot> findByScopeTypeAndScopeIdOrderBySnapshotDateDesc(
            String scopeType, long scopeId, Pageable pageable);
}
