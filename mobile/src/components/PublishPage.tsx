import React, { useState } from "react";
import { X, Image as ImageIcon, MapPin, Hash, Smile, Send } from "lucide-react";
import { motion } from "motion/react";

export function PublishPage({ onBack }: { onBack: () => void; key?: string }) {
  const [content, setContent] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-white z-50 flex flex-col"
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
            disabled={!content.trim()}
            className="bg-[#FF6B6B] text-white px-5 py-2 rounded-full font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FF8E8E] transition-colors shadow-sm shadow-red-500/20"
          >
            发布
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
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
  );
}
