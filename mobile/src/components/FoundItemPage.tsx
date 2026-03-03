import React, { useState } from "react";
import { ChevronLeft, Image as ImageIcon, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { SharedPostDetail } from "./SharedPostDetail";

export function FoundItemPage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<"发布" | "历史">("发布");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");

  const [history, setHistory] = useState([
    {
      id: 1,
      user: { name: "我", avatar: "https://picsum.photos/seed/me/100/100" },
      content: "在二楼西区靠窗的桌子上捡到一张校园卡，名字叫张三，已交到二楼服务台。",
      image: "https://picsum.photos/seed/card/400/300",
      location: "二楼西区",
      time: "今天 11:30",
      isReturned: false,
      postTime: "1小时前"
    }
  ]);

  const [selectedPost, setSelectedPost] = useState<any>(null);

  const handleBack = () => {
    if (selectedPost) {
      setSelectedPost(null);
    } else {
      onBack();
    }
  };

  const toggleReturned = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(history.map(h => h.id === id ? { ...h, isReturned: !h.isReturned } : h));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-gray-50 z-[100] flex flex-col"
    >
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button onClick={handleBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-full">
          <ChevronLeft size={24} />
        </button>
        {selectedPost ? (
          <span className="font-bold">招领详情</span>
        ) : (
          <div className="flex bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setActiveTab("发布")}
              className={cn("px-4 py-1.5 rounded-full text-sm font-bold transition-colors", activeTab === "发布" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}
            >
              发布招领
            </button>
            <button
              onClick={() => setActiveTab("历史")}
              className={cn("px-4 py-1.5 rounded-full text-sm font-bold transition-colors", activeTab === "历史" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}
            >
              我的招领
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
              <SharedPostDetail post={{...selectedPost, tags: ["失物招领"]}}>
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="text-blue-500" />
                    <span>拾取地点：{selectedPost.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} className="text-blue-500" />
                    <span>拾取时间：{selectedPost.time}</span>
                  </div>
                </div>
              </SharedPostDetail>
            </motion.div>
          ) : activeTab === "发布" ? (
            <motion.div key="publish" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-2xl mx-auto p-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="描述您捡到的物品特征及目前放置位置..."
                  className="w-full h-32 bg-gray-50 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border border-gray-100 resize-none mb-4"
                />
                
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <button className="aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-gray-300 transition-all">
                    <ImageIcon size={28} className="mb-2" />
                    <span className="text-xs font-medium">添加照片</span>
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                    <MapPin size={20} className="text-gray-400" />
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="拾取位置 (如: 二楼西区)" className="bg-transparent border-none focus:outline-none text-sm w-full" />
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                    <Clock size={20} className="text-gray-400" />
                    <input type="text" value={time} onChange={e => setTime(e.target.value)} placeholder="拾取时间 (如: 今天上午11点)" className="bg-transparent border-none focus:outline-none text-sm w-full" />
                  </div>
                </div>

                <button
                  disabled={!content.trim()}
                  className="w-full bg-blue-500 text-white py-3 rounded-2xl font-bold text-sm disabled:opacity-50 transition-colors shadow-sm"
                >
                  发布失物招领
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 max-w-2xl mx-auto p-6">
              {history.map(item => (
                <div key={item.id} onClick={() => setSelectedPost(item)} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">招领</span>
                      <span className="text-xs text-gray-400">{item.postTime}</span>
                    </div>
                    <button 
                      onClick={(e) => toggleReturned(item.id, e)}
                      className={cn("px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1", item.isReturned ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                    >
                      {item.isReturned ? <CheckCircle2 size={14} /> : null}
                      {item.isReturned ? "已归还" : "标记为已归还"}
                    </button>
                  </div>
                  <p className="text-gray-800 text-sm mb-3 line-clamp-2">{item.content}</p>
                  {item.image && <img src={item.image} className="w-full h-32 object-cover rounded-xl mb-3" referrerPolicy="no-referrer" />}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {item.location}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {item.time}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
