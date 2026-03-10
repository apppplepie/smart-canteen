package com.scs.repository;

import com.scs.entity.LostItemComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LostItemCommentRepository extends JpaRepository<LostItemComment, Long> {

    List<LostItemComment> findByLostItem_IdOrderByCreatedAtAsc(Long lostItemId);
}
