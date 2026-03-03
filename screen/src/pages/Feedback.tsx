import React from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { motion } from 'motion/react';
import { MessageSquare, Send, BarChart3, PieChart as PieChartIcon, CheckCircle2, Clock, TrendingUp, Users } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useFeedback } from '../hooks/useBackendData';

const getThemeClasses = (theme: string) => {
  switch (theme) {
    case 'cyan': return 'bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20';
    case 'violet': return 'bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20';
    case 'emerald': return 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20';
    case 'amber': return 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20';
    default: return 'bg-white/5 border-white/10 hover:bg-white/10';
  }
};

const getBadgeClasses = (theme: string) => {
  switch (theme) {
    case 'cyan': return 'bg-cyan-500/20 text-cyan-300';
    case 'violet': return 'bg-violet-500/20 text-violet-300';
    case 'emerald': return 'bg-emerald-500/20 text-emerald-300';
    case 'amber': return 'bg-amber-500/20 text-amber-300';
    default: return 'bg-slate-500/20 text-slate-300';
  }
};

// --- Custom Tooltip for Recharts ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-xl">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-300">{entry.name}:</span>
            <span className="text-white font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- Main Component ---
export default function Feedback() {
  const { barData, latestFeedbacks, loading } = useFeedback();
  return (
    <PageContainer>
      <div className="bg-slate-950 rounded-[2rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)] relative min-h-[calc(100vh-8rem)] p-6 md:p-8">
        
        {/* Ambient Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Header Title */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mb-8 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <MessageSquare className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
              倾听与反馈
            </h1>
            <p className="text-cyan-400 text-sm font-medium tracking-wide mt-1">VOICE & FEEDBACK CENTER</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">
          
          {/* Left Column: Latest Feedback (Takes more space on large screens) */}
          <div className="xl:col-span-7 space-y-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="text-purple-400 w-5 h-5" />
                最新留言墙
              </h2>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 font-medium">
                实时更新
              </div>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {loading && <div className="text-slate-400 text-sm">加载中...</div>}
              {latestFeedbacks.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.15, type: "spring", stiffness: 100 }}
                  className={`${getThemeClasses(item.theme)} backdrop-blur-xl border rounded-3xl p-6 transition-all duration-300 group`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getBadgeClasses(item.theme)}`}>
                        {item.type}
                      </span>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{item.time}</p>
                    </div>
                    {item.status === 'replied' ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs rounded-full font-medium shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                        <CheckCircle2 className="w-3 h-3" /> 已回复
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs rounded-full font-medium shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                        <Clock className="w-3 h-3" /> 待处理
                      </span>
                    )}
                  </div>
                  
                  <p className="text-slate-200 text-sm leading-relaxed mb-4 font-medium">
                    "{item.content}"
                  </p>

                  {item.reply && (
                    <div className={`relative pl-4 py-3 border-l-2 bg-black/20 rounded-r-xl mt-4 ${item.theme === 'cyan' ? 'border-cyan-500/50' : item.theme === 'violet' ? 'border-violet-500/50' : item.theme === 'emerald' ? 'border-emerald-500/50' : 'border-amber-500/50'}`}>
                      <p className={`text-xs font-bold mb-1 flex items-center gap-2 ${item.theme === 'cyan' ? 'text-cyan-400' : item.theme === 'violet' ? 'text-violet-400' : item.theme === 'emerald' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${item.theme === 'cyan' ? 'bg-cyan-400' : item.theme === 'violet' ? 'bg-violet-400' : item.theme === 'emerald' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        官方回复
                      </p>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {item.reply}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column: Stats, Charts & Form */}
          <div className="xl:col-span-5 space-y-6 flex flex-col">
            
            {/* Stats Overview */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <TrendingUp size={80} className="text-cyan-400" />
                </div>
                <p className="text-cyan-400 text-xs font-bold mb-1">本月收到反馈</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">342</span>
                  <span className="text-xs text-cyan-400/70">条</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border border-purple-500/20 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <CheckCircle2 size={80} className="text-purple-400" />
                </div>
                <p className="text-purple-400 text-xs font-bold mb-1">综合回复率</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">96.5</span>
                  <span className="text-xs text-purple-400/70">%</span>
                </div>
              </div>
            </motion.div>

            {/* Charts Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex-1 min-h-[280px] flex flex-col"
            >
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="text-cyan-400 w-4 h-4" />
                近7天反馈类型趋势
              </h3>
              <div className="flex-1 w-full h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                    <Bar dataKey="food" name="菜品建议" stackId="a" fill="#06b6d4" animationDuration={1500} radius={[0, 0, 4, 4]} />
                    <Bar dataKey="service" name="服务态度" stackId="a" fill="#8b5cf6" animationDuration={1500} />
                    <Bar dataKey="env" name="环境卫生" stackId="a" fill="#10b981" animationDuration={1500} />
                    <Bar dataKey="other" name="其他" stackId="a" fill="#f59e0b" animationDuration={1500} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Submit Form */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.3)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500" />
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <Send className="text-pink-400 w-5 h-5" />
                快速提交建议
              </h3>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <select defaultValue="" className="w-full bg-black/20 border border-white/10 text-slate-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all appearance-none">
                      <option value="" disabled>选择留言类型</option>
                      <option value="food" className="bg-slate-800">菜品建议</option>
                      <option value="service" className="bg-slate-800">服务态度</option>
                      <option value="env" className="bg-slate-800">环境卫生</option>
                      <option value="other" className="bg-slate-800">其他</option>
                    </select>
                  </div>
                  <div>
                    <input 
                      type="text" 
                      placeholder="联系方式 (选填)" 
                      className="w-full bg-black/20 border border-white/10 text-slate-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-slate-500"
                    />
                  </div>
                </div>
                <div>
                  <textarea 
                    rows={3}
                    className="w-full bg-black/20 border border-white/10 text-slate-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-slate-500 resize-none"
                    placeholder="请详细描述您的建议或意见，我们将不断改进..."
                  ></textarea>
                </div>
                <button 
                  type="button"
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  发送反馈
                </button>
              </form>
            </motion.div>

          </div>
        </div>
      </div>
    </PageContainer>
  );
}
