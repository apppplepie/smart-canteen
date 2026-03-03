package com.scs.repository;

import com.scs.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {

    List<AiConversation> findByUser_IdOrderByUpdatedAtDesc(Long userId);

    List<AiConversation> findByUser_IdIsNullOrderByUpdatedAtDesc();
}
