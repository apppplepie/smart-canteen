package com.scs.repository;

import com.scs.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByUser_IdOrderByCreatedAtDesc(Long userId);

    List<Post> findByUser_IdAndPostTypeOrderByCreatedAtDesc(Long userId, String postType);

    List<Post> findByVendor_IdOrderByCreatedAtDesc(Long vendorId);

    List<Post> findByPostTypeOrderByCreatedAtDesc(String postType);
}
