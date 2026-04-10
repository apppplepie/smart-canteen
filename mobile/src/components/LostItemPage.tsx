import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, Image as ImageIcon, MapPin, Clock, CheckCircle2, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { formatRelativeTime } from "../lib/utils";
import { SharedPostDetail } from "./SharedPostDetail";
import { listLostItemsByUser, createLostItem, updateLostItem } from "../api/lostItems";
import { getBaseUrl, isApiConfigured } from "../api/client";
import { uploadImageFile } from "../api/upload";
import type { LostItemDto } from "@scs/api";

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

function mapDtoToRow(l: LostItemDto, base: string): LostItemRow {
  const baseNorm = base.replace(/\/$/, "");
  let image = "";
  const raw = l.imageUrl?.trim();
  if (raw) {
    image = raw.startsWith("http") ? raw : baseNorm + (raw.startsWith("/") ? raw : `/${raw}`);
  }
  return {
    id: l.id,
    user: { name: l.userName ?? "我", avatar: "https://picsum.photos/seed/me/100/100" },
    content: l.description?.trim() || l.itemName || "",
    image,
    location: l.location ?? "",
    time: formatLostTime(l.createdAt),
    isFound: (l.status ?? "").toLowerCase() === "found",
    postTime: l.createdAt ? formatRelativeTime(l.createdAt) : "",
  };
}

export function LostItemPage({ onBack, userId }: { onBack: () => void; userId?: number }) {
  const [activeTab, setActiveTab] = useState<"发布" | "历史">("发布");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishError, setPublishError] = useState("");

  const [history, setHistory] = useState<LostItemRow[]>([]);
  const [loading, setLoading] = useState(isApiConfigured() && userId != null);
  const [selectedPost, setSelectedPost] = useState<LostItemRow | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const loadList = useCallback(async (showLoading: boolean) => {
    if (!isApiConfigured() || userId == null) {
      setLoading(false);
      return;
    }
    const base = getBaseUrl();
    if (showLoading) setLoading(true);
    try {
      const list = await listLostItemsByUser(userId);
      const rows = list.map((l) => mapDtoToRow(l, base));
      setHistory(rows);
    } catch {
      /* 保留当前列表，避免覆盖刚发布的条目 */
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadList(true);
  }, [loadList]);

  const handleBack = () => {
    if (selectedPost) {
      setSelectedPost(null);
    } else {
      onBack();
    }
  };

  const clearPickedImage = () => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPickedFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    if (f.size > 8 * 1024 * 1024) {
      setPublishError("图片请小于 8MB");
      return;
    }
    setPublishError("");
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPickedFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const toggleFound = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = history.find((h) => h.id === id);
    if (!item) return;
    const nextFound = !item.isFound;
    setHistory(history.map((h) => (h.id === id ? { ...h, isFound: nextFound } : h)));
    if (!isApiConfigured()) return;
    try {
      await updateLostItem(id, { status: nextFound ? "found" : "pending" });
    } catch {
      setHistory(history.map((h) => (h.id === id ? { ...h, isFound: !nextFound } : h)));
    }
  };

  const handlePublish = async () => {
    if (!content.trim()) return;
    setPublishError("");
    if (isApiConfigured() && userId == null) {
      setPublishError("请先登录后再发布");
      return;
    }
    setPublishLoading(true);
    try {
      if (isApiConfigured() && userId != null) {
        const base = getBaseUrl();
        let imageUrl: string | undefined;
        if (pickedFile) {
          const { storedPath } = await uploadImageFile(pickedFile);
          imageUrl = storedPath;
        }
        const created = await createLostItem({
          userId,
          itemName: content.slice(0, 50),
          description: content,
          location: location.trim() || undefined,
          userName: "我",
          imageUrl,
        });
        const row = mapDtoToRow(created, base);
        setHistory((prev) => {
          const rest = prev.filter((h) => h.id !== row.id);
          return [row, ...rest];
        });
        void loadList(false);
        setContent("");
        setLocation("");
        setTime("");
        clearPickedImage();
        setActiveTab("历史");
      } else if (!isApiConfigured()) {
        const newItem: LostItemRow = {
          id: Date.now(),
          user: { name: "我", avatar: "https://picsum.photos/seed/me/100/100" },
          content,
          image: previewUrl && !previewUrl.startsWith("blob:") ? previewUrl : "https://picsum.photos/seed/umbrella/400/300",
          location,
          time: time || "刚刚",
          isFound: false,
          postTime: "刚刚",
        };
        setHistory((prev) => [newItem, ...prev]);
        setContent("");
        setLocation("");
        setTime("");
        clearPickedImage();
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
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
      <div className="bg-white px-4 pt-6 pb-3 flex items-center justify-between sticky top-0 z-10 shadow-sm border-b border-gray-100/80">
        <button
          type="button"
          onClick={handleBack}
          aria-label="返回"
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 border border-gray-200/80 text-gray-800 hover:bg-gray-200/80 active:scale-95 transition-all"
        >
          <ChevronLeft size={22} strokeWidth={2.25} />
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
              <header className="shrink-0 flex items-center gap-2 px-3 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3 border-b border-gray-100 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label="返回"
                  className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 border border-gray-200/80 text-gray-800 hover:bg-gray-200/80 active:scale-95 transition-all"
                >
                  <ChevronLeft size={22} strokeWidth={2.25} />
                </button>
                <span className="font-bold text-gray-900 text-base">寻物详情</span>
              </header>
              <div className="flex-1 overflow-y-auto min-h-0">
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
              </div>
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
                <div className="mb-6">
                  {previewUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-gray-100">
                      <img src={previewUrl} alt="" className="w-full h-44 object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={clearPickedImage}
                        className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                        aria-label="移除图片"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full aspect-[16/9] max-h-44 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-gray-300 transition-all"
                    >
                      <ImageIcon size={28} className="mb-2" />
                      <span className="text-xs font-medium">点击添加照片（可选）</span>
                    </button>
                  )}
                </div>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                    <MapPin size={20} className="text-gray-400 shrink-0" />
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="丢失位置 (如: 一楼东区)" className="bg-transparent border-none focus:outline-none text-sm w-full" />
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                    <Clock size={20} className="text-gray-400 shrink-0" />
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
              ) : history.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-12">暂无寻物记录，去发布一条吧</p>
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
                    {item.image ? <img src={item.image} className="w-full h-32 object-cover rounded-xl mb-3" referrerPolicy="no-referrer" alt="" /> : null}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {item.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {item.time}
                      </span>
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
