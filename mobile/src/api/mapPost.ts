import type { PostDto } from "@scs/api";
import type { SharedPost } from "../components/SharedPostDetail";
import { formatRelativeTime } from "../lib/utils";

const defaultAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=user";

/**
 * @param post - 接口返回的帖子
 * @param vendorName - 商家名称
 * @param baseUrl - API 根地址，用于拼 post.imageUrl / post.userImageUrl 为完整 URL
 */
export function postToSharedPost(post: PostDto, vendorName?: string, baseUrl?: string): SharedPost {
  let image: string | undefined;
  if (post.imageUrl && baseUrl) {
    const base = baseUrl.replace(/\/$/, "");
    image = post.imageUrl.startsWith("http") ? post.imageUrl : base + (post.imageUrl.startsWith("/") ? post.imageUrl : "/" + post.imageUrl);
  } else if (post.mediaUrls) {
    try {
      const urls = JSON.parse(post.mediaUrls) as string[];
      image = urls[0];
    } catch {
      image = undefined;
    }
  }
  const base = baseUrl ? baseUrl.replace(/\/$/, "") : "";
  const avatar =
    post.userImageUrl != null && post.userImageUrl !== ""
      ? post.userImageUrl.startsWith("http")
        ? post.userImageUrl
        : base + (post.userImageUrl.startsWith("/") ? post.userImageUrl : "/" + post.userImageUrl)
      : defaultAvatar;
  const content = (post.content ?? "").trim();
  const title = (post.title ?? "").trim();
  const fullText = (title + "\n" + content).toLowerCase();
  const tags: string[] = [];
  if (post.postType === "feedback") {
    const feedbackLabels: Record<string, string> = {
      food: "菜品建议",
      service: "服务态度",
      env: "环境卫生",
      other: "其他",
    };
    tags.push(feedbackLabels[post.feedbackType ?? ""] ?? "问题反馈");
  }
  if (fullText.includes("寻物启事")) tags.push("寻物启事");
  if (fullText.includes("失物招领")) tags.push("失物招领");

  return {
    id: post.id,
    user: { name: post.userDisplayName ?? "用户", avatar },
    time: post.createdAt ? formatRelativeTime(post.createdAt) : undefined,
    postTime: post.createdAt,
    content: title ? `${title}\n${content}` : content,
    image,
    likes: post.likeCount ?? 0,
    comments: post.commentCount ?? 0,
    merchantId: post.vendorId,
    merchantName: vendorName,
    dishName: undefined,
    tags: tags.length > 0 ? tags : undefined,
    rating: post.rating != null && post.rating >= 1 && post.rating <= 5 ? post.rating : undefined,
  };
}
