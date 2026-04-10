package com.scs.repository;

import com.scs.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByUser_IdOrderByCreatedAtDesc(Long userId);

    List<Post> findByUser_IdAndPostTypeOrderByCreatedAtDesc(Long userId, String postType);

    List<Post> findByVendor_IdOrderByCreatedAtDesc(Long vendorId);

    List<Post> findByPostTypeOrderByCreatedAtDesc(String postType);

    /**
     * 待官方回复：读 posts 表，无有效官方回复（null / 空 / 仅空白）；
     * post_type 为 null、空 或 feedback（与库中反馈行一致，兼容旧数据）。
     */
    @Query("SELECT p FROM Post p WHERE (p.postType IS NULL OR p.postType = '' OR p.postType = 'feedback') "
            + "AND (p.replyContent IS NULL OR TRIM(p.replyContent) = '') ORDER BY p.createdAt ASC")
    List<Post> findFeedbackPendingOfficialReply();
}
