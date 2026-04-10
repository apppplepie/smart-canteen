import React, { useState } from "react";
import { X, Image as ImageIcon, MapPin, Hash, Smile, Star, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { HistoryOrdersPage } from "./HistoryOrdersPage";
import { createPost, createVendorReview } from "../api";
import { getBaseUrl } from "../api/client";
import { publishPageDefaultOrderMock } from "../mocks/publishPage";

export function PublishPage({
  onBack,
  onSuccess,
  currentUserId,
  initialOrder,
}: {
  onBack: () => void;
  onSuccess?: () => void;
  currentUserId?: number;
  /** 从食堂圈快速发布卡片传入的历史订单，用于预填选单 */
  initialOrder?: { name: string; items: string; image: string; vendorId?: number; orderId?: number };
  key?: string;
}) {
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<{ name: string; items: string; image: string; orderId?: number; vendorId?: number }>(() => ({
    ...publishPageDefaultOrderMock,
    ...(initialOrder ? { name: initialOrder.name, items: initialOrder.items, image: initialOrder.image, vendorId: initialOrder.vendorId, orderId: initialOrder.orderId } : {}),
  }));

  /** 绑定历史订单时：至少打分（评论可选）；无订单时：发纯动态需有正文 */
  const canPublish = !!(
    (selectedOrder.vendorId != null &&
      selectedOrder.orderId != null &&
      rating >= 1) ||
    (selectedOrder.vendorId == null && content.trim())
  );

  const handlePublish = async () => {
    if (!canPublish) return;
    const base = getBaseUrl();
    if (!base) {
      alert("未配置后端地址，无法发布");
      return;
    }
    const uid = currentUserId ?? 1;
    setSubmitting(true);
    try {
      if (selectedOrder.vendorId != null && selectedOrder.orderId != null) {
        if (rating < 1) {
          alert("请先为订单打分（1～5 星），评论可留空");
          return;
        }
        await createVendorReview({
          userId: uid,
          vendorId: selectedOrder.vendorId,
          orderId: selectedOrder.orderId,
          rating,
          content: content.trim() || undefined,
        });
      } else {
        if (!content.trim()) return;
        await createPost({
          userId: uid,
          vendorId: selectedOrder.vendorId,
          content: content.trim(),
          mediaUrls: undefined,
          postType: "dynamics",
        });
      }
      onSuccess?.();
      onBack();
    } catch (e) {
      alert("发布失败: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-[110]">
            <HistoryOrdersPage
              onBack={() => setShowHistory(false)}
              userId={currentUserId}
              onSelectOrder={(order) => {
                setSelectedOrder({
                  name: order.vendorName ?? "订单",
                  items: "¥" + order.totalAmount,
                  image: order.image ?? "https://picsum.photos/seed/m2/100/100",
                  vendorId: order.vendorId,
                  orderId: order.orderId,
                });
                setShowHistory(false);
              }}
            />
          </div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-0 bg-white z-[100] flex flex-col"
      >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-3 border-b border-gray-100 sticky top-0 bg-white">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
          >
            <X size={24} />
          </button>
          <span className="font-bold text-gray-900">发布动态</span>
          <button
            disabled={!canPublish || submitting}
            onClick={handlePublish}
            className="bg-[#FF6B6B] text-white px-5 py-2 rounded-full font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FF8E8E] transition-colors shadow-sm shadow-red-500/20 flex items-center gap-2"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
            发布
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        
        {/* Order Selection & Rating */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="w-full flex items-center justify-between mb-4 pb-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 rounded-xl p-2 -mx-2 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <img src={selectedOrder.image} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" alt="" />
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{selectedOrder.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedOrder.items}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <span className="text-xs">打开历史订单选择</span>
              <ChevronRight size={16} />
            </div>
          </button>
          
          <div className="flex flex-col items-center gap-3 py-2">
            {/* <span className="text-sm font-bold text-gray-900">
              {rating === 0 ? "点击星星评分" : `${rating} 星好评`}
            </span> */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={32}
                  onClick={() => setRating(star)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    rating >= star ? "text-amber-400 fill-amber-400" : "text-gray-200"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="分享你的食堂美食体验..."
          className="w-full h-40 resize-none text-lg placeholder-gray-300 focus:outline-none text-gray-800 leading-relaxed"
          autoFocus
        />

        {/* Image Upload Area */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <button className="aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-gray-300 transition-all">
            <ImageIcon size={28} className="mb-2" />
            <span className="text-xs font-medium">添加照片</span>
          </button>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl text-gray-600 hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-[#4ECDC4]" />
              <span className="font-medium">添加位置</span>
            </div>
            <span className="text-xs text-gray-400">选择食堂/档口</span>
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl text-gray-600 hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <Hash size={20} className="text-[#FF6B6B]" />
              <span className="font-medium">参与话题</span>
            </div>
            <span className="text-xs text-gray-400">#食堂干饭人</span>
          </button>
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="p-4 border-t border-gray-100 bg-white flex items-center gap-4 pb-safe justify-center">
        <div className="max-w-2xl w-full flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors">
            <ImageIcon size={24} />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors">
            <Hash size={24} />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors">
            <Smile size={24} />
          </button>
        </div>
      </div>
    </motion.div>
    </>
  );
}
