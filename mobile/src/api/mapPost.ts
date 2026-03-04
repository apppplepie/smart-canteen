import type { PostDto } from "@scs/api";
import type { SharedPost } from "../components/SharedPostDetail";
import { formatRelativeTime } from "../lib/utils";

const defaultAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=user";

/**
 * @param post - 接口返回的帖子
 * @param vendorName - 商家名称
 * @param baseUrl - API 根地址，用于拼 post.imageUrl 为完整图片 URL（如 http://localhost:8081）
 */
export function postToSharedPost(post: PostDto, vendorName?: string, baseUrl?: string): SharedPost {
  let image: string | undefined;
  if (post.imageUrl && baseUrl) {
    const base = baseUrl.replace(/\/$/, "");
    image = base + (post.imageUrl.startsWith("/") ? post.imageUrl : "/" + post.imageUrl);
  } else if (post.mediaUrls) {
    try {
      const urls = JSON.parse(post.mediaUrls) as string[];
      image = urls[0];
    } catch {
      image = undefined;
    }
  }
  const content = (post.content ?? "").trim();
  const title = (post.title ?? "").trim();
  return {
    id: post.id,
    user: { name: "用户", avatar: defaultAvatar },
    time: post.createdAt ? formatRelativeTime(post.createdAt) : undefined,
    postTime: post.createdAt,
    content: title ? `${title}\n${content}` : content,
    image,
    likes: post.likeCount ?? 0,
    comments: post.commentCount ?? 0,
    merchantId: post.vendorId,
    merchantName: vendorName,
    dishName: undefined,
    tags: undefined,
  };
}
