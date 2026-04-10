package com.scs.controller.v1;

import com.scs.dto.ApiResult;
import com.scs.entity.Post;
import com.scs.repository.PostRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 管理端：待官方回复的食堂反馈、提交官方回复（与 admin 约定 ApiResult）。
 */
@RestController
@RequestMapping("/api/v1/admin/feedback")
public class AdminFeedbackController {

    private final PostRepository postRepo;

    public AdminFeedbackController(PostRepository postRepo) {
        this.postRepo = postRepo;
    }

    /** 官方尚未回复的反馈列表（posts.post_type=feedback，reply_content 为空） */
    @GetMapping("/pending-replies")
    public ApiResult<List<Post>> pendingReplies() {
        List<Post> list = postRepo.findByPostTypeAndNoOfficialReply("feedback");
        enrichWithUser(list);
        return ApiResult.ok(list);
    }

    /** 提交官方回复，并标记为已回复 */
    @PatchMapping("/{id}/reply")
    public ApiResult<Post> officialReply(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String reply = body != null ? body.get("replyContent") : null;
        if (reply == null || reply.isBlank()) {
            return ApiResult.fail(400, "replyContent 不能为空");
        }
        return postRepo.findById(id)
                .map(post -> {
                    if (!"feedback".equals(post.getPostType())) {
                        return ApiResult.<Post>fail(400, "非反馈类型帖子");
                    }
                    post.setReplyContent(reply.trim());
                    post.setStatus("replied");
                    Post saved = postRepo.save(post);
                    enrichWithUser(List.of(saved));
                    return ApiResult.ok(saved);
                })
                .orElse(ApiResult.fail(404, "帖子不存在"));
    }

    private void enrichWithUser(List<Post> list) {
        for (Post p : list) {
            if (p.getUser() != null) {
                var u = p.getUser();
                String name = u.getDisplayName();
                if (name == null || name.isBlank()) {
                    name = u.getUsername();
                }
                p.setUserDisplayName(name);
                p.setUserImageUrl(u.getImageUrl());
            }
        }
    }
}
