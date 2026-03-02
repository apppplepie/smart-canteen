import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { UtensilsCrossed, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { navItems } from '../../mocks/nav';

export function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekDay = days[date.getDay()];
    
    return `${year}-${month}-${day} ${weekDay} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <header className="h-16 bg-slate-900/50 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 z-20 sticky top-0 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Left: Project Name */}
      <div className="flex items-center gap-3 w-[280px]">
        <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          <UtensilsCrossed size={20} />
        </div>
        <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 tracking-wide">智慧食堂管理平台</span>
      </div>

      {/* Center: Main Navigation */}
      <nav className="flex-1 flex justify-center">
        {/* Fixed width container to prevent layout shifts when items expand/collapse */}
        <div className="flex items-center space-x-2 bg-black/20 p-1.5 rounded-2xl border border-white/5 w-[580px] justify-between shadow-inner">
          {navItems.map((item) => {
            const isActive = item.path === '/' 
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
            
            const Icon = item.icon;
              
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`relative flex items-center justify-center h-10 rounded-xl text-sm font-bold transition-all duration-300 ease-out ${
                  isActive
                    ? 'text-cyan-400 bg-white/10 shadow-[0_0_15px_rgba(6,182,212,0.2)] border border-cyan-500/30 px-4 flex-1'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 w-10'
                }`}
              >
                <Icon size={18} className={`transition-transform duration-300 shrink-0 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'scale-100'}`} />
                <AnimatePresence mode="popLayout">
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                      animate={{ opacity: 1, width: 'auto', marginLeft: 8 }}
                      exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Right: Actions & Date & Time */}
      <div className="w-[280px] flex justify-end items-center gap-4">
        <button
          onClick={() => setIsLightMode(!isLightMode)}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-white/10 transition-all shadow-inner keep-colors"
          title={isLightMode ? "切换到暗黑模式" : "切换到白天模式"}
        >
          {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <div className="flex items-center gap-2 text-[13px] font-mono text-cyan-400 bg-cyan-500/10 px-4 py-2 rounded-xl border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
          {formatDate(currentTime)}
        </div>
      </div>
    </header>
  );
}
