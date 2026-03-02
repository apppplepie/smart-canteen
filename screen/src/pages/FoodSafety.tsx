import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Activity, Droplets, Package, CheckCircle2, 
  QrCode, Thermometer, Clock, MapPin, AlertTriangle, 
  Fish, Wheat, Coffee, Info, ChevronRight, Users, Store
} from 'lucide-react';
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, ReferenceArea, Brush, Area, AreaChart
} from 'recharts';
import { tempData, foodSafetyReports, foodSafetySamples, foodSafetyAllergens } from '../mocks/foodSafety';

// --- Custom Tooltip ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <p className="text-white font-bold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" /> {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-6 text-sm mb-2 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}` }} />
              <span className="text-slate-300">{entry.name}:</span>
            </div>
            <span className="text-white font-black tracking-wider">{entry.value} {entry.name === '冷柜温度' ? '°C' : 'ppm'}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- Trust Gauge Component ---
const TrustGauge = () => {
  const [value, setValue] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  
  useEffect(() => {
    // Simulate data loading animation
    const timer = setTimeout(() => setValue(98), 500);
    return () => clearTimeout(timer);
  }, []);

  const radius = 80;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center h-full">
      <div className="relative cursor-pointer group" onClick={() => setShowHistory(!showHistory)}>
        <svg width="240" height="140" viewBox="0 0 200 120" className="overflow-visible">
          <defs>
            <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          {/* Background Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Value Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gauge-grad)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter="url(#neon-glow)"
            className="transition-all duration-1500 ease-out"
          />
        </svg>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center w-full">
          <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            {value}<span className="text-2xl">%</span>
          </span>
          <span className="text-xs text-slate-400 mt-1 font-medium tracking-widest uppercase">综合信任指数</span>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400/80 mt-2 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <Clock className="w-3 h-3" /> 最近更新: 刚刚
          </div>
        </div>
      </div>

      {/* History Popover */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-4 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20"
          >
            <h4 className="text-xs font-bold text-slate-400 mb-2">近7日信任指数趋势</h4>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:95},{v:96},{v:94},{v:98},{v:97},{v:99},{v:98}]}>
                  <defs>
                    <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="#10b981" fill="url(#histGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Report Cards Component ---
const ReportCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full pt-12">
      {foodSafetyReports.map((report, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group flex flex-col justify-between"
        >
          {/* Decorative background element */}
          <div className="absolute -right-6 -top-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
            {report.icon}
          </div>

          <div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner shrink-0">
                {report.icon}
              </div>
              <div className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                {report.result}
              </div>
            </div>

            <div className="relative z-10 mb-4">
              <h3 className="text-base font-black text-white tracking-wide mb-1">{report.type}</h3>
              <p className="text-xs text-slate-400">{report.agency}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10 relative z-10">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <Clock className="w-3.5 h-3.5" />
              {report.time}
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs font-bold transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95">
              <QrCode className="w-3.5 h-3.5" />
              报告
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// --- Main Component ---
export default function FoodSafety() {
  return (
    <PageContainer>
      <style>{`
        @keyframes scroll-y {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-scroll-y {
          animation: scroll-y 20s linear infinite;
        }
        .animate-scroll-y:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="bg-slate-950 rounded-[2rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)] relative min-h-[calc(100vh-8rem)] p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Ambient Background */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />

        {/* Top Row: Gauge & Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          {/* Trust Gauge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:col-span-1 flex flex-col items-center justify-center min-h-[280px]"
          >
            <TrustGauge />
          </motion.div>

          {/* Report Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:col-span-2 min-h-[280px] relative"
          >
            <div className="absolute top-6 left-6 z-20">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <ShieldCheck className="text-emerald-400 w-6 h-6" />
                实时检测公示
              </h2>
            </div>
            <ReportCards />
          </motion.div>
        </div>

        {/* Middle Row: Time-Series Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative z-10"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Activity className="text-cyan-400 w-6 h-6" />
                环境消杀与冷链温度时序图
              </h2>
              <p className="text-sm text-slate-400 mt-1">支持滑动底部时间轴缩放查看详细数据</p>
            </div>
            <div className="flex gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50" />
                <span className="text-emerald-400">温度合格区 (2-8°C)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-cyan-500/20 border border-cyan-500/50" />
                <span className="text-cyan-400">浓度合格区 (150-200ppm)</span>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={tempData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <filter id="glow-line-temp">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  <filter id="glow-line-ppm">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" domain={[0, 12]} stroke="#10b981" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" domain={[100, 250]} stroke="#06b6d4" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                
                {/* Target Bands */}
                <ReferenceArea yAxisId="left" y1={2} y2={8} />
                <ReferenceArea yAxisId="right" y1={150} y2={200} />
                
                <Line yAxisId="left" type="monotone" dataKey="temp" name="冷柜温度" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} filter="url(#glow-line-temp)" />
                <Line yAxisId="right" type="monotone" dataKey="ppm" name="消毒液浓度" stroke="#06b6d4" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }} filter="url(#glow-line-ppm)" />
                
                <Brush dataKey="time" height={30} stroke="rgba(255,255,255,0.2)" fill="rgba(0,0,0,0.2)" travellerWidth={10} tickFormatter={() => ''} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Bottom Row: Samples & Allergens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
          
          {/* Sample Retention Table (Scrolling) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col h-[400px]"
          >
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Package className="text-violet-400 w-6 h-6" />
                菜品留样追踪
              </h2>
            </div>
            <div className="flex-1 overflow-hidden relative">
              {/* Gradient masks for smooth fade */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-slate-900/80 to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-900/80 to-transparent z-10 pointer-events-none" />
              
              <div className="animate-scroll-y flex flex-col gap-3 pt-2">
                {[...foodSafetySamples, ...foodSafetySamples].map((sample, idx) => (
                  <div key={idx} className="bg-black/20 border border-white/5 rounded-2xl p-4 hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-white/10 rounded text-xs font-mono text-slate-300">{sample.id}</span>
                        <span className="text-sm font-bold text-white">{sample.meal}</span>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        sample.status.includes('冷藏') ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 
                        sample.status.includes('销毁') ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' : 
                        'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}>
                        {sample.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {sample.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {sample.loc}</span>
                      <span className="flex items-center gap-1 ml-auto"><Users className="w-3.5 h-3.5" /> {sample.operator}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Allergen Tags (Scrolling) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col h-[400px]"
          >
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <AlertTriangle className="text-amber-400 w-6 h-6" />
                今日过敏原公示
              </h2>
            </div>
            
            <div className="flex-1 overflow-hidden relative mb-4">
              {/* Gradient masks for smooth fade */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-slate-900/80 to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-900/80 to-transparent z-10 pointer-events-none" />
              
              <div className="animate-scroll-y flex flex-col gap-4 pt-2">
                {[...foodSafetyAllergens, ...foodSafetyAllergens].map((item, idx) => (
                  <div key={idx} className="bg-black/20 border border-white/5 rounded-2xl p-5">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                      <Store className="w-4 h-4 text-slate-400" />
                      {item.window}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {item.tags.map((tag, tIdx) => {
                        const Icon = tag.icon;
                        return (
                          <div key={tIdx} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${tag.color} shadow-sm`}>
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-bold">{tag.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="shrink-0 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <p className="text-xs text-blue-300 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                温馨提示：食堂已要求各窗口严格区分加工器具。如您有严重食物过敏史，请在点餐前再次向工作人员确认。
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </PageContainer>
  );
}
