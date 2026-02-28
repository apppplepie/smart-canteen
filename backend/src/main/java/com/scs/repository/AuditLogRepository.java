package com.scs.repository;

import com.scs.entity.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByActorIdOrderByCreatedAtDesc(Long actorId, Pageable pageable);

    List<AuditLog> findByObjectTypeAndObjectId(String objectType, String objectId);
}
