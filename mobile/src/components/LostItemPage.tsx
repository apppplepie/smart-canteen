import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, Image as ImageIcon, MapPin, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { formatRelativeTime } from "../lib/utils";
import { SharedPostDetail } from "./SharedPostDetail";
import { lostItemHistoryMock } from "../mocks/lostItem";
import { listLostItemsByUser, createLostItem, updateLostItem } from "../api/lostItems";
import { getBaseUrl } from "../api/client";

export type LostItemRow = {
  id: number;
  user: { name: string; avatar: string };
  content: string;
  image: string;
  location: string;
  time: string;
  isFound: boolean;
  postTime: string;
};

function formatLostTime(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function LostItemPage({ onBack, userId }: { onBack: () => void; userId?: number }) {
  const [activeTab, setActiveTab] = useState<"发布" | "历史">("发布");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishError, setPublishError] = useState("");

  const [history, setHistory] = useState<LostItemRow[]>(lostItemHistoryMock);
  const [loading, setLoading] = useState(!!getBaseUrl() && userId != null);
  const [selectedPost, setSelectedPost] = useState<LostItemRow | null>(null);

  const fetchHistory = useCallback(async () => {
    const base = getBaseUrl();
    if (!base || userId == null) {
      setLoading(false);
      return;
    }
    try {
      const list = await listLostItemsByUser(userId);
      const rows: LostItemRow[] = list.map((l) => ({
        id: l.id,
        user: { name: l.userName ?? "我", avatar: "https://picsum.photos/seed/me/100/100" },
        content: l.description?.trim() || l.itemName || "",
        image: "https://picsum.photos/seed/umbrella/400/300",
        location: l.location ?? "",
        time: formatLostTime(l.createdAt),
        isFound: (l as { status?: string }).status === "found",
        postTime: l.createdAt ? formatRelativeTime(l.createdAt) : "",
      }));
      setHistory(rows.length ? rows : lostItemHistoryMock);
    } catch {
      setHistory(lostItemHistoryMock);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleBack = () => {
    if (selectedPost) {
      setSelectedPost(null);
    } else {
      onBack();
    }
  };

  const toggleFound = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = history.find((h) => h.id === id);
    if (!item) return;
    const nextFound = !item.isFound;
    setHistory(history.map((h) => (h.id === id ? { ...h, isFound: nextFound } : h)));
    const base = getBaseUrl();
    if (base) {
      try {
        await updateLostItem(id, { status: nextFound ? "found" : "pending" } as any);
      } catch {
        setHistory(history.map((h) => (h.id === id ? { ...h, isFound: !nextFound } : h)));
      }
    }
  };

  const handlePublish = async () => {
    if (!content.trim()) return;
    setPublishError("");
    setPublishLoading(true);
    try {
      if (getBaseUrl() && userId != null) {
        await createLostItem({
          userId,
          itemName: content.slice(0, 50),
          description: content,
          location: location.trim() || undefined,
          userName: "我",
        });
        await fetchHistory();
        setContent("");
        setLocation("");
        setTime("");
        setActiveTab("历史");
      } else {
        const newItem: LostItemRow = {
          id: Date.now(),
          user: { name: "我", avatar: "https://picsum.photos/seed/me/100/100" },
          content,
          image: "https://picsum.photos/seed/umbrella/400/300",
          location,
          time: time || "刚刚",
          isFound: false,
          postTime: "刚刚",
        };
        setHistory((prev) => [newItem, ...prev]);
        setContent("");
        setLocation("");
        setTime("");
        setActiveTab("历史");
      }
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "发布失败");
    } finally {
      setPublishLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-gray-50 z-[100] flex flex-col"
    >
      <div className="bg-white px-4 pt-6 pb-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button onClick={handleBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-full">
          <ChevronLeft size={24} />
        </button>
        {selectedPost ? (
          <span className="font-bold">寻物详情</span>
        ) : (
          <div className="flex bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setActiveTab("发布")}
              className={cn("px-4 py-1.5 rounded-full text-sm font-bold transition-colors", activeTab === "发布" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}
            >
              发布寻物
            </button>
            <button
              onClick={() => setActiveTab("历史")}
              className={cn("px-4 py-1.5 rounded-full text-sm font-bold transition-colors", activeTab === "历史" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}
            >
              我的寻物
            </button>
          </div>
        )}
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          {selectedPost ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 bg-white z-20 flex flex-col"
            >
              <SharedPostDetail post={{ ...selectedPost, tags: ["寻物启事"] }}>
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="text-[#FF6B6B]" />
                    <span>丢失地点：{selectedPost.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} className="text-blue-500" />
                    <span>丢失时间：{selectedPost.time}</span>
                  </div>
                </div>
              </SharedPostDetail>
            </motion.div>
          ) : activeTab === "发布" ? (
            <motion.div key="publish" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-2xl mx-auto p-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                {publishError ? <div className="text-sm text-red-500 mb-4">{publishError}</div> : null}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="描述您丢失的物品特征..."
                  className="w-full h-32 bg-gray-50 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/50 transition-all border border-gray-100 resize-none mb-4"
                />
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <button type="button" className="aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-gray-300 transition-all">
                    <ImageIcon size={28} className="mb-2" />
                    <span className="text-xs font-medium">添加照片</span>
                  </button>
                </div>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                    <MapPin size={20} className="text-gray-400" />
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="丢失位置 (如: 一楼东区)" className="bg-transparent border-none focus:outline-none text-sm w-full" />
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                    <Clock size={20} className="text-gray-400" />
                    <input type="text" value={time} onChange={(e) => setTime(e.target.value)} placeholder="丢失时间 (如: 昨天中午12点)" className="bg-transparent border-none focus:outline-none text-sm w-full" />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!content.trim() || publishLoading}
                  onClick={handlePublish}
                  className="w-full bg-[#FF6B6B] text-white py-3 rounded-2xl font-bold text-sm disabled:opacity-50 transition-colors shadow-sm"
                >
                  {publishLoading ? "发布中…" : "发布寻物启事"}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 max-w-2xl mx-auto p-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={28} className="animate-spin text-[#FF6B6B]" />
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} onClick={() => setSelectedPost(item)} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-red-50 text-[#FF6B6B] rounded-lg text-xs font-bold">寻物</span>
                        <span className="text-xs text-gray-400">{item.postTime}</span>
                      </div>
                      <button
                        onClick={(e) => toggleFound(item.id, e)}
                        className={cn("px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1", item.isFound ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                      >
                        {item.isFound ? <CheckCircle2 size={14} /> : null}
                        {item.isFound ? "已找回" : "标记为已找回"}
                      </button>
                    </div>
                    <p className="text-gray-800 text-sm mb-3 line-clamp-2">{item.content}</p>
                    {item.image && <img src={item.image} className="w-full h-32 object-cover rounded-xl mb-3" referrerPolicy="no-referrer" alt="" />}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin size={12} /> {item.location}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {item.time}</span>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
