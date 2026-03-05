import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { formatRelativeTime } from "../lib/utils";
import { SharedPostDetail } from "./SharedPostDetail";
import { feedbackHistoryMock } from "../mocks/feedback";
import { listPostsByUser, createPost } from "../api/posts";
import { getBaseUrl } from "../api/client";

const FEEDBACK_TYPE_MAP: Record<string, string> = {
  "菜品质量": "food",
  "服务态度": "service",
  "环境卫生": "env",
  "其他建议": "other",
};
const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  food: "菜品质量",
  service: "服务态度",
  env: "环境卫生",
  other: "其他建议",
};

export type FeedbackRow = {
  id: number;
  type: string;
  content: string;
  status: string;
  time: string;
  reply?: string;
};

export function FeedbackPage({ onBack, userId }: { onBack: () => void; userId?: number }) {
  const [activeTab, setActiveTab] = useState<"发布" | "历史">("发布");
  const [content, setContent] = useState("");
  const [type, setType] = useState("菜品质量");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [history, setHistory] = useState<FeedbackRow[]>(feedbackHistoryMock);
  const [loading, setLoading] = useState(!!getBaseUrl() && userId != null);
  const [selectedPost, setSelectedPost] = useState<FeedbackRow | null>(null);

  const fetchHistory = useCallback(async () => {
    const base = getBaseUrl();
    if (!base || userId == null) {
      setLoading(false);
      return;
    }
    try {
      const list = await listPostsByUser(userId);
      const feedbackPosts = list.filter((p) => p.feedbackType);
      const rows: FeedbackRow[] = feedbackPosts.map((p) => ({
        id: p.id,
        type: FEEDBACK_TYPE_LABELS[p.feedbackType!] ?? p.feedbackType ?? "其他建议",
        content: p.content ?? "",
        status: p.status === "replied" ? "已解决" : "处理中",
        time: p.createdAt ? formatRelativeTime(p.createdAt) : "",
        reply: p.replyContent ?? undefined,
      }));
      setHistory(rows.length ? rows : feedbackHistoryMock);
    } catch {
      setHistory(feedbackHistoryMock);
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

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitError("");
    setSubmitLoading(true);
    try {
      if (getBaseUrl() && userId != null) {
        await createPost({
          userId,
          content,
          feedbackType: FEEDBACK_TYPE_MAP[type] ?? "other",
          title: type,
        });
        await fetchHistory();
        setContent("");
        setActiveTab("历史");
      } else {
        const newItem: FeedbackRow = {
          id: Date.now(),
          type,
          content,
          status: "处理中",
          time: "刚刚",
        };
        setHistory((prev) => [newItem, ...prev]);
        setContent("");
        setActiveTab("历史");
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitLoading(false);
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
          <span className="font-bold">反馈详情</span>
        ) : (
          <div className="flex bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setActiveTab("发布")}
              className={cn("px-4 py-1.5 rounded-full text-sm font-bold transition-colors", activeTab === "发布" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}
            >
              发布反馈
            </button>
            <button
              onClick={() => setActiveTab("历史")}
              className={cn("px-4 py-1.5 rounded-full text-sm font-bold transition-colors", activeTab === "历史" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}
            >
              历史记录
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
              <SharedPostDetail post={{ ...selectedPost, tags: ["问题反馈", selectedPost.type] }}>
                <div className="flex items-center justify-between mb-4 mt-4">
                  <div className="flex items-center gap-1 text-sm font-bold">
                    {selectedPost.status === "已解决" ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Clock size={16} className="text-amber-500" />}
                    <span className={selectedPost.status === "已解决" ? "text-emerald-500" : "text-amber-500"}>{selectedPost.status}</span>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-6 mt-6">
                  <h3 className="font-bold text-gray-900 mb-4">处理进度</h3>
                  <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 bg-gray-300 rounded-full border-2 border-white" />
                      <p className="text-sm text-gray-500 mb-1">{selectedPost.time}</p>
                      <p className="text-sm text-gray-900 font-medium">反馈已提交，等待处理</p>
                    </div>
                    {selectedPost.reply && (
                      <div className="relative">
                        <div className={cn("absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white", selectedPost.status === "已解决" ? "bg-emerald-500" : "bg-amber-500")} />
                        <p className="text-sm text-gray-500 mb-1">食堂回复</p>
                        <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-700">
                          {selectedPost.reply}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </SharedPostDetail>
            </motion.div>
          ) : activeTab === "发布" ? (
            <motion.div key="publish" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-2xl mx-auto p-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                {submitError ? <div className="text-sm text-red-500 mb-4">{submitError}</div> : null}
                <h3 className="font-bold text-gray-900 mb-4">问题类型</h3>
                <div className="flex flex-wrap gap-3 mb-6">
                  {["菜品质量", "服务态度", "环境卫生", "其他建议"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-colors border", type === t ? "bg-red-50 border-red-200 text-[#FF6B6B]" : "bg-gray-50 border-transparent text-gray-600")}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <h3 className="font-bold text-gray-900 mb-4">具体内容</h3>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="请详细描述您遇到的问题或建议..."
                  className="w-full h-32 bg-gray-50 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/50 transition-all border border-gray-100 resize-none mb-4"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-4 h-4 text-[#FF6B6B] rounded border-gray-300 focus:ring-[#FF6B6B]" />
                    <span className="text-sm text-gray-600">匿名提交</span>
                  </label>
                  <button
                    type="button"
                    disabled={!content.trim() || submitLoading}
                    onClick={handleSubmit}
                    className="bg-[#FF6B6B] text-white px-6 py-2 rounded-full font-bold text-sm disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {submitLoading ? "提交中…" : "提交反馈"}
                  </button>
                </div>
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
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold">{item.type}</span>
                      <div className="flex items-center gap-1 text-xs font-bold">
                        {item.status === "已解决" ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Clock size={14} className="text-amber-500" />}
                        <span className={item.status === "已解决" ? "text-emerald-500" : "text-amber-500"}>{item.status}</span>
                      </div>
                    </div>
                    <p className="text-gray-800 text-sm mb-4 line-clamp-2 leading-relaxed">{item.content}</p>
                    <div className="text-xs text-gray-400">{item.time}</div>
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
