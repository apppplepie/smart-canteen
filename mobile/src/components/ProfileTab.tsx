import React, { useState, useEffect } from "react";
import {
  Settings,
  Bell,
  ChevronRight,
  Clock,
  Users,
  Coffee,
  MapPin,
  CreditCard,
  HelpCircle,
  LogOut,
  UtensilsCrossed,
  ShoppingBag,
} from "lucide-react";
import { listOrdersByUser } from "../api/orders";
import { listVendors } from "../api/vendors";
import { formatRelativeTime } from "../lib/utils";
import { getBaseUrl } from "../api/client";
import { motion, AnimatePresence } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { LoginPage } from "./LoginPage";
import { HistoryOrdersPage } from "./HistoryOrdersPage";
import { MyPostsPage } from "./MyPostsPage";
import { profileChartDataMock } from "../mocks/profileChart";

export type ProfileUser = { name: string; id: string; avatar: string; userId?: number; token?: string } | null;

export interface ProfileTabProps {
  user?: ProfileUser;
  onLogin?: (u: ProfileUser) => void;
  onNavigate?: (tab: string) => void;
}

export function ProfileTab({
  user: propUser,
  onLogin,
  onNavigate,
}: ProfileTabProps) {
  const user = propUser ?? null;
  const isLoggedIn = !!user;
  const [showLogin, setShowLogin] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [recentOrders, setRecentOrders] = useState<{ name: string; time: string; price: string; status: string; image: string }[]>([]);

  // 0: 未点餐, 1: 制作中, 2: 请取餐
  const [orderStatus, setOrderStatus] = useState(0);

  useEffect(() => {
    const base = getBaseUrl();
    const uid = user?.userId;
    if (!base || uid == null) {
      setRecentOrders([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [list, vendors] = await Promise.all([listOrdersByUser(uid), listVendors()]);
        if (cancelled) return;
        const vendorMap = new Map(vendors.map((v) => [v.id, v.name]));
        const rows = list.slice(0, 3).map((o) => ({
          name: vendorMap.get(o.vendorId ?? 0) ?? "订单",
          time: o.placedAt ? formatRelativeTime(o.placedAt) : "",
          price: String(o.totalAmount),
          status: o.status ?? "已完成",
          image: `https://picsum.photos/seed/v${o.vendorId ?? o.id}/100/100`,
        }));
        setRecentOrders(rows);
      } catch {
        if (!cancelled) setRecentOrders([]);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.userId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setOrderStatus((prev) => (prev + 1) % 3);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUserClick = () => {
    if (!isLoggedIn) {
      setShowLogin(true);
    } else {
      setShowMyPosts(true);
    }
  };

  const handleLogout = () => {
    if (window.confirm("确定要退出登录吗？")) {
      onLogin?.(null);
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col relative overflow-y-auto no-scrollbar pb-24">
      <AnimatePresence>
        {showLogin && (
          <LoginPage
            onBack={() => setShowLogin(false)}
            onLogin={(u) => {
              onLogin?.(u);
              setShowLogin(false);
            }}
          />
        )}
        {showHistory && (
          <HistoryOrdersPage
            onBack={() => setShowHistory(false)}
            userId={user?.userId}
          />
        )}
        {showMyPosts && user && (
          <MyPostsPage onBack={() => setShowMyPosts(false)} user={user} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-[#FF6B6B] px-6 pt-6 pb-24 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="flex justify-between items-center relative z-10 max-w-7xl mx-auto w-full">
          <h1 className="text-2xl font-bold">我的主页</h1>
          <div className="flex gap-4">
            <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
              <Bell size={20} />
            </button>
            <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 -mt-12 md:-mt-16 relative z-10">
        {/* User Info Card */}
        <div 
          onClick={handleUserClick}
          className="bg-white rounded-3xl p-6 md:p-8 shadow-lg shadow-gray-200/50 flex items-center gap-4 md:gap-6 cursor-pointer hover:shadow-xl transition-shadow"
        >
          <img
            src={isLoggedIn ? user.avatar : "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"}
            alt="User"
            className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-sm bg-gray-50"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1">
            {isLoggedIn ? (
              <>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-500 mt-1">学号: {user.id}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-[#FF6B6B]/10 text-[#FF6B6B] px-2 py-1 rounded-md font-medium">
                    Lv.5 美食家
                  </span>
                  <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-md font-medium">
                    大会员
                  </span>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">未登录</h2>
                <p className="text-sm text-gray-500 mt-1">点击登录，开启智慧食堂</p>
              </>
            )}
          </div>
          <ChevronRight className="text-gray-400" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* Current Order Status */}
          {isLoggedIn && (
            <div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                当前点餐状态{" "}
                {orderStatus !== 0 && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
              </h3>
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <AnimatePresence mode="wait">
                  {orderStatus === 0 && (
                    <motion.div
                      key="status-0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col items-center justify-center py-6 cursor-pointer"
                      onClick={() => onNavigate && onNavigate("ordering")}
                    >
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <UtensilsCrossed className="text-gray-400" size={32} />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1">当前未点餐</h4>
                      <p className="text-sm text-gray-500 mb-4">去看看今天有什么好吃的吧</p>
                      <button className="bg-[#FF6B6B] text-white px-6 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-[#FF8E8E] transition-colors">
                        去点餐
                      </button>
                    </motion.div>
                  )}

                  {orderStatus === 1 && (
                    <motion.div
                      key="status-1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                            <Coffee className="text-orange-500" size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">川香麻辣烫</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              取餐码:{" "}
                              <span className="font-mono font-bold text-[#FF6B6B] text-lg">
                                A102
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900">制作中</div>
                          <div className="text-xs text-gray-400 mt-1">预计 5 分钟</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "60%" }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-[#FF6B6B] rounded-full"
                        />
                      </div>
                    </motion.div>
                  )}

                  {orderStatus === 2 && (
                    <motion.div
                      key="status-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                            <ShoppingBag className="text-green-500" size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">川香麻辣烫</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              请前往 <span className="font-bold text-gray-900">1楼东区 3号窗口</span> 取餐
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-500">请取餐</div>
                          <div className="text-xs text-gray-400 mt-1">
                            取餐码: <span className="font-mono font-bold text-gray-900">A102</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
                        <motion.div
                          initial={{ width: "60%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Chart Area */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              食堂排队实况
            </h3>
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> 预计等待:{" "}
                    <strong className="text-gray-900">15分钟</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} /> 前方排队:{" "}
                    <strong className="text-gray-900">12人</strong>
                  </span>
                </div>
                <div className="h-24 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={profileChartDataMock}
                      margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorWait" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#9CA3AF" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#9CA3AF" }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="wait"
                        stroke="#FF6B6B"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorWait)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          {/* Quick Actions */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 hidden lg:block">快捷操作</h3>
            <div className="grid grid-cols-4 lg:grid-cols-2 gap-4">
              {isLoggedIn ? (
                [
                  {
                    icon: CreditCard,
                    label: "食堂卡",
                    color: "text-blue-500",
                    bg: "bg-blue-50",
                  },
                  {
                    icon: MapPin,
                    label: "收货地址",
                    color: "text-green-500",
                    bg: "bg-green-50",
                  },
                  {
                    icon: HelpCircle,
                    label: "客服帮助",
                    color: "text-purple-500",
                    bg: "bg-purple-50",
                  },
                  {
                    icon: LogOut,
                    label: "退出登录",
                    color: "text-gray-500",
                    bg: "bg-gray-100",
                    onClick: handleLogout
                  },
                ].map((action, i) => (
                  <button key={i} onClick={action.onClick} className="flex flex-col items-center gap-2 group">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${action.bg}`}
                    >
                      <action.icon className={action.color} size={24} />
                    </div>
                    <span className="text-xs text-gray-600 font-medium">
                      {action.label}
                    </span>
                  </button>
                ))
              ) : (
                [
                  {
                    icon: HelpCircle,
                    label: "客服帮助",
                    color: "text-purple-500",
                    bg: "bg-purple-50",
                  },
                ].map((action, i) => (
                  <button key={i} className="flex flex-col items-center gap-2 group">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${action.bg}`}
                    >
                      <action.icon className={action.color} size={24} />
                    </div>
                    <span className="text-xs text-gray-600 font-medium">
                      {action.label}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* History Orders */}
          {isLoggedIn && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">历史订单</h3>
                <button 
                  onClick={() => setShowHistory(true)}
                  className="text-sm text-gray-400 flex items-center hover:text-gray-600 transition-colors"
                >
                  全部订单 <ChevronRight size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {(recentOrders.length ? recentOrders : [
                  { name: "健康轻食沙拉", time: "昨天 12:30", price: "28.00", status: "已完成", image: "https://picsum.photos/seed/m2/100/100" },
                  { name: "日式咖喱屋", time: "周二 18:15", price: "32.50", status: "已完成", image: "https://picsum.photos/seed/m4/100/100" },
                  { name: "川香麻辣烫", time: "周一 12:00", price: "18.50", status: "已完成", image: "https://picsum.photos/seed/m1/100/100" },
                ]).map((order, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-50 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <img
                      src={order.image}
                      alt={order.name}
                      className="w-16 h-16 rounded-xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-900">{order.name}</h4>
                        <span className="text-xs text-gray-500">{order.status}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{order.time}</p>
                      <div className="font-bold text-gray-900 mt-2">
                        ¥{order.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
