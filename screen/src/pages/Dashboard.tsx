import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, Clock, Users, Flame, Sparkles, BellRing, 
  CheckCircle2, ArrowRight, Map, ChefHat, Utensils
} from 'lucide-react';
import { useDashboard } from '../hooks/useBackendData';

// --- Components ---

type StatusConfig = Record<string, { text: string; color: string; bg: string; border: string; shadow: string }>;

const WindowCard: React.FC<{ window: any; isServing: boolean; statusConfig: StatusConfig }> = ({ window, isServing, statusConfig }) => {
  const config = statusConfig[window.status as keyof StatusConfig] ?? statusConfig.idle;
  
  return (
    <motion.div
      animate={{ 
        y: [0, -5, 0],
        boxShadow: isServing 
          ? '0 0 30px rgba(255,255,255,0.4), inset 0 0 20px rgba(255,255,255,0.2)' 
          : '0 10px 30px rgba(0,0,0,0.2)'
      }}
      transition={{ 
        y: { repeat: Infinity, duration: 3 + Math.random() * 2, ease: "easeInOut" },
        boxShadow: { duration: 0.3 }
      }}
      className={`relative w-[280px] shrink-0 bg-black/40 backdrop-blur-xl border ${isServing ? 'border-white/50' : 'border-white/10'} rounded-3xl overflow-hidden group flex flex-col`}
    >
      {/* Image Header */}
      <div className="h-32 relative w-full shrink-0">
        <img src={window.image} alt={window.dish} className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${config.bg.split('/')[0].replace('bg-', 'bg-')} animate-pulse`} />
          <span className={`text-[10px] font-bold ${config.color}`}>{config.text}</span>
        </div>
        <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
          <div>
            <h3 className="text-lg font-black text-white leading-tight">{window.id}</h3>
            <p className="text-xs text-slate-300">{window.name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-2 border border-white/5 text-center">
            <div className="text-[10px] text-slate-400 mb-0.5">排队人数</div>
            <motion.div 
              key={window.queue}
              initial={{ scale: 1.5, color: '#4ade80' }}
              animate={{ scale: 1, color: '#ffffff' }}
              className="text-xl font-black"
            >
              {window.queue}
            </motion.div>
          </div>
          <div className="bg-white/5 rounded-xl p-2 border border-white/5 text-center">
            <div className="text-[10px] text-slate-400 mb-0.5">预计等待</div>
            <div className="text-xl font-bold text-white">{window.wait}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2 mt-auto">
          <Utensils className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">主打: <span className="text-cyan-300 font-bold">{window.dish}</span></span>
        </div>
      </div>

      {/* Serving Animation Overlay */}
      <AnimatePresence>
        {isServing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center z-20 bg-emerald-500/10 backdrop-blur-[2px]"
          >
            <motion.div
              animate={{ y: [-10, -30], opacity: [1, 0] }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-emerald-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]"
            >
              <ChefHat size={48} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const HeatmapGuide = ({ windows }: { windows: any[] }) => {
  // Find best window (idle, lowest queue)
  const bestWindow = [...windows].sort((a, b) => a.queue - b.queue)[0];

  const getHeatmapColor = (queue: number) => {
    // 0 queue -> 140 (green), 20 queue -> 0 (red)
    const ratio = Math.min(queue / 20, 1);
    const hue = (1 - ratio) * 140;
    return `hsl(${hue}, 80%, 45%)`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Map className="text-cyan-400 w-5 h-5" />
          热力图智能引导
        </h2>
        <div className="flex gap-2 text-[10px] font-bold">
          <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">空闲</span>
          <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400">繁忙</span>
          <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-400">拥堵</span>
        </div>
      </div>

      <div className="flex-1 relative bg-black/20 rounded-2xl border border-white/5 p-4 overflow-hidden flex flex-col justify-between min-h-0">
        {/* Flowing Gradient Background */}
        <div className="absolute inset-0 opacity-30 mix-blend-screen pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-purple-500/20 animate-pulse" style={{ animationDuration: '4s' }} />
        </div>

        {/* Heatmap Grid - 20 items, 5 cols */}
        <div className="grid grid-cols-5 gap-2 relative z-10 mb-4 shrink-0">
          {windows.map(w => {
            const isBest = w.id === bestWindow.id;
              
            return (
              <motion.div 
                key={w.id}
                whileHover={{ scale: 1.1 }}
                className={`relative h-10 rounded-lg border border-white/10 flex items-center justify-center shadow-sm transition-colors duration-700 ${isBest ? 'ring-2 ring-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' : ''}`}
                style={{ backgroundColor: getHeatmapColor(w.queue) }}
              >
                {isBest && (
                  <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(250,204,21,0.8)] z-20">
                    <Sparkles className="w-2.5 h-2.5 text-black" />
                  </div>
                )}
                <span className="text-white/90 font-bold text-sm drop-shadow-md">{w.id.replace('W', '')}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Recommendation Module */}
        <div className="relative z-10 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl p-3 flex items-center justify-between shadow-[0_0_20px_rgba(6,182,212,0.15)] mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-400/50">
              <ChefHat className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-cyan-300 font-bold mb-0.5">最优推荐</p>
              <p className="text-sm text-white font-black">{bestWindow.id} {bestWindow.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-0.5">预计等待</p>
            <p className="text-lg font-black text-emerald-400">{bestWindow.wait}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CallingArea = ({
  initialJustServed,
  initialWaiting,
}: {
  initialJustServed: { id: string; win: string }[];
  initialWaiting: string[];
}) => {
  const [justServed, setJustServed] = useState<{ id: string; win: string }[]>(initialJustServed);
  const [waiting, setWaiting] = useState<string[]>(initialWaiting);

  useEffect(() => {
    const timer = setInterval(() => {
      const newId = (Math.random() > 0.5 ? 'A' : 'B') + Math.floor(100 + Math.random() * 900);
      const newWin = 'W0' + Math.floor(1 + Math.random() * 8);
      
      setJustServed(prev => {
        const next = [{ id: newId, win: newWin }, ...prev].slice(0, 4);
        return next;
      });
      
      setWaiting(prev => {
        const next = [newId, ...prev].slice(0, 15);
        return next;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <BellRing className="text-yellow-400 w-5 h-5" />
          实时叫号大厅
        </h2>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Just Served (Sliding in) */}
        <div className="bg-black/20 rounded-2xl border border-white/5 p-4 overflow-hidden flex flex-col">
          <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4" /> 请取餐
          </h3>
          <div className="flex-1 relative min-h-0 overflow-hidden">
            <AnimatePresence>
              {justServed.map((item, idx) => (
                <motion.div
                  key={item.id + idx}
                  initial={{ opacity: 0, x: -50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="mb-3 last:mb-0 bg-gradient-to-r from-emerald-500/20 to-transparent border-l-4 border-emerald-500 p-3 rounded-r-xl shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-black text-white tracking-wider">{item.id}</span>
                    <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                      {item.win} 窗口
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Waiting for Pickup (Stacking) */}
        <div className="bg-black/20 rounded-2xl border border-white/5 p-4 flex flex-col">
          <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2 shrink-0">
            <Clock className="w-4 h-4" /> 待取餐
          </h3>
          <div className="flex-1 overflow-hidden relative min-h-0">
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-slate-900/80 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-slate-900/80 to-transparent z-10" />
            <div className="flex flex-wrap gap-2 content-start h-full overflow-y-auto custom-scrollbar pr-1 pt-2">
              <AnimatePresence>
                {waiting.map((id, idx) => (
                  <motion.div
                    key={id + idx}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-mono font-bold text-sm"
                  >
                    {id}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { windows, setWindows, statusConfig, initialJustServed, initialWaiting, isFromApi } = useDashboard();
  const [servingWindowId, setServingWindowId] = useState<string | null>(null);

  // 仅在使用 mock 数据时模拟排队人数变化
  useEffect(() => {
    if (isFromApi) return;
    const timer = setInterval(() => {
      setWindows((prev) => {
        const next = [...prev];
        // Pick multiple random windows to update to make the heatmap look alive
        for (let i = 0; i < 4; i++) {
          const idx = Math.floor(Math.random() * next.length);
          const win = { ...next[idx] };
          
          // Randomly decrease queue (serving) or increase
          if (win.queue > 0 && Math.random() > 0.4) {
            win.queue -= 1;
            if (i === 0) {
              setServingWindowId(win.id);
              setTimeout(() => setServingWindowId(null), 1000); // Reset animation state
            }
          } else {
            win.queue += 1;
          }
          
          // Update status based on queue
          if (win.queue < 5) win.status = 'idle';
          else if (win.queue < 15) win.status = 'busy';
          else win.status = 'congested';
          
          win.wait = `${Math.max(1, win.queue * 1.5).toFixed(0)}min`;
          next[idx] = win;
        }
        return next;
      });
    }, 1500);
    return () => clearInterval(timer);
  }, [isFromApi, setWindows]);

  return (
    <PageContainer>
      <style>{`
        @keyframes scroll-x {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-x {
          animation: scroll-x 80s linear infinite;
        }
        .animate-scroll-x:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      <div className="bg-slate-950 rounded-[2rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)] relative min-h-[calc(100vh-8rem)] flex flex-col p-4 md:p-6 lg:p-8 gap-6">
        
        {/* Ambient Backgrounds */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* 1) Window Real-time Status Stream (50-60% height) */}
        <div className="min-h-[350px] relative z-10 flex flex-col">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <Store className="text-blue-400 w-8 h-8" />
              窗口实时状态流
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-400 bg-white/5 px-4 py-2 rounded-full border border-white/10">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              系统实时同步中
            </div>
          </div>
          
          <div className="flex-1 relative overflow-hidden rounded-3xl bg-black/20 border border-white/5">
            {/* Gradient Masks for Carousel */}
            <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />
            
            <div className="absolute inset-y-0 flex items-center">
              <div className="animate-scroll-x flex gap-6 px-6">
                {/* Double the array for seamless infinite scroll */}
                {[...windows, ...windows].map((window, idx) => (
                  <WindowCard 
                    key={`${window.id}-${idx}`} 
                    window={window} 
                    isServing={servingWindowId === window.id}
                    statusConfig={statusConfig}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section (Fixed height to prevent flickering) */}
        <div className="h-[460px] shrink-0 grid grid-cols-1 lg:grid-cols-5 gap-6 relative z-10">
          
          {/* 2) Heatmap Intelligent Guide */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col overflow-hidden"
          >
            <HeatmapGuide windows={windows} />
          </motion.div>

          {/* 3) Scrolling Calling Area */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col overflow-hidden"
          >
            <CallingArea initialJustServed={initialJustServed} initialWaiting={initialWaiting} />
          </motion.div>

        </div>
      </div>
    </PageContainer>
  );
}

