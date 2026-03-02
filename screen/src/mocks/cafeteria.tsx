import { Coffee, Sun, Moon, Utensils } from 'lucide-react';

export const cafeteriaBentoItems = [
  {
    title: "VIP 包间",
    desc: "私密静谧，商务洽谈首选",
    images: [
      "https://picsum.photos/seed/vip1/800/600",
      "https://picsum.photos/seed/vip2/800/600",
      "https://picsum.photos/seed/vip3/800/600"
    ],
    colSpan: "md:col-span-2",
    rowSpan: "md:row-span-2"
  },
  {
    title: "休闲水吧",
    desc: "鲜榨果汁与手冲咖啡",
    images: [
      "https://picsum.photos/seed/bar1/400/400",
      "https://picsum.photos/seed/bar2/400/400"
    ],
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-1"
  },
  {
    title: "户外露台",
    desc: "阳光与微风的完美结合",
    images: [
      "https://picsum.photos/seed/out1/400/400",
      "https://picsum.photos/seed/out2/400/400"
    ],
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-1"
  },
];

export const cafeteriaMeals = [
  { name: '晨光早餐', time: '06:30 - 09:00', icon: Coffee, color: 'from-amber-500 to-orange-600' },
  { name: '能量午餐', time: '11:00 - 13:30', icon: Sun, color: 'from-cyan-500 to-blue-600' },
  { name: '温馨晚餐', time: '17:00 - 19:30', icon: Moon, color: 'from-indigo-500 to-purple-600' },
  { name: '深夜食堂', time: '21:00 - 23:00', icon: Utensils, color: 'from-rose-500 to-pink-600' }
];
