package com.scs.repository;

import com.scs.entity.PostVectorIndex;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostVectorIndexRepository extends JpaRepository<PostVectorIndex, Long> {
    Optional<PostVectorIndex> findByPostId(Long postId);
}
