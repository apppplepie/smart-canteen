import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Bell, Clock, ChevronLeft, ChevronRight, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

// --- Mock Data ---
const foundItems = [
  { id: 1, title: '捡到黑色保温杯', location: '第一食堂一楼', desc: '富光牌黑色保温杯，已交至前台服务处。', img: 'https://picsum.photos/seed/cup/800/600' },
  { id: 2, title: '捡到 AirPods 耳机盒', location: '第二食堂洗手池', desc: '白色，带有硅胶保护套，已交至前台。', img: 'https://picsum.photos/seed/airpods/800/600' },
  { id: 3, title: '捡到卡其色帆布包', location: '第一食堂二楼', desc: '内有几本书和文具，已交至前台。', img: 'https://picsum.photos/seed/bag/800/600' },
];

const lostItems = [
  { id: 1, user: '王同学', avatar: 'W', color: 'from-rose-400 to-red-500', time: '10分钟前', item: '一串钥匙', location: '第一食堂二楼靠窗', desc: '带有皮卡丘挂件，非常重要！' },
  { id: 2, user: '李阿姨', avatar: 'L', color: 'from-purple-400 to-pink-500', time: '1小时前', item: '蓝色校园卡', location: '第三食堂打饭窗口', desc: '卡尾号为 4592，捡到请联系。' },
  { id: 3, user: '张老师', avatar: 'Z', color: 'from-emerald-400 to-teal-500', time: '3小时前', item: '黑色雨伞', location: '第二食堂门口伞架', desc: '天堂牌折叠伞，纯黑色。' },
  { id: 4, user: '匿名同学', avatar: 'U', color: 'from-amber-400 to-orange-500', time: '昨天 18:30', item: '高数课本', location: '三食堂三楼', desc: '书内夹有书签，名字写在扉页。' },
  { id: 5, user: '赵同学', avatar: 'Z', color: 'from-blue-400 to-cyan-500', time: '昨天 12:00', item: '粉色水杯', location: '第二食堂洗手池', desc: '带有贴纸，非常喜欢。' },
];

// --- Subcomponents ---
const Marquee = () => {
  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-r from-amber-900/40 via-orange-900/40 to-amber-900/40 py-2.5 shadow-[0_0_20px_rgba(245,158,11,0.15)] border-b border-amber-500/20 z-20 shrink-0">
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 25 }}
      >
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center gap-8 px-4 text-amber-300 font-bold text-sm tracking-widest">
            <Bell className="w-4 h-4 animate-bounce" />
            <span>温馨提示：所有捡到的失物已统一交至第一食堂一楼前台服务处，请失主凭有效证件前往认领！</span>
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>感谢拾金不昧的同学们，让校园充满温暖！</span>
            <Bell className="w-4 h-4 animate-bounce" />
            <span>温馨提示：所有捡到的失物已统一交至第一食堂一楼前台服务处，请失主凭有效证件前往认领！</span>
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>感谢拾金不昧的同学们，让校园充满温暖！</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const FoundCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % foundItems.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSwipe = (direction: number) => {
    if (direction > 0) {
      setCurrentIndex((prev) => (prev + 1) % foundItems.length);
    } else {
      setCurrentIndex((prev) => (prev - 1 + foundItems.length) % foundItems.length);
    }
  };

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)] group border border-white/10">
      <AnimatePresence initial={false} mode="wait">
        <motion.img
          key={currentIndex}
          src={foundItems[currentIndex].img}
          alt="Found Item"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset }) => {
            if (offset.x < -50) handleSwipe(1);
            else if (offset.x > 50) handleSwipe(-1);
          }}
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent pointer-events-none" />

      {/* Content */}
      <motion.div 
        key={`content-${currentIndex}`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-0 left-0 right-0 p-6 md:p-8 pointer-events-none"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs rounded-full font-bold mb-3 backdrop-blur-md">
          <CheckCircle2 className="w-3.5 h-3.5" />
          失物招领
        </div>
        <h3 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-wide drop-shadow-lg">
          {foundItems[currentIndex].title}
        </h3>
        <div className="flex items-center gap-2 text-cyan-400 font-medium mb-3">
          <MapPin className="w-4 h-4" />
          <span>{foundItems[currentIndex].location}</span>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed max-w-md">
          {foundItems[currentIndex].desc}
        </p>
      </motion.div>

      {/* Touch Controls */}
      <div className="absolute inset-y-0 left-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => handleSwipe(-1)}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 active:scale-90 transition-transform"
        >
          <ChevronLeft size={24} />
        </button>
      </div>
      <div className="absolute inset-y-0 right-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => handleSwipe(1)}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 active:scale-90 transition-transform"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Indicators */}
      <div className="absolute top-6 right-6 flex gap-2">
        {foundItems.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-6 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'w-1.5 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const ScrollingLostItems = () => {
  return (
    <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
      <style>{`
        @keyframes scroll-y {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-scroll-y {
          animation: scroll-y 25s linear infinite;
        }
        .animate-scroll-y:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      {/* Gradient masks for smooth fade at top and bottom */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent z-10 pointer-events-none" />
      
      <div className="animate-scroll-y flex flex-col gap-4 pt-4">
        {[...lostItems, ...lostItems].map((item, idx) => (
          <div key={`${item.id}-${idx}`} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-5 transition-colors group cursor-pointer">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold shadow-lg`}>
                  {item.avatar}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{item.user}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {item.time}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs rounded-full font-bold">
                急寻
              </span>
            </div>
            
            <div className="ml-12">
              <h4 className="text-lg font-bold text-white mb-1 group-hover:text-rose-400 transition-colors">{item.item}</h4>
              <div className="flex items-center gap-2 text-rose-400/80 text-xs font-medium mb-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>{item.location}</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Component ---
export default function LostFound() {
  return (
    <PageContainer>
      {/* Changed h-[calc...] to min-h-[calc...] to allow expansion on smaller screens */}
      <div className="bg-slate-950 rounded-[2rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)] relative min-h-[calc(100vh-8rem)] flex flex-col">
        
        {/* Ambient Background */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <Marquee />

        <div className="flex-1 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          
          {/* Left Column: Lost Items List (Scrolling) */}
          <div className="flex flex-col h-[500px] lg:h-[650px]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Search className="text-rose-400 w-5 h-5" />
                寻物启事
              </h2>
              <button className="px-4 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-xs font-bold transition-colors">
                发布寻物
              </button>
            </div>
            <ScrollingLostItems />
          </div>

          {/* Right Column: Found Items Carousel */}
          <div className="flex flex-col h-[500px] lg:h-[650px]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="text-cyan-400 w-5 h-5" />
                失物招领
              </h2>
              <button className="px-4 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full text-xs font-bold transition-colors">
                发布招领
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <FoundCarousel />
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
