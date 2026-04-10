package com.scs.repository;

import com.scs.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByUser_IdOrderByCreatedAtDesc(Long userId);

    List<Post> findByUser_IdAndPostTypeOrderByCreatedAtDesc(Long userId, String postType);

    List<Post> findByVendor_IdOrderByCreatedAtDesc(Long vendorId);

    List<Post> findByPostTypeOrderByCreatedAtDesc(String postType);

    /** 食堂反馈（post_type=feedback）且官方尚未填写 reply_content（null 或空串），按时间升序便于先处理早提交的 */
    @Query("SELECT p FROM Post p WHERE p.postType = :postType AND (p.replyContent IS NULL OR p.replyContent = '') ORDER BY p.createdAt ASC")
    List<Post> findByPostTypeAndNoOfficialReply(@Param("postType") String postType);
}
