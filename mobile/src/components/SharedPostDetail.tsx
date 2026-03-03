import React from "react";
import { ChevronLeft, Share2, MapPin, Heart, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export interface SharedPost {
  id: string | number;
  user?: { name: string; avatar: string };
  time?: string;
  postTime?: string;
  content: string;
  image?: string;
  likes?: number;
  comments?: number;
  merchantId?: number;
  merchantName?: string;
  dishName?: string;
  tags?: string[];
  // For feedback
  type?: string;
  status?: string;
  reply?: string;
  // For lost/found
  location?: string;
  isFound?: boolean;
  isReturned?: boolean;
}

interface SharedPostDetailProps {
  post: SharedPost;
  onMerchantClick?: (id: number) => void;
  children?: React.ReactNode;
}

export function SharedPostDetail({ post, onMerchantClick, children }: SharedPostDetailProps) {
  const timeDisplay = post.time || post.postTime;
  const userDisplay = post.user || { name: "匿名用户", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=anon" };

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-white relative z-20">
      {/* User Info Header (No back button, just user info) */}
      <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <img src={userDisplay.avatar} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
          <span className="font-medium text-gray-900">{userDisplay.name}</span>
        </div>
        <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-full">
          <Share2 size={20} />
        </button>
      </div>

      {post.image && (
        <img src={post.image} className="w-full h-auto max-h-[60vh] object-cover" referrerPolicy="no-referrer" />
      )}
      
      <div className="p-6">
        {post.merchantName && (
          <button 
            onClick={() => onMerchantClick?.(post.merchantId!)}
            className="flex items-center gap-2 text-sm text-[#FF6B6B] bg-red-50 px-3 py-2 rounded-xl mb-4 hover:bg-red-100 transition-colors"
          >
            <MapPin size={16} />
            <span className="font-medium">{post.merchantName}</span>
            <span className="text-gray-400 mx-1">|</span>
            <span>{post.dishName}</span>
            <ChevronLeft size={16} className="rotate-180 ml-auto" />
          </button>
        )}
        
        {post.tags && (
          <div className="flex gap-2 mb-4">
            {post.tags.map((tag: string) => (
              <span key={tag} className={cn("text-xs px-3 py-1 rounded-lg font-bold", tag === "寻物启事" ? "bg-orange-50 text-orange-500" : tag === "失物招领" ? "bg-blue-50 text-blue-500" : tag === "问题反馈" ? "bg-red-50 text-[#FF6B6B]" : "bg-gray-50 text-gray-500")}>
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <p className="text-gray-800 text-lg leading-relaxed mb-4">{post.content}</p>
        
        {children}
        
        <div className="text-sm text-gray-400 mb-6 mt-4">{timeDisplay}</div>
        
        <div className="border-t border-gray-100 pt-6">
          <h3 className="font-bold text-gray-900 mb-4">共 {post.comments || 0} 条评论</h3>
          <div className="flex gap-3 mb-6">
            <img src="https://picsum.photos/seed/user/100/100" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
            <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-2 text-sm text-gray-500">
              说点什么...
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe flex items-center justify-between px-6 z-50">
        <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-500 mr-4">
          说点什么...
        </div>
        <div className="flex items-center gap-6 text-gray-600">
          <div className="flex items-center gap-1">
            <Heart size={24} />
            <span className="text-sm">{post.likes || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle size={24} />
            <span className="text-sm">{post.comments || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
