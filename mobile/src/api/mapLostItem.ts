import type { LostItemDto } from "@scs/api";
import type { SharedPost } from "../components/SharedPostDetail";
import { formatRelativeTime } from "../lib/utils";

/**
 * 将 lost_items 接口数据转为食堂圈用的 SharedPost，id 使用 "lost-{id}" 以区分帖子
 */
export function lostItemToSharedPost(item: LostItemDto, baseUrl?: string): SharedPost {
  const base = baseUrl ? baseUrl.replace(/\/$/, "") : "";
  let image: string | undefined;
  if (item.imageUrl != null && item.imageUrl !== "") {
    image = item.imageUrl.startsWith("http")
      ? item.imageUrl
      : base + (item.imageUrl.startsWith("/") ? item.imageUrl : "/" + item.imageUrl);
  }
  const content = [item.itemName, item.location, item.description]
    .filter(Boolean)
    .join("\n");
  return {
    id: "lost-" + item.id,
    user: { name: item.userName ?? "匿名", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lost" },
    time: item.createdAt ? formatRelativeTime(item.createdAt) : undefined,
    postTime: item.createdAt,
    content: content || "寻物启事",
    image,
    likes: 0,
    comments: 0,
    tags: ["寻物启事"],
  };
}
