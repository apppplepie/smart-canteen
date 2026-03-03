import React, { useState, useEffect } from "react";
import { ChevronLeft, Heart, MessageCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { THEME } from "../config/theme";
import { listPostsByUser } from "../api";
import { postToSharedPost } from "../api/mapPost";
import { getBaseUrl } from "../api/client";
import type { SharedPost } from "./SharedPostDetail";

const FALLBACK: SharedPost[] = [
  { id: 1, content: "今天一餐的麻辣烫太绝了！加了双份肥牛，汤底浓郁，简直是打工人的灵魂救赎 🍜✨", image: "https://picsum.photos/seed/p1/400/500", likes: 128, comments: 32, time: "2小时前" },
  { id: 2, content: "食堂新出的抹茶毛巾卷，口感绵密，抹茶味超浓郁，下午茶首选🍵", image: "https://picsum.photos/seed/p4/400/600", likes: 412, comments: 88, time: "昨天" },
];

export function MyPostsPage({ onBack, user }: { onBack: () => void; user: { name: string; id: string; avatar: string; userId?: number } }) {
  const [posts, setPosts] = useState<SharedPost[]>(FALLBACK);
  const [loading, setLoading] = useState(!!getBaseUrl());

  useEffect(() => {
    const base = getBaseUrl();
    const uid = user?.userId ?? 1;
    if (!base) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await listPostsByUser(uid);
        if (cancelled) return;
        const mapped = list.map((p) => postToSharedPost(p));
        setPosts(mapped.length ? mapped : FALLBACK);
      } catch {
        if (!cancelled) setPosts(FALLBACK);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.userId]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="fixed inset-0 bg-gray-50 z-[100] flex flex-col"
    >
      {/* Header */}
      <div 
        className="px-6 pt-6 pb-3 sticky top-0 z-10 shadow-sm flex items-center gap-4 text-white"
        style={{ backgroundColor: THEME.colors.primary }}
      >
        <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">我的动态</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-safe">
        <div className="max-w-2xl mx-auto space-y-4">
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 mb-6">
            <img
              src={user.avatar}
              alt="User"
              className="w-16 h-16 rounded-full border-2 border-white shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-500 mt-1">共发布 {posts.length} 条动态</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-[#FF6B6B]" />
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                >
                  {post.image && (
                    <img
                      src={post.image}
                      alt="Post"
                      className="w-full h-48 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="p-4">
                    <p className="text-sm text-gray-800 line-clamp-2 mb-3 leading-relaxed">
                      {post.content}
                    </p>
                    <div className="flex items-center justify-between text-gray-400">
                      <span className="text-xs">{post.time ?? post.postTime}</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Heart size={14} />
                          <span className="text-xs">{post.likes ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle size={14} />
                          <span className="text-xs">{post.comments ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
