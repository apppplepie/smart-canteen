package com.scs.repository;

import com.scs.entity.QueueEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface QueueEntryRepository extends JpaRepository<QueueEntry, Long> {

    List<QueueEntry> findByVendor_IdAndStatus(Long vendorId, String status);

    List<QueueEntry> findByVendor_IdOrderByCreatedAtAsc(Long vendorId);

    Page<QueueEntry> findByCreatedAtAfter(LocalDateTime since, Pageable pageable);
}
