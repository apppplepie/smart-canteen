import React, { useState, useMemo } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Plus,
  MapPin,
  ChevronLeft,
  Send,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FloatingActionButton } from "./FloatingActionButton";
import { PublishPage } from "./PublishPage";
import { MerchantPage } from "./MerchantPage";
import { THEME } from "../config/theme";
import { cn } from "../lib/utils";
import { SharedPostDetail } from "./SharedPostDetail";

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
  {
    id: 5,
    user: { name: "热心同学", avatar: "https://picsum.photos/seed/u5/100/100" },
    content: "【寻物启事】昨天中午在一楼食堂丢了一把黑色的雨伞，伞柄有划痕。有捡到的同学麻烦联系我，必有重谢！",
    image: "https://picsum.photos/seed/umbrella/400/300",
    likes: 12,
    comments: 3,
    time: "2小时前",
    height: "h-48",
    isLatest: true,
    tags: ["寻物启事", "一楼东区"]
  },
  {
    id: 6,
    user: { name: "食堂大妈", avatar: "https://picsum.photos/seed/u6/100/100" },
    content: "【失物招领】在二楼西区靠窗的桌子上捡到一张校园卡，名字叫张三，已交到二楼服务台，请失主尽快来领取。",
    image: "https://picsum.photos/seed/card/400/300",
    likes: 45,
    comments: 1,
    time: "昨天",
    height: "h-56",
    isLatest: false,
    tags: ["失物招领", "二楼服务台"]
  },
  {
    id: 7,
    user: { name: "匿名用户", avatar: "https://picsum.photos/seed/anon/100/100" },
    content: "【问题反馈】二楼靠窗的桌子有些油腻，希望能加强清理频率。环境卫生需要大家共同维护。",
    image: "",
    likes: 88,
    comments: 15,
    time: "昨天",
    height: "h-32",
    isLatest: false,
    tags: ["问题反馈", "环境卫生"]
  }
];

export function DynamicsTab() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<"推荐" | "最新">("推荐");
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedMerchantId, setSelectedMerchantId] = useState<number | null>(null);

  const [rating, setRating] = useState(0);

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
      {post.image && (
        <img
          src={post.image}
          alt="Post"
          className={`w-full object-cover ${post.height}`}
          referrerPolicy="no-referrer"
        />
      )}
      <div className="p-4">
        {post.merchantName && (
          <div className="flex items-center gap-1 text-[10px] text-[#FF6B6B] bg-red-50 w-fit px-2 py-1 rounded-md mb-2">
            <MapPin size={10} />
            <span>{post.merchantName} · {post.dishName}</span>
          </div>
        )}
        {post.tags && (
          <div className="flex gap-2 mb-2">
            {post.tags.map((tag: string) => (
              <span key={tag} className={cn("text-[10px] px-2 py-1 rounded-md font-bold", tag === "寻物启事" ? "bg-orange-50 text-orange-500" : tag === "失物招领" ? "bg-blue-50 text-blue-500" : tag === "问题反馈" ? "bg-red-50 text-[#FF6B6B]" : "bg-gray-50 text-gray-500")}>
                {tag}
              </span>
            ))}
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
    <div className="h-full bg-gray-50 flex flex-col relative overflow-y-auto no-scrollbar pb-24">
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
            <div className="flex items-center px-4 pt-6 pb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
              <button onClick={() => setSelectedPost(null)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-full">
                <ChevronLeft size={24} />
              </button>
              <span className="font-bold ml-2">帖子详情</span>
            </div>
            <SharedPostDetail 
              post={selectedPost} 
              onMerchantClick={(id) => setSelectedMerchantId(id)} 
            />
          </motion.div>
        ) : isPublishing ? (
          <PublishPage
            onBack={() => setIsPublishing(false)}
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
        {/* Quick Publish Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img src="https://picsum.photos/seed/m2/100/100" className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">健康轻食沙拉</h3>
                      <p className="text-xs text-gray-500 mt-0.5">招牌鸡胸肉沙拉</p>
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
                      disabled={rating === 0}
                      className="px-4 py-1.5 bg-[#FF6B6B] text-white text-xs font-bold rounded-full shadow-sm disabled:opacity-50 transition-colors"
                    >
                      发布评分
                    </button>
                  </div>
                </div>
                <div 
                  onClick={() => setIsPublishing(true)}
                  className="bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-400 cursor-text hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  写下你的长评，分享美食体验...
                </div>
        </div>

        {/* Waterfall Layout */}
        <div className="columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {filteredPosts.map(renderPost)}
        </div>
      </div>
    </div>
  );
}
