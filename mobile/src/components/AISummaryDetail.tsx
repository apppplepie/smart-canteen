import React from "react";
import {
  ChevronLeft,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Store,
  CheckCircle2,
  Search,
  ArrowRight,
  Flame,
} from "lucide-react";
import { motion } from "motion/react";
import type { SharedPost } from "./SharedPostDetail";

export interface AISummaryTopic {
  label: string;
  text: string;
}

export interface AISummaryMerchant {
  id: number;
  name: string;
  reason: string;
}

export interface AISummaryOfficialItem {
  post: SharedPost;
  summaryLine: string;
}

/** 详情页展示用数据，由食堂圈根据帖子/商家与可选 AI 报告拼装 */
export interface AISummaryDetailContent {
  periodTitle: string;
  topics: AISummaryTopic[];
  emotionLine: string;
  statsFooter: string;
  hotPosts: SharedPost[];
  redMerchants: AISummaryMerchant[];
  officialReplied: AISummaryOfficialItem[];
}

interface AISummaryDetailProps {
  content: AISummaryDetailContent;
  onBack: () => void;
  onPostClick: (post: SharedPost) => void;
  onMerchantClick: (merchantId: number) => void;
  /** 跳转「食堂在线」里的寻物/招领 */
  onNavigateToOnlineService?: (section: "lost" | "found") => void;
}

function postTitleLine(post: SharedPost): string {
  const t = (post.content ?? "").trim();
  const first = t.split(/\n+/)[0] ?? "";
  return first.length > 48 ? first.slice(0, 48) + "…" : first || "动态";
}

export function AISummaryDetail({
  content,
  onBack,
  onPostClick,
  onMerchantClick,
  onNavigateToOnlineService,
}: AISummaryDetailProps) {
  const {
    periodTitle,
    topics,
    emotionLine,
    statsFooter,
    hotPosts,
    redMerchants,
    officialReplied,
  } = content;

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-gray-50 z-[70] flex flex-col"
    >
      <div className="bg-white px-4 pt-6 pb-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button type="button" onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2 font-bold text-gray-900 text-sm text-center flex-1 justify-center px-2">
          <Sparkles size={18} className="text-[#FF6B6B] shrink-0" />
          <span className="truncate">{periodTitle}</span>
        </div>
        <div className="w-10 shrink-0" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-safe">
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#FF6B6B]">
              <TrendingUp size={16} />
            </div>
            <h2 className="font-bold text-gray-900 text-lg">本周结论</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2">话题概览</h3>
              {topics.length === 0 ? (
                <p className="text-sm text-gray-500">本周样本较少，暂无细分话题归纳。</p>
              ) : (
                <div className="space-y-2">
                  {topics.map((row, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs font-bold rounded mt-0.5 whitespace-nowrap">
                        {row.label}
                      </span>
                      <p className="text-sm text-gray-600 leading-relaxed">{row.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {emotionLine.trim() !== "" && (
              <div className="bg-gray-50 rounded-2xl p-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  <span className="font-bold text-gray-700">情绪提示：</span> {emotionLine}
                </p>
              </div>
            )}

            <div className="text-xs text-gray-400 text-right">{statsFooter}</div>
          </div>
        </section>

        <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
              <Flame size={16} />
            </div>
            <h2 className="font-bold text-gray-900 text-lg">本周热帖</h2>
            <span className="text-xs text-gray-400 ml-auto">互动量优先</span>
          </div>

          {hotPosts.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">本周暂无明火热帖。</p>
          ) : (
            <div className="space-y-3">
              {hotPosts.map((post) => (
                <button
                  key={String(post.id)}
                  type="button"
                  onClick={() => onPostClick(post)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100 text-left"
                >
                  <p className="text-sm text-gray-800 font-medium line-clamp-1 flex-1 pr-4">{postTitleLine(post)}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                    <span className="flex items-center gap-1">
                      <Flame size={12} className="text-orange-400" /> {post.likes ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} /> {post.comments ?? 0}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#FF6B6B]">
              <Store size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">红榜商家</h2>
              <p className="text-xs text-gray-400">基于当前档口评分（口碑参考）</p>
            </div>
          </div>

          {redMerchants.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">暂无商家评分数据。</p>
          ) : (
            <div className="space-y-3">
              {redMerchants.map((merchant) => (
                <div key={merchant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm">{merchant.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{merchant.reason}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onMerchantClick(merchant.id)}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-full shadow-sm hover:bg-gray-50 hover:text-[#FF6B6B] hover:border-red-200 transition-all shrink-0"
                  >
                    去点餐
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {officialReplied.length > 0 && (
          <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">官方已回复</h2>
                <p className="text-xs text-gray-400">本周 {officialReplied.length} 条反馈已跟进</p>
              </div>
            </div>

            <div className="space-y-4">
              {officialReplied.map(({ post, summaryLine }) => (
                <div key={String(post.id)} className="p-3 border border-gray-100 rounded-2xl">
                  <p className="text-sm font-bold text-gray-800 mb-2 line-clamp-2">{summaryLine}</p>
                  {post.reply != null && post.reply.trim() !== "" && (
                    <div className="bg-gray-50 p-2.5 rounded-xl text-xs text-gray-600 mb-2 border-l-2 border-emerald-400 line-clamp-3">
                      <span className="font-bold text-emerald-600 mr-1">官方回复:</span>
                      {post.reply}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onPostClick(post)}
                    className="text-xs text-gray-500 hover:text-[#FF6B6B] flex items-center gap-1 transition-colors"
                  >
                    查看全文 <ArrowRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="bg-transparent pt-2 pb-6">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-sm text-gray-500 mb-3">丢了东西？或者捡到物品？</p>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => onNavigateToOnlineService?.("found")}
                className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm border border-gray-100 hover:text-[#FF6B6B] transition-colors"
              >
                <Search size={16} />
                看看招领
              </button>
              <button
                type="button"
                onClick={() => onNavigateToOnlineService?.("lost")}
                className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm border border-gray-100 hover:text-[#FF6B6B] transition-colors"
              >
                <Sparkles size={16} />
                发布寻物
              </button>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
