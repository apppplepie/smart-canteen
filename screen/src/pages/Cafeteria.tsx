import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, MapPin } from 'lucide-react';
import { cafeteriaBentoItems, cafeteriaMeals } from '../mocks/cafeteria';

// --- Subcomponents ---

const MiniCarousel = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Stagger the intervals slightly so they don't all change at the exact same millisecond
    const intervalTime = 3000 + Math.random() * 1500;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <AnimatePresence mode="wait">
      <motion.img
        key={currentIndex}
        src={images[currentIndex]}
        alt="Space view"
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        referrerPolicy="no-referrer"
      />
    </AnimatePresence>
  );
};

const BentoGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full min-h-[500px]">
      {cafeteriaBentoItems.map((item, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.1 }}
          whileTap={{ scale: 0.98 }}
          className={`relative rounded-3xl overflow-hidden group cursor-pointer ${item.colSpan} ${item.rowSpan} min-h-[250px] md:min-h-0 shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-white/10`}
        >
          <MiniCarousel images={item.images} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 p-5 md:p-6 pointer-events-none">
            <div className="flex items-center gap-2 mb-1 md:mb-2">
              <MapPin className="text-cyan-400 w-4 h-4 md:w-5 md:h-5" />
              <h4 className="text-lg md:text-xl font-bold text-white tracking-wide">{item.title}</h4>
            </div>
            <p className="text-slate-300 text-xs md:text-sm font-medium">{item.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const MealTimeCard = ({ meal, index }: { meal: any, index: number, key?: React.Key }) => {
  const Icon = meal.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, type: "spring" }}
      whileTap={{ scale: 0.95 }}
      className={`relative overflow-hidden rounded-2xl p-4 md:p-5 bg-gradient-to-br ${meal.color} shadow-lg text-white cursor-pointer group h-full flex flex-col justify-between keep-colors`}
    >
      <div className="absolute -right-4 -top-4 opacity-20 group-active:scale-110 transition-transform duration-500 pointer-events-none">
        <Icon size={100} />
      </div>
      <div className="relative z-10 flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)] shrink-0">
          <Icon size={20} className="text-white" />
        </div>
        <h3 className="text-lg md:text-xl font-black tracking-wider drop-shadow-md">{meal.name}</h3>
      </div>
      <div className="relative z-10 flex items-center gap-2 text-white/90 font-mono bg-black/20 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm text-xs md:text-sm">
        <Clock size={14} />
        <span>{meal.time}</span>
      </div>
    </motion.div>
  );
};

// --- Main Page Component ---

export default function Cafeteria() {
  return (
    <PageContainer>
      {/* Dark Tech Theme Wrapper - Fit to screen height */}
      <div className="bg-slate-950 rounded-[2rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)] relative min-h-[calc(100vh-8rem)] flex flex-col p-4 md:p-6 gap-4 md:gap-6">
        
        {/* Background Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Section: Bento Grid (Takes up remaining space) */}
        <div className="flex-1 min-h-0 relative z-10">
          <BentoGrid />
        </div>

        {/* Bottom Section: Meal Times (Fixed height based on content) */}
        <div className="shrink-0 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 h-[120px] md:h-[140px]">
            {cafeteriaMeals.map((meal, idx) => (
              <MealTimeCard key={idx} meal={meal} index={idx} />
            ))}
          </div>
        </div>

      </div>
    </PageContainer>
  );
}
