import { Flame, Coffee, Pizza, Utensils, Fish, Star } from 'lucide-react';
import type { Dish } from '../components/menu/DishCardModal';

export const menuCategories = [
  { id: 'all', name: '全部菜品', icon: Utensils },
  { id: 'signature', name: '招牌推荐', icon: Star },
  { id: 'rice', name: '盖浇饭', icon: Pizza },
  { id: 'noodles', name: '面食专区', icon: Utensils },
  { id: 'bbq', name: '烧烤炸串', icon: Flame },
  { id: 'drinks', name: '甜品饮料', icon: Coffee },
  { id: 'light', name: '轻食沙拉', icon: Fish },
];

export const mockDishes: Dish[] = [
  { id: 1, name: '秘制红烧肉套餐', merchant: '湘菜馆', window: '一食堂 12号窗', price: 18, rating: 4.8, tags: ['招牌', '微辣'], image: 'https://picsum.photos/seed/dish1/600/800', desc: '精选五花肉，肥而不腻，入口即化。搭配时令蔬菜和例汤。', calories: 850, sales: 1205 },
  { id: 2, name: '招牌牛肉面', merchant: '西北面馆', window: '二食堂 05号窗', price: 15, rating: 4.6, tags: ['面食', '鲜香'], image: 'https://picsum.photos/seed/dish2/600/500', desc: '手工拉面，劲道爽滑，大块牛肉慢炖入味，汤头浓郁。', calories: 620, sales: 890 },
  { id: 3, name: '减脂鸡胸肉沙拉', merchant: '绿野轻食', window: '一食堂 03号窗', price: 22, rating: 4.9, tags: ['低卡', '健康'], image: 'https://picsum.photos/seed/dish3/600/700', desc: '低温慢煮鸡胸肉，搭配新鲜生菜、圣女果、玉米粒，低脂油醋汁。', calories: 320, sales: 450 },
  { id: 4, name: '金汤酸菜鱼', merchant: '川味人家', window: '三食堂 08号窗', price: 25, rating: 4.7, tags: ['麻辣', '下饭'], image: 'https://picsum.photos/seed/dish4/600/600', desc: '选用新鲜黑鱼，老坛酸菜熬制金汤，酸辣开胃。', calories: 780, sales: 670 },
  { id: 5, name: '脆皮炸鸡腿', merchant: '快乐炸鸡', window: '二食堂 15号窗', price: 12, rating: 4.5, tags: ['小吃', '香脆'], image: 'https://picsum.photos/seed/dish5/600/900', desc: '外酥里嫩，汁水丰富，现点现炸。', calories: 550, sales: 2100 },
  { id: 6, name: '抹茶星冰乐', merchant: '水吧', window: '一食堂 01号窗', price: 16, rating: 4.8, tags: ['饮品', '冰爽'], image: 'https://picsum.photos/seed/dish6/600/600', desc: '精选宇治抹茶，搭配顺滑奶油，夏日解暑必备。', calories: 380, sales: 560 },
  { id: 7, name: '铁板鱿鱼炒饭', merchant: '铁板烧', window: '三食堂 11号窗', price: 19, rating: 4.6, tags: ['铁板', '鲜香'], image: 'https://picsum.photos/seed/dish7/600/750', desc: '新鲜鱿鱼搭配秘制酱料，铁板爆炒，香气四溢。', calories: 720, sales: 880 },
  { id: 8, name: '番茄牛腩汤', merchant: '家常菜', window: '二食堂 09号窗', price: 20, rating: 4.9, tags: ['养生', '酸甜'], image: 'https://picsum.photos/seed/dish8/600/550', desc: '新鲜番茄与精选牛腩慢火炖煮，汤汁浓郁，营养丰富。', calories: 450, sales: 920 },
];
