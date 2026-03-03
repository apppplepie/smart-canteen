import React, { useState } from "react";
import { Home, Compass, User, Sparkles, Store } from "lucide-react";
import { OrderingTab } from "./components/OrderingTab";
import { DynamicsTab } from "./components/DynamicsTab";
import { ProfileTab } from "./components/ProfileTab";
import { AIAssistantTab } from "./components/AIAssistantTab";
import { CanteenOnlineTab } from "./components/CanteenOnlineTab";
import { cn } from "./lib/utils";
import { AnimatePresence, motion } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState("ordering");

  const tabs = [
    { id: "ordering", label: "点餐", icon: Home },
    { id: "dynamics", label: "动态", icon: Compass },
    { id: "assistant", label: "AI助手", icon: Sparkles, isPrimary: true },
    { id: "online", label: "在线", icon: Store },
    { id: "profile", label: "我的", icon: User },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-50 relative overflow-hidden">
      {/* Sidebar Navigation (Desktop) */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 z-20 shadow-sm">
        <div className="text-2xl font-bold text-gray-900 mb-12 px-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FF6B6B] rounded-xl flex items-center justify-center">
            <Sparkles className="text-white" size={18} />
          </div>
          智慧食堂
        </div>
        <div className="flex flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            if (tab.isPrimary) {
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 my-2 group relative overflow-hidden bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white shadow-md shadow-[#FF6B6B]/30 hover:shadow-lg hover:shadow-[#FF6B6B]/40 hover:-translate-y-0.5",
                    isActive ? "ring-2 ring-red-200 ring-offset-2" : ""
                  )}
                >
                  <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
                  <span className="text-[15px] font-bold relative z-10">{tab.label}</span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200",
                  isActive
                    ? "bg-red-50 text-[#FF6B6B] font-bold"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[15px]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 h-full"
          >
            {activeTab === "ordering" && <OrderingTab />}
            {activeTab === "dynamics" && <DynamicsTab />}
            {activeTab === "assistant" && <AIAssistantTab />}
            {activeTab === "online" && <CanteenOnlineTab />}
            {activeTab === "profile" && <ProfileTab onNavigate={setActiveTab} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <div className="md:hidden bg-white border-t border-gray-100 px-4 py-2 flex justify-between items-center pb-safe z-20 relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          if (tab.isPrimary) {
            return (
              <div key={tab.id} className="relative -top-4 flex flex-col items-center justify-center w-16">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg shadow-[#FF6B6B]/40 relative overflow-hidden group bg-gradient-to-tr from-[#FF6B6B] to-[#FF8E8E] text-white",
                    isActive ? "scale-110 ring-4 ring-red-100" : "scale-100 hover:scale-105"
                  )}
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Icon size={26} strokeWidth={isActive ? 2.5 : 2} className="relative z-10 text-white" />
                </button>
                <span className={cn(
                  "text-[10px] font-bold mt-1.5 transition-all duration-300",
                  isActive ? "text-[#FF6B6B]" : "text-gray-500"
                )}>
                  {tab.label}
                </span>
              </div>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center w-14 gap-1 transition-colors duration-200",
                isActive
                  ? "text-[#FF6B6B]"
                  : "text-gray-400 hover:text-gray-600",
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-2xl transition-all duration-300",
                  isActive ? "bg-red-50 scale-110" : "bg-transparent scale-100",
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-all duration-300",
                  isActive ? "opacity-100" : "opacity-70",
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
