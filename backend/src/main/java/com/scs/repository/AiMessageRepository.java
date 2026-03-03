package com.scs.repository;

import com.scs.entity.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    List<AiMessage> findByConversation_IdOrderBySortOrderAscCreatedAtAsc(Long conversationId);

    @Query("SELECT COALESCE(MAX(m.sortOrder), 0) FROM AiMessage m WHERE m.conversation.id = :cid")
    int findMaxSortOrderByConversationId(@Param("cid") Long conversationId);
}
