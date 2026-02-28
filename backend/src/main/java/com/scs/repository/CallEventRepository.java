package com.scs.repository;

import com.scs.entity.CallEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CallEventRepository extends JpaRepository<CallEvent, Long> {

    List<CallEvent> findByVendor_IdOrderByCreatedAtDesc(Long vendorId, Pageable pageable);

    List<CallEvent> findByQueueEntry_Id(Long queueEntryId);
}
