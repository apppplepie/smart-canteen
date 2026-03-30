import React, { useState, useMemo, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  MapPin,
  ChevronLeft,
  Star,
  Loader2,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PublishPage } from "./PublishPage";
import { MerchantPage } from "./MerchantPage";
import { THEME } from "../config/theme";
import { cn, getPostTagClassName } from "../lib/utils";
import { SharedPostDetail } from "./SharedPostDetail";
import { listPosts, listVendors, createVendorReview } from "../api";
import { listLostItems } from "../api/lostItems";
import { lostItemToSharedPost } from "../api/mapLostItem";
import { listOrdersByUser } from "../api/orders";
import { listOrderItemsByOrder } from "../api/orderItems";
import { getMenuItem } from "../api/menuItems";
import { getBaseUrl, ApiError } from "../api/client";
import { postToSharedPost } from "../api/mapPost";
import { listAiPeriodReports, type AiReportListItem } from "../api/snapshots";
import type { SharedPost } from "./SharedPostDetail";
import type { Vendor } from "../api/types";
import { dynamicsPostsFallbackMock, type DynamicsPost } from "../mocks/dynamicsPosts";
import { AISummaryCard } from "./AISummaryCard";
import { AISummaryDetail } from "./AISummaryDetail";
import { buildAiSummaryBundle, getRollingWeekRange } from "../lib/aiSummaryBuild";

/** 从历史订单解析出的最近一单菜品，用于快速发布卡片（仅未评价订单） */
type HistoryDishItem = {
  orderId: number;
  vendorName: string;
  dishName?: string;
  image: string;
  vendorId?: number;
  totalAmount?: number;
};

