package com.scs.repository;

import com.scs.entity.AgentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AgentRequestRepository extends JpaRepository<AgentRequest, Long> {

    List<AgentRequest> findByUser_IdOrderByCreatedAtDesc(Long userId);
}
