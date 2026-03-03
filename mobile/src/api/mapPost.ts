import type { Post } from "./types";
import type { SharedPost } from "../components/SharedPostDetail";
import { formatRelativeTime } from "../lib/utils";

const defaultAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=user";

export function postToSharedPost(post: Post, vendorName?: string): SharedPost {
  let image: string | undefined;
  if (post.mediaUrls) {
    try {
      const urls = JSON.parse(post.mediaUrls) as string[];
      image = urls[0];
    } catch {
      image = undefined;
    }
  }
  return {
    id: post.id,
    user: { name: "用户", avatar: defaultAvatar },
    time: post.createdAt ? formatRelativeTime(post.createdAt) : undefined,
    postTime: post.createdAt,
    content: post.title ? `${post.title}\n${post.content}` : post.content,
    image,
    likes: post.likeCount ?? 0,
    comments: post.commentCount ?? 0,
    merchantId: post.vendorId,
    merchantName: vendorName,
    dishName: undefined,
    tags: undefined,
  };
}