export function DynamicsTab({
  user,
  onNavigateToOnlineService,
}: {
  user?: { userId?: number } | null;
  onNavigateToOnlineService?: (section: "lost" | "found") => void;
}) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<"推荐" | "最新">("推荐");
  const [selectedPost, setSelectedPost] = useState<SharedPost | null>(null);
  const [selectedMerchantId, setSelectedMerchantId] = useState<number | null>(null);
  const [posts, setPosts] = useState<SharedPost[]>(dynamicsPostsFallbackMock);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [latestLostItem, setLatestLostItem] = useState<SharedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [weeklyAiReport, setWeeklyAiReport] = useState<AiReportListItem | null>(null);
  const [rating, setRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [historyDish, setHistoryDish] = useState<HistoryDishItem | null>(null);

  const baseUrl =
    (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "") ||
    (import.meta.env.VITE_API_SAME_ORIGIN === "true" ? "" : "");
  const apiBase = getBaseUrl();

  const fetchPosts = React.useCallback(async () => {
    if (baseUrl === "" && import.meta.env.VITE_API_SAME_ORIGIN !== "true") return;
    try {
      const [postList, vendorList] = await Promise.all([
        listPosts(), // 不传 postType，拉取数据库全部帖子
        listVendors(),
      ]);
      const vendorMap = new Map(vendorList.map((v) => [v.id, v.name]));
      const sorted = [...postList].sort((a, b) => {
        const ta = a.createdAt ?? "";
        const tb = b.createdAt ?? "";
        return tb.localeCompare(ta);
      });
      const mapped = sorted.map((p) => postToSharedPost(p, vendorMap.get(p.vendorId ?? 0), baseUrl));
      setPosts(mapped);
      setVendors(vendorList);
    } catch {
      setPosts(dynamicsPostsFallbackMock);
      setVendors([]);
    }
  }, [baseUrl]);

  useEffect(() => {
    if (!apiBase) return;
    let cancelled = false;
    listAiPeriodReports({ reportType: "weekly_posts_digest", page: 1, size: 1 })
      .then((r) => {
        if (!cancelled) setWeeklyAiReport(r.items[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setWeeklyAiReport(null);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const aiBundle = useMemo(
    () => buildAiSummaryBundle(posts, vendors, weeklyAiReport, getRollingWeekRange()),
    [posts, vendors, weeklyAiReport],
  );

  const fetchLatestLost = React.useCallback(async () => {
    if (!apiBase) return;
    try {
      const list = await listLostItems();
      const latest = list[0];
      if (latest) setLatestLostItem(lostItemToSharedPost(latest, apiBase));
      else setLatestLostItem(null);
    } catch {
      setLatestLostItem(null);
    }
  }, [apiBase]);

  useEffect(() => {
    if (baseUrl === "" && import.meta.env.VITE_API_SAME_ORIGIN !== "true") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      await fetchPosts();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [baseUrl, fetchPosts]);

  useEffect(() => {
    if (!apiBase) return;
    fetchLatestLost();
  }, [apiBase, fetchLatestLost]);

  const fetchHistoryDish = React.useCallback(async () => {
    if (!apiBase || user?.userId == null) return;
    try {
      const orders = await listOrdersByUser(user.userId);
      const completed = orders.filter((o) => {
        const s = (o.status ?? "").toLowerCase();
        return s === "completed" || s === "已完成" || s === "done";
      });
      const unreviewed = completed.find((o) => !o.reviewedAt);
      const last = unreviewed ?? null;
      if (!last) {
        setHistoryDish(null);
        return;
      }
      const vendors = await listVendors();
      const vendorMap = new Map(vendors.map((v) => [v.id, v.name]));
      const vendorName = vendorMap.get(last.vendorId ?? 0) ?? "订单";
      const orderItems = await listOrderItemsByOrder(last.id);
      const firstItem = orderItems[0];
      if (!firstItem?.menuItemId) {
        setHistoryDish({
          orderId: last.id,
          vendorName,
          image: `https://picsum.photos/seed/v${last.vendorId ?? last.id}/100/100`,
          vendorId: last.vendorId,
          totalAmount: last.totalAmount,
        });
        return;
      }
      const menuItem = await getMenuItem(firstItem.menuItemId);
      const img =
        menuItem?.imageUrl?.startsWith("http")
          ? menuItem.imageUrl
          : menuItem?.imageUrl
            ? `${apiBase.replace(/\/$/, "")}${menuItem.imageUrl.startsWith("/") ? "" : "/"}${menuItem.imageUrl}`
            : `https://picsum.photos/seed/m${firstItem.menuItemId}/100/100`;
      setHistoryDish({
        orderId: last.id,
        vendorName,
        dishName: menuItem?.name,
        image: img,
        vendorId: last.vendorId,
        totalAmount: last.totalAmount,
      });
    } catch {
      setHistoryDish(null);
    }
  }, [apiBase, user?.userId]);

  useEffect(() => {
    if (!apiBase || user?.userId == null) return;
    let cancelled = false;
    fetchHistoryDish();
    return () => { cancelled = true; };
  }, [apiBase, user?.userId, fetchHistoryDish]);

  const filteredPosts = useMemo(() => {
    const list = posts as DynamicsPost[];
    if (activeTab === "最新") return list.filter((p) => p.isLatest !== false);
    return list;
  }, [posts, activeTab]);

  const renderPost = (post: SharedPost & { height?: string }) => {
    const isLost = typeof post.id === "string" && String(post.id).startsWith("lost-");
    const hasRating = post.rating != null && post.rating >= 1 && post.rating <= 5;
    return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      key={post.id}
      onClick={() => setSelectedPost(post)}
      className="break-inside-avoid mb-4 bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
    >
      {post.image && (
        <div className="relative">
          <img
            src={post.image}
            alt="Post"
            className={`w-full object-cover ${(post as { height?: string }).height ?? "h-48"}`}
            referrerPolicy="no-referrer"
          />
          {hasRating && (
            <div className="absolute bottom-2 left-2 flex items-center gap-2">
              <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 text-white text-xs font-medium">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                {post.rating}
              </span>
            </div>
          )}
        </div>
      )}
      {!post.image && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
          {hasRating && (
            <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
              <Star size={12} className="fill-amber-400" />
              {post.rating} 分
            </span>
          )}
          <div className="flex items-center gap-2 ml-auto text-gray-500 text-xs">
            {!isLost && (
              <span className="flex items-center gap-0.5">
                <Heart size={12} />
                {post.likes ?? 0}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <MessageCircle size={12} />
              {post.comments ?? 0}
            </span>
          </div>
        </div>
      )}
      <div className="p-4">
        {post.merchantName != null && post.merchantName !== "" && (
          <div className="flex items-center gap-1 text-[10px] text-[#FF6B6B] bg-red-50 w-fit px-2 py-1 rounded-md mb-2">
            <MapPin size={10} />
            <span>{post.merchantName}{post.dishName ? ` · ${post.dishName}` : ""}</span>
          </div>
        )}
        {post.tags != null && post.tags.length > 0 && (
          <div className="flex gap-2 mb-2">
            {post.tags.map((tag: string) => (
              <span key={tag} className={cn("text-[10px] px-2 py-1 rounded-md font-bold", getPostTagClassName(tag))}>
                {tag}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm text-gray-800 line-clamp-3 mb-3 leading-relaxed">
          {post.content ?? ""}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={post.user?.avatar ?? "https://api.dicebear.com/7.x/avataaars/svg?seed=u"}
              alt={post.user?.name ?? "用户"}
              className="w-6 h-6 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="text-xs text-gray-500 font-medium">
              {post.user?.name ?? "用户"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            {typeof post.id !== "string" || !String(post.id).startsWith("lost-") ? (
              <>
                <span className="flex items-center gap-0.5">
                  <Heart size={14} />
                  <span className="text-xs">{post.likes ?? 0}</span>
                </span>
                <span className="flex items-center gap-0.5">
                  <MessageCircle size={14} />
                  <span className="text-xs">{post.comments ?? 0}</span>
                </span>
              </>
            ) : (
              <span className="flex items-center gap-0.5">
                <MessageCircle size={14} />
                <span className="text-xs">{post.comments ?? 0}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
    );
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col relative overflow-y-auto no-scrollbar pb-24">
      <AnimatePresence>
        {showAiSummary ? (
          <AISummaryDetail
            key="ai-summary-detail"
            content={aiBundle.detail}
            onBack={() => setShowAiSummary(false)}
            onPostClick={(p) => {
              setShowAiSummary(false);
              setSelectedPost(p);
            }}
            onMerchantClick={(id) => {
              setShowAiSummary(false);
              setSelectedMerchantId(id);
            }}
            onNavigateToOnlineService={(section) => {
              setShowAiSummary(false);
              onNavigateToOnlineService?.(section);
            }}
          />
        ) : selectedMerchantId ? (
          <MerchantPage
            merchant={{
              id: selectedMerchantId,
              name:
                vendors.find((v) => v.id === selectedMerchantId)?.name ??
                posts.find((p) => p.merchantId === selectedMerchantId)?.merchantName ??
                "商家",
            }}
            onBack={() => setSelectedMerchantId(null)}
            key="merchant-page"
          />
        ) : selectedPost ? (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed inset-0 bg-white z-[60] flex flex-col"
            key="post-detail"
          >
            <div className="flex items-center px-4 pt-6 pb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
              <button onClick={() => setSelectedPost(null)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-full">
                <ChevronLeft size={24} />
              </button>
              <span className="font-bold ml-2">帖子详情</span>
            </div>
            <SharedPostDetail
              post={selectedPost}
              onMerchantClick={(id) => setSelectedMerchantId(id)}
              currentUserId={user?.userId}
            />
          </motion.div>
        ) : isPublishing ? (
          <PublishPage
            onBack={() => setIsPublishing(false)}
            onSuccess={() => { fetchPosts(); fetchHistoryDish(); }}
            currentUserId={user?.userId}
            initialOrder={
              historyDish
                ? {
                    name: historyDish.vendorName,
                    items: historyDish.dishName ?? (historyDish.totalAmount != null ? `¥${historyDish.totalAmount}` : ""),
                    image: historyDish.image,
                    vendorId: historyDish.vendorId,
                    orderId: historyDish.orderId,
                  }
                : undefined
            }
            key="publish-page"
          />
        ) : null}
      </AnimatePresence>

      {/* Header */}
      <div 
        className="px-6 pt-6 pb-24 text-white relative overflow-hidden"
        style={{ backgroundColor: THEME.colors.primary }}
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="flex justify-between items-center relative z-10 max-w-7xl mx-auto w-full">
          <div className="flex items-end gap-6">
            <h1 className="text-2xl font-bold">食堂圈</h1>
            <div className="flex gap-4 mb-0.5">
              <button 
                onClick={() => setActiveTab("推荐")}
                className={cn(
                  "text-sm font-bold pb-1 transition-all relative",
                  activeTab === "推荐" ? "text-white" : "text-white/70"
                )}
              >
                推荐
                {activeTab === "推荐" && (
                  <motion.div layoutId="tab-indicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-white rounded-full" />
                )}
              </button>
              <button 
                onClick={() => setActiveTab("最新")}
                className={cn(
                  "text-sm font-bold pb-1 transition-all relative",
                  activeTab === "最新" ? "text-white" : "text-white/70"
                )}
              >
                最新
                {activeTab === "最新" && (
                  <motion.div layoutId="tab-indicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-white rounded-full" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 -mt-12 md:-mt-16 relative z-10 space-y-6 md:space-y-8">
        {/* 有未评价订单时：展示最近一单的快速打分卡片 + 长评入口；全部已评时：只展示长评入口 */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          {historyDish ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={historyDish.image}
                    className="w-12 h-12 rounded-xl object-cover"
                    referrerPolicy="no-referrer"
                    alt=""
                  />
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{historyDish.vendorName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {historyDish.dishName ?? `¥${historyDish.totalAmount ?? ""}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        onClick={() => setRating(star)}
                        className={cn(
                          "cursor-pointer transition-colors",
                          rating >= star ? "text-amber-400 fill-amber-400" : "text-gray-200"
                        )}
                      />
                    ))}
                  </div>
                  <button
                    disabled={rating === 0 || !historyDish.vendorId || user?.userId == null || submittingRating}
                    onClick={async () => {
                      if (rating < 1 || !historyDish?.vendorId || user?.userId == null) return;
                      const base = getBaseUrl();
                      if (!base) {
                        setRatingError("未配置后端地址，无法提交评分");
                        return;
                      }
                      setRatingError(null);
                      setSubmittingRating(true);
                      try {
                        await createVendorReview({
                          userId: user.userId!,
                          vendorId: historyDish.vendorId,
                          orderId: historyDish.orderId,
                          rating,
                        });
                        setRating(0);
                        fetchHistoryDish();
                      } catch (e: unknown) {
                        const status = e instanceof ApiError ? e.status : 0;
                        const msg =
                          status === 400
                            ? "请求参数有误，请检查订单与商家是否匹配"
                            : status === 403
                              ? "只能对自己的订单进行评分"
                              : status === 404
                                ? "未找到对应订单，无法评分"
                                : status === 409
                                  ? "该订单已评价过，无法重复评分"
                                  : status >= 500
                                    ? "服务暂时繁忙，请稍后重试"
                                    : "发布评分失败，请稍后重试";
                        setRatingError(msg);
                        setTimeout(() => setRatingError(null), 5000);
                      } finally {
                        setSubmittingRating(false);
                      }
                    }}
                    className="px-4 py-1.5 bg-[#FF6B6B] text-white text-xs font-bold rounded-full shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    {submittingRating ? <Loader2 size={14} className="animate-spin" /> : null}
                    发布评分
                  </button>
                </div>
                {ratingError && (
                  <p className="mt-2 w-full text-left text-xs text-red-600 font-medium" role="alert">
                    {ratingError}
                  </p>
                )}
              </div>
              <div
                onClick={() => setIsPublishing(true)}
                className="bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                写下你的长评，分享美食体验...
              </div>
            </>
          ) : (
            <div
              onClick={() => setIsPublishing(true)}
              className="bg-gray-50 rounded-2xl px-4 py-4 text-sm text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              写下你的长评，分享美食体验...
            </div>
          )}
        </div>

        {/* Waterfall Layout */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-[#FF6B6B]" />
          </div>
        ) : (
          <div className="columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {latestLostItem && (
              <div
                className="break-inside-avoid mb-4 relative cursor-pointer"
                onClick={() => setSelectedPost(latestLostItem)}
              >
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500 text-white text-[10px] font-bold shadow-sm">
                  <Search size={12} />
                  寻物启事 · 置顶
                </div>
                {renderPost(latestLostItem)}
              </div>
            )}
            <div className="break-inside-avoid mb-4">
              <AISummaryCard
                periodLabel={aiBundle.periodLabel}
                summaryLine={aiBundle.cardSummaryLine}
                chips={aiBundle.chips}
                onClick={() => setShowAiSummary(true)}
              />
            </div>
            {filteredPosts.map(renderPost)}
          </div>
        )}
      </div>
    </div>
  );
}
