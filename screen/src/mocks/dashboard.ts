const dishes = ['水煮肉片', '深井烧鹅', '红烧牛肉面', '牛油果沙拉', '豚骨拉面', '石锅拌饭', '铁板鱿鱼', '芒果班戟', '黄焖鸡米饭', '麻辣香锅', '烤冷面', '脆皮炸鸡', '酸菜鱼', '烤肉饭', '扬州炒饭', '小笼包', '油泼面', '麻辣烫', '过桥米线', '炸酱面'];

export function generateInitialWindows() {
  return Array.from({ length: 20 }, (_, i) => {
    const id = `W${String(i + 1).padStart(2, '0')}`;
    const queue = Math.floor(Math.random() * 25);
    let status: 'idle' | 'busy' | 'congested' = 'idle';
    if (queue > 15) status = 'congested';
    else if (queue > 5) status = 'busy';

    return {
      id,
      name: `${i + 1}号特色窗`,
      status,
      queue,
      wait: `${Math.max(1, queue * 1.5).toFixed(0)}min`,
      dish: dishes[i],
      image: `https://picsum.photos/seed/win${i + 1}/400/300`
    };
  });
}

export const statusConfig = {
  idle: { text: '空闲', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]' },
  busy: { text: '繁忙', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]' },
  congested: { text: '拥堵', color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30', shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.2)]' },
};

export const initialJustServed = [
  { id: 'A042', win: 'W02' },
  { id: 'B105', win: 'W05' }
];

export const initialWaiting = ['A038', 'A039', 'B101', 'C022', 'A040', 'B102', 'C023'];
