import React from "react";
import { Sparkles, ArrowRight, Bot } from "lucide-react";
import { motion } from "motion/react";

export interface AISummaryCardProps {
  onClick: () => void;
  /** 如 3/14-3/20 */
  periodLabel: string;
  /** 卡片副文案 */
  summaryLine: string;
  chips?: string[];
}

export function AISummaryCard({ onClick, periodLabel, summaryLine, chips }: AISummaryCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all w-full"
    >
      <div className="w-full aspect-[4/3] bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative flex items-center justify-center overflow-hidden">
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
          <Sparkles size={12} className="text-[#FF6B6B]" />
          <span className="text-[10px] font-bold text-[#FF6B6B]">AI 总结</span>
        </div>

        <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-[#FF6B6B]/20 to-orange-400/20 rounded-full blur-xl" />
        <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl" />

        <Bot size={48} className="text-[#FF6B6B]/40 relative z-10" />
      </div>

      <div className="p-3">
        <h3 className="font-bold text-gray-900 text-sm mb-1.5 line-clamp-2">
          本周食堂圈 · AI 小结 ({periodLabel})
        </h3>

        {chips != null && chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {chips.map((c) => (
              <span
                key={c}
                className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#FF6B6B] border border-red-100"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{summaryLine}</p>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#FF6B6B] to-orange-400 flex items-center justify-center">
              <Bot size={10} className="text-white" />
            </div>
            <span className="text-[10px] text-gray-500 font-medium">食堂 AI 助手</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
            <span className="text-[10px]">查看</span>
            <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
