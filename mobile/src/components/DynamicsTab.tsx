import React, { useState, useMemo } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Plus,
  MapPin,
  ChevronLeft,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FloatingActionButton } from "./FloatingActionButton";
import { PublishPage } from "./PublishPage";
import { MerchantPage } from "./MerchantPage";
import { THEME } from "../config/theme";
import { cn } from "../lib/utils";

const POSTS = [
  {
    id: 1,
    user: { name: "干饭王", avatar: "https://picsum.photos/seed/u1/100/100" },
    content:
      "今天一餐的麻辣烫太绝了！加了双份肥牛，汤底浓郁，简直是打工人的灵魂救赎 🍜✨",
    image: "https://picsum.photos/seed/p1/400/500",
    likes: 128,
    comments: 32,
    time: "2小时前",
    height: "h-64",
    merchantId: 1,
    merchantName: "川香麻辣烫",
    dishName: "自选麻辣烫",
    isLatest: true,
  },
  {
    id: 2,
    user: {
      name: "减脂小分队",
      avatar: "https://picsum.photos/seed/u2/100/100",
    },
    content: "二楼的轻食沙拉分量好足，鸡胸肉一点都不柴，推荐搭配油醋汁🥗",
    image: "https://picsum.photos/seed/p2/400/300",
    likes: 89,
    comments: 15,
    time: "4小时前",
    height: "h-48",
    merchantId: 2,
    merchantName: "健康轻食沙拉",
    dishName: "招牌鸡胸肉沙拉",
    isLatest: true,
  },
  {
    id: 3,
    user: { name: "碳水狂魔", avatar: "https://picsum.photos/seed/u3/100/100" },
    content: "老北京炸酱面yyds！面条劲道，酱香浓郁，配上黄瓜丝绝了🥒",
    image: "https://picsum.photos/seed/p3/400/400",
    likes: 256,
    comments: 64,
    time: "昨天",
    height: "h-56",
    merchantId: 3,
    merchantName: "老北京炸酱面",
    dishName: "经典炸酱面",
    isLatest: false,
  },
  {
    id: 4,
    user: { name: "甜品控", avatar: "https://picsum.photos/seed/u4/100/100" },
    content: "食堂新出的抹茶毛巾卷，口感绵密，抹茶味超浓郁，下午茶首选🍵",
    image: "https://picsum.photos/seed/p4/400/600",
    likes: 412,
    comments: 88,
    time: "昨天",
    height: "h-72",
    merchantId: 4,
    merchantName: "日式咖喱屋",
    dishName: "抹茶毛巾卷",
    isLatest: false,
  },
];

export function DynamicsTab() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<"推荐" | "最新">("推荐");
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedMerchantId, setSelectedMerchantId] = useState<number | null>(null);

  const filteredPosts = useMemo(() => {
    if (activeTab === "最新") {
      return POSTS.filter(p => p.isLatest);
    }
    return POSTS;
  }, [activeTab]);

  const renderPost = (post: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      key={post.id}
      onClick={() => setSelectedPost(post)}
      className="break-inside-avoid mb-4 bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
    >
      <img
        src={post.image}
        alt="Post"
        className={`w-full object-cover ${post.height}`}
        referrerPolicy="no-referrer"
      />
      <div className="p-4">
        {post.merchantName && (
          <div className="flex items-center gap-1 text-[10px] text-[#FF6B6B] bg-red-50 w-fit px-2 py-1 rounded-md mb-2">
            <MapPin size={10} />
            <span>{post.merchantName} · {post.dishName}</span>
          </div>
        )}
        <p className="text-sm text-gray-800 line-clamp-3 mb-3 leading-relaxed">
          {post.content}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={post.user.avatar}
              alt={post.user.name}
              className="w-6 h-6 rounded-full"
              referrerPolicy="no-referrer"
            />
            <span className="text-xs text-gray-500 font-medium">
              {post.user.name}
            </span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <Heart
              size={14}
              className="hover:text-red-500 cursor-pointer transition-colors"
            />
            <span className="text-xs">{post.likes}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="h-full bg-gray-50 flex flex-col relative">
      <AnimatePresence>
        {selectedMerchantId ? (
          <MerchantPage
            merchant={{ id: selectedMerchantId, name: POSTS.find(p => p.merchantId === selectedMerchantId)?.merchantName }}
            onBack={() => setSelectedMerchantId(null)}
            key="merchant-page"
          />
        ) : selectedPost ? (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="absolute inset-0 bg-white z-[60] flex flex-col"
            key="post-detail"
          >
            <div className="flex items-center justify-between px-4 pt-6 pb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
              <button onClick={() => setSelectedPost(null)} className="p-2 text-gray-600 hover:bg-gray-50 rounded-full">
                <ChevronLeft size={24} />
              </button>
              <div className="flex items-center gap-2">
                <img src={selectedPost.user.avatar} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                <span className="font-medium text-gray-900">{selectedPost.user.name}</span>
              </div>
              <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-full">
                <Share2 size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-24">
              <img src={selectedPost.image} className="w-full h-auto max-h-[60vh] object-cover" referrerPolicy="no-referrer" />
              <div className="p-6">
                {selectedPost.merchantName && (
                  <button 
                    onClick={() => setSelectedMerchantId(selectedPost.merchantId)}
                    className="flex items-center gap-2 text-sm text-[#FF6B6B] bg-red-50 px-3 py-2 rounded-xl mb-4 hover:bg-red-100 transition-colors"
                  >
                    <MapPin size={16} />
                    <span className="font-medium">{selectedPost.merchantName}</span>
                    <span className="text-gray-400 mx-1">|</span>
                    <span>{selectedPost.dishName}</span>
                    <ChevronLeft size={16} className="rotate-180 ml-auto" />
                  </button>
                )}
                <p className="text-gray-800 text-lg leading-relaxed mb-4">{selectedPost.content}</p>
                <div className="text-sm text-gray-400 mb-6">{selectedPost.time}</div>
                
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="font-bold text-gray-900 mb-4">共 {selectedPost.comments} 条评论</h3>
                  <div className="flex gap-3 mb-6">
                    <img src="https://picsum.photos/seed/user/100/100" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                    <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-2 text-sm text-gray-500">
                      说点什么...
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe flex items-center justify-between px-6">
              <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-500 mr-4">
                说点什么...
              </div>
              <div className="flex items-center gap-6 text-gray-600">
                <div className="flex items-center gap-1">
                  <Heart size={24} />
                  <span className="text-sm">{selectedPost.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle size={24} />
                  <span className="text-sm">{selectedPost.comments}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : isPublishing ? (
          <PublishPage
            onBack={() => setIsPublishing(false)}
            key="publish-page"
          />
        ) : (
          <motion.div
            key="dynamics-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 overflow-y-auto no-scrollbar pb-24"
          >
            {/* Header */}
            <div 
              className="px-6 pt-6 pb-3 sticky top-0 z-10 text-white shadow-sm"
              style={{ backgroundColor: THEME.colors.primary }}
            >
              <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
                <h1 className="text-2xl font-bold">食堂圈</h1>
                <div className="flex gap-6">
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

            {/* Waterfall Layout */}
            <div className="px-4 py-4 max-w-7xl mx-auto w-full">
              <div className="columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                {filteredPosts.map(renderPost)}
              </div>
            </div>

            {/* FAB */}
            <FloatingActionButton
              onClick={() => setIsPublishing(true)}
              icon={<Plus size={24} />}
              className="bottom-20 right-4 md:bottom-8 md:right-8"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
