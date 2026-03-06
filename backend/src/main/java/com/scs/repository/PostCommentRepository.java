package com.scs.repository;

import com.scs.entity.PostComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {

    List<PostComment> findByPost_IdOrderByCreatedAtAsc(Long postId);
}
