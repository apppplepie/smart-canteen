import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, Share2, MapPin, Heart, MessageCircle, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { getBaseUrl } from "../api/client";
import { getPost, likePost, unlikePost } from "../api/posts";
import { listPostComments, createPostComment, type PostCommentDto } from "../api/postComments";
import { formatRelativeTime } from "../lib/utils";

export interface SharedPost {
  id: string | number;
  user?: { name: string; avatar: string };
  time?: string;
  postTime?: string;
  content: string;
  image?: string;
  likes?: number;
  comments?: number;
  merchantId?: number;
  merchantName?: string;
  dishName?: string;
  tags?: string[];
  type?: string;
  status?: string;
  reply?: string;
  location?: string;
  isFound?: boolean;
  isReturned?: boolean;
  likedByCurrentUser?: boolean;
}

interface SharedPostDetailProps {
  post: SharedPost;
  onMerchantClick?: (id: number) => void;
  currentUserId?: number;
  children?: React.ReactNode;
}

export function SharedPostDetail({ post, onMerchantClick, currentUserId, children }: SharedPostDetailProps) {
  const timeDisplay = post.time || post.postTime;
  const userDisplay = post.user || { name: "匿名用户", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=anon" };
  const postId = Number(post.id);
  const hasApi = !!getBaseUrl();
  const apiBase = (getBaseUrl() ?? "").replace(/\/$/, "");

  const [comments, setComments] = useState<PostCommentDto[]>([]);
  const [loadingComments, setLoadingComments] = useState(hasApi && !Number.isNaN(postId));
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liked, setLiked] = useState(!!post.likedByCurrentUser);
  const [likeCount, setLikeCount] = useState(post.likes ?? 0);
  const [commentCount, setCommentCount] = useState(post.comments ?? 0);
  const [togglingLike, setTogglingLike] = useState(false);

  const loadComments = useCallback(async () => {
    if (!hasApi || Number.isNaN(postId)) return;
    setLoadingComments(true);
    try {
      const list = await listPostComments(postId);
      setComments(list);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [hasApi, postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    if (hasApi && !Number.isNaN(postId) && currentUserId != null) {
      getPost(postId, currentUserId).then((p) => {
        if (p) {
          setLiked(!!p.likedByCurrentUser);
          if (p.likeCount != null) setLikeCount(p.likeCount);
          if (p.commentCount != null) setCommentCount(p.commentCount);
        }
      }).catch(() => {});
    }
  }, [hasApi, postId, currentUserId]);

  const handleLike = async () => {
    if (!hasApi || currentUserId == null || Number.isNaN(postId) || togglingLike) return;
    setTogglingLike(true);
    try {
      if (liked) {
        const p = await unlikePost(postId, currentUserId);
        setLiked(false);
        if (p.likeCount != null) setLikeCount(p.likeCount);
      } else {
        const p = await likePost(postId, currentUserId);
        setLiked(true);
        if (p.likeCount != null) setLikeCount(p.likeCount);
      }
    } catch {
      // keep state
    } finally {
      setTogglingLike(false);
    }
  };

  const handleSubmitComment = async () => {
    const text = commentText.trim();
    if (!text || currentUserId == null || !hasApi || Number.isNaN(postId) || submittingComment) return;
    setSubmittingComment(true);
    try {
      await createPostComment({ postId, userId: currentUserId, content: text });
      setCommentText("");
      setCommentCount((c) => c + 1);
      await loadComments();
    } catch (e) {
      alert("评论失败: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSubmittingComment(false);
    }
  };

  const canSendComment = !!commentText.trim() && currentUserId != null && !submittingComment;

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-white relative z-20">
      <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <img src={userDisplay.avatar} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" alt="" />
          <span className="font-medium text-gray-900">{userDisplay.name}</span>
        </div>
        <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-full">
          <Share2 size={20} />
        </button>
      </div>

      {post.image && (
        <img src={post.image} className="w-full h-auto max-h-[60vh] object-cover" referrerPolicy="no-referrer" alt="" />
      )}

      <div className="p-6">
        {post.merchantName && (
          <button
            onClick={() => onMerchantClick?.(post.merchantId!)}
            className="flex items-center gap-2 text-sm text-[#FF6B6B] bg-red-50 px-3 py-2 rounded-xl mb-4 hover:bg-red-100 transition-colors"
          >
            <MapPin size={16} />
            <span className="font-medium">{post.merchantName}</span>
            <span className="text-gray-400 mx-1">|</span>
            <span>{post.dishName}</span>
            <ChevronLeft size={16} className="rotate-180 ml-auto" />
          </button>
        )}

        {post.tags && (
          <div className="flex gap-2 mb-4">
            {post.tags.map((tag: string) => (
              <span
                key={tag}
                className={cn(
                  "text-xs px-3 py-1 rounded-lg font-bold",
                  tag === "寻物启事" ? "bg-orange-50 text-orange-500" : tag === "失物招领" ? "bg-blue-50 text-blue-500" : tag === "问题反馈" ? "bg-red-50 text-[#FF6B6B]" : "bg-gray-50 text-gray-500"
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <p className="text-gray-800 text-lg leading-relaxed mb-4">{post.content}</p>

        {children}

        <div className="text-sm text-gray-400 mb-6 mt-4">{timeDisplay}</div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="font-bold text-gray-900 mb-4">共 {commentCount} 条评论</h3>
          {loadingComments ? (
            <div className="flex justify-center py-4">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <ul className="space-y-4 mb-4">
              {comments.map((c) => {
                const avatarSrc =
                  c.userImageUrl != null && c.userImageUrl !== ""
                    ? c.userImageUrl.startsWith("http")
                      ? c.userImageUrl
                      : apiBase + (c.userImageUrl.startsWith("/") ? c.userImageUrl : "/" + c.userImageUrl)
                    : "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (c.userId ?? "u");
                return (
                <li key={c.id} className="flex gap-3">
                  <img
                    src={avatarSrc}
                    className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                    referrerPolicy="no-referrer"
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900">{c.userDisplayName ?? "用户"}</span>
                    <span className="text-xs text-gray-400 ml-2">{c.createdAt ? formatRelativeTime(c.createdAt) : ""}</span>
                    <p className="text-sm text-gray-800 mt-0.5 break-words">{c.content}</p>
                  </div>
                </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe flex items-center gap-3 px-4 z-50">
        <div className="flex-1 flex items-center bg-gray-100 rounded-full pl-4 pr-2 py-1.5 min-h-10">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="说点什么..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-500 focus:outline-none min-w-0"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmitComment()}
          />
        </div>
        <button
          disabled={!canSendComment}
          onClick={handleSubmitComment}
          className="flex-shrink-0 px-4 py-2 bg-[#FF6B6B] text-white text-sm font-medium rounded-full disabled:opacity-50 flex items-center gap-1"
        >
          {submittingComment ? <Loader2 size={18} className="animate-spin" /> : "发送"}
        </button>
        <div className="flex items-center gap-4 text-gray-600 flex-shrink-0">
          <button
            onClick={handleLike}
            disabled={!hasApi || currentUserId == null || togglingLike}
            className={cn("flex items-center gap-1 transition-colors", liked ? "text-red-500" : "hover:text-red-400")}
          >
            {togglingLike ? <Loader2 size={22} className="animate-spin" /> : <Heart size={22} className={liked ? "fill-current" : ""} />}
            <span className="text-sm">{likeCount}</span>
          </button>
          <div className="flex items-center gap-1">
            <MessageCircle size={22} />
            <span className="text-sm">{commentCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
