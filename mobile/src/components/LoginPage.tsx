import React, { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Sparkles, User, Lock } from "lucide-react";
import { THEME } from "../config/theme";

interface LoginPageProps {
  onBack: () => void;
  onLogin: (user: any) => void;
}

export function LoginPage({ onBack, onLogin }: LoginPageProps) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId && password) {
      // Mock login success; userId 用于调用后端接口（需与 backend users 表一致，默认 1）
      onLogin({
        name: "干饭王",
        id: studentId,
        avatar: "https://picsum.photos/seed/u1/100/100",
        userId: 1,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-white z-[100] flex flex-col"
    >
      <div className="px-6 pt-6 pb-3 sticky top-0 z-10 flex items-center">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 pb-32 max-w-md mx-auto w-full">
        <div className="mb-12 text-center">
          <div className="w-16 h-16 bg-[#FF6B6B] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30">
            <Sparkles className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">欢迎回来</h1>
          <p className="text-gray-500">登录智慧食堂，开启干饭之旅</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="请输入学号"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 focus:border-[#FF6B6B] transition-all"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 focus:border-[#FF6B6B] transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!studentId || !password}
            className="w-full text-white py-4 rounded-2xl font-bold text-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-[0.98]"
            style={{ backgroundColor: THEME.colors.primary }}
          >
            登录
          </button>
        </form>
      </div>
    </motion.div>
  );
}
