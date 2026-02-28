import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { motion } from 'motion/react';
import { Search, Flame, Coffee, Pizza, Utensils, Fish, Star, MapPin, Store, Sparkles } from 'lucide-react';
import { DishCardModal, Dish } from '../components/menu/DishCardModal';

const categories = [
  { id: 'all', name: '全部菜品', icon: Utensils },
  { id: 'signature', name: '招牌推荐', icon: Star },
  { id: 'rice', name: '盖浇饭', icon: Pizza },
  { id: 'noodles', name: '面食专区', icon: Utensils },
  { id: 'bbq', name: '烧烤炸串', icon: Flame },
  { id: 'drinks', name: '甜品饮料', icon: Coffee },
  { id: 'light', name: '轻食沙拉', icon: Fish },
];

const mockDishes: Dish[] = [
  { id: 1, name: '秘制红烧肉套餐', merchant: '湘菜馆', window: '一食堂 12号窗', price: 18, rating: 4.8, tags: ['招牌', '微辣'], image: 'https://picsum.photos/seed/dish1/600/800', desc: '精选五花肉，肥而不腻，入口即化。搭配时令蔬菜和例汤。', calories: 850, sales: 1205 },
  { id: 2, name: '招牌牛肉面', merchant: '西北面馆', window: '二食堂 05号窗', price: 15, rating: 4.6, tags: ['面食', '鲜香'], image: 'https://picsum.photos/seed/dish2/600/500', desc: '手工拉面，劲道爽滑，大块牛肉慢炖入味，汤头浓郁。', calories: 620, sales: 890 },
  { id: 3, name: '减脂鸡胸肉沙拉', merchant: '绿野轻食', window: '一食堂 03号窗', price: 22, rating: 4.9, tags: ['低卡', '健康'], image: 'https://picsum.photos/seed/dish3/600/700', desc: '低温慢煮鸡胸肉，搭配新鲜生菜、圣女果、玉米粒，低脂油醋汁。', calories: 320, sales: 450 },
  { id: 4, name: '金汤酸菜鱼', merchant: '川味人家', window: '三食堂 08号窗', price: 25, rating: 4.7, tags: ['麻辣', '下饭'], image: 'https://picsum.photos/seed/dish4/600/600', desc: '选用新鲜黑鱼，老坛酸菜熬制金汤，酸辣开胃。', calories: 780, sales: 670 },
  { id: 5, name: '脆皮炸鸡腿', merchant: '快乐炸鸡', window: '二食堂 15号窗', price: 12, rating: 4.5, tags: ['小吃', '香脆'], image: 'https://picsum.photos/seed/dish5/600/900', desc: '外酥里嫩，汁水丰富，现点现炸。', calories: 550, sales: 2100 },
  { id: 6, name: '抹茶星冰乐', merchant: '水吧', window: '一食堂 01号窗', price: 16, rating: 4.8, tags: ['饮品', '冰爽'], image: 'https://picsum.photos/seed/dish6/600/600', desc: '精选宇治抹茶，搭配顺滑奶油，夏日解暑必备。', calories: 380, sales: 560 },
  { id: 7, name: '铁板鱿鱼炒饭', merchant: '铁板烧', window: '三食堂 11号窗', price: 19, rating: 4.6, tags: ['铁板', '鲜香'], image: 'https://picsum.photos/seed/dish7/600/750', desc: '新鲜鱿鱼搭配秘制酱料，铁板爆炒，香气四溢。', calories: 720, sales: 880 },
  { id: 8, name: '番茄牛腩汤', merchant: '家常菜', window: '二食堂 09号窗', price: 20, rating: 4.9, tags: ['养生', '酸甜'], image: 'https://picsum.photos/seed/dish8/600/550', desc: '新鲜番茄与精选牛腩慢火炖煮，汤汁浓郁，营养丰富。', calories: 450, sales: 920 },
];

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [colCount, setColCount] = useState(4);
  const [pausedCol, setPausedCol] = useState<number | null>(null);

  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth >= 1280) setColCount(4);
      else if (window.innerWidth >= 1024) setColCount(3);
      else if (window.innerWidth >= 640) setColCount(2);
      else setColCount(1);
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  return (
    <PageContainer>
      <style>{`
        @keyframes scroll-y {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-scroll-y {
          animation: scroll-y linear infinite;
        }
      `}</style>
      <div className="bg-slate-950 rounded-[2rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)] relative h-[calc(100vh-8rem)] flex flex-col p-4 md:p-6">
        
        {/* Ambient Background */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-6 h-full relative z-10">
          
          {/* Sidebar Categories */}
          <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-4 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
              <div className="relative mb-4">
                <input 
                  type="text" 
                  placeholder="搜索菜品、商家..." 
                  className="w-full bg-black/20 border border-white/10 text-slate-200 text-sm rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-slate-500"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              </div>
              <div className="space-y-2">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-medium ${
                        isActive 
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                          : 'text-slate-400 hover:bg-white/5 hover:text-cyan-400'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'} />
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Promo Card */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-6 text-white shadow-[0_0_30px_rgba(124,58,237,0.3)] relative overflow-hidden hidden md:block border border-white/10">
              <div className="absolute -right-4 -top-4 opacity-20">
                <Sparkles size={100} />
              </div>
              <div className="relative z-10">
                <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-xs font-bold mb-3 inline-block">
                  今日特惠
                </span>
                <h3 className="text-xl font-black mb-1 tracking-wide">全场满减</h3>
                <p className="text-sm text-white/80 mb-4 font-medium">满 30 减 5，满 50 减 10</p>
                <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white rounded-xl text-sm font-bold shadow-sm transition-colors">
                  立即领券
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - Pseudo Masonry Grid */}
          <div className="flex-1 overflow-hidden relative">
            {/* Gradient masks for smooth fade */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-slate-950 to-transparent z-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-950 to-transparent z-20 pointer-events-none" />
            
            <div className="flex gap-6 h-full w-full px-2">
              {Array.from({ length: colCount }).map((_, colIndex) => {
                const colItems = mockDishes.filter((_, idx) => idx % colCount === colIndex);
                // Duplicate 4 times to ensure enough height for seamless scrolling
                const displayItems = [...colItems, ...colItems, ...colItems, ...colItems];
                const duration = 30 + (colIndex % 2) * 15; // e.g., 30s, 45s alternating

                return (
                  <div key={colIndex} className="flex-1 h-full overflow-hidden relative group">
                    <div 
                      className="flex flex-col gap-6 animate-scroll-y"
                      style={{ 
                        animationDuration: `${duration}s`,
                        animationPlayState: pausedCol === colIndex ? 'paused' : 'running'
                      }}
                    >
                      {displayItems.map((dish, idx) => (
                        <motion.div
                          key={`${dish.id}-${idx}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (idx % mockDishes.length) * 0.05 }}
                          onClick={() => {
                            setSelectedDish(dish);
                            setPausedCol(colIndex);
                          }}
                          className="bg-white/5 backdrop-blur-md rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-white/10 cursor-pointer hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(6,182,212,0.15)] hover:border-cyan-500/30 transition-all duration-300"
                        >
                          <div className="relative">
                            <img src={dish.image} alt={dish.name} className="w-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute top-3 right-3 flex flex-col gap-2">
                              {dish.tags.map(tag => (
                                <span key={tag} className="px-2.5 py-1 bg-black/60 backdrop-blur-md border border-white/10 text-cyan-300 text-xs font-bold rounded-lg shadow-sm">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 to-transparent">
                              <h3 className="text-lg font-bold text-white mb-1 tracking-wide">{dish.name}</h3>
                              <div className="flex items-center gap-2 text-slate-300 text-xs font-medium">
                                <Store size={12} className="text-cyan-400" />
                                <span>{dish.merchant}</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-baseline gap-0.5 text-cyan-400">
                                <span className="text-sm font-bold">¥</span>
                                <span className="text-xl font-black drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">{dish.price}</span>
                              </div>
                              <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                                <Star size={14} className="fill-amber-400" />
                                {dish.rating}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-400 bg-black/20 border border-white/5 p-2.5 rounded-xl">
                              <div className="flex items-center gap-1.5">
                                <MapPin size={14} className="text-purple-400" />
                                <span className="font-medium">{dish.window}</span>
                              </div>
                              <span>月售 {dish.sales}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Modal */}
      <DishCardModal 
        dish={selectedDish} 
        isOpen={!!selectedDish} 
        onClose={() => {
          setSelectedDish(null);
          setPausedCol(null);
        }} 
      />
    </PageContainer>
  );
}
