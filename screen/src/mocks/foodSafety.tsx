import React from 'react';
import { ShieldCheck, Activity, Droplets, Fish, Wheat, Coffee, Info, type LucideIcon } from 'lucide-react';

/** 过敏原名称 -> 展示用 icon 与 color，API 返回的 tag 名用此映射 */
export const ALLERGEN_TAG_STYLE: Record<string, { icon: LucideIcon; color: string }> = {
  麸质: { icon: Wheat, color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  海鲜: { icon: Fish, color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  坚果: { icon: Info, color: 'text-orange-400 bg-orange-500/20 border-orange-500/30' },
  乳制品: { icon: Coffee, color: 'text-rose-400 bg-rose-500/20 border-rose-500/30' },
  大豆: { icon: Info, color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  鸡蛋: { icon: Info, color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' },
};

export function generateTempData() {
  const data = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0') + ':00';
    const temp = 4 + Math.random() * 3 + (i === 12 ? 3 : 0);
    const ppm = 160 + Math.random() * 30 - (i === 14 ? 40 : 0);
    data.push({ time: hour, temp: Number(temp.toFixed(1)), ppm: Number(ppm.toFixed(0)) });
  }
  return data;
}

const tempData = generateTempData();
export { tempData };

export const foodSafetyReports = [
  { id: 1, type: '农药残留检测', result: 'PASS', agency: '市食品安全检测中心', time: '今日 08:30', icon: <Activity className="w-6 h-6 text-emerald-400" /> },
  { id: 2, type: '重金属含量检测', result: 'PASS', agency: '第三方权威机构', time: '今日 09:15', icon: <ShieldCheck className="w-6 h-6 text-blue-400" /> },
  { id: 3, type: '表面细菌培养', result: 'PASS', agency: '校内自检实验室', time: '今日 10:00', icon: <Droplets className="w-6 h-6 text-cyan-400" /> },
];

export const foodSafetySamples = [
  { id: 'S-20260226-01', meal: '早餐', time: '07:30', loc: 'A区冷藏柜', status: '冷藏中 (48h)', operator: '张师傅' },
  { id: 'S-20260226-02', meal: '午餐', time: '11:30', loc: 'B区冷藏柜', status: '冷藏中 (48h)', operator: '李阿姨' },
  { id: 'S-20260226-03', meal: '晚餐', time: '17:30', loc: 'A区冷藏柜', status: '待入库', operator: '王师傅' },
  { id: 'S-20260224-01', meal: '前日早餐', time: '07:30', loc: 'C区冷藏柜', status: '已销毁', operator: '赵主管' },
];

const defaultTagStyle = { icon: Info, color: 'text-slate-400 bg-slate-500/20 border-slate-500/30' };

export const foodSafetyAllergens = [
  { window: '一食堂 1号窗 (面食)', tags: [{ name: '麸质', icon: Wheat, color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' }] },
  { window: '一食堂 3号窗 (轻食)', tags: [{ name: '海鲜', icon: Fish, color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' }, { name: '坚果', icon: Info, color: 'text-orange-400 bg-orange-500/20 border-orange-500/30' }] },
  { window: '二食堂 5号窗 (甜品)', tags: [{ name: '乳制品', icon: Coffee, color: 'text-rose-400 bg-rose-500/20 border-rose-500/30' }] },
];

/** 把接口返回的按窗口过敏原转成展示结构（tag 名 -> icon/color 用 ALLERGEN_TAG_STYLE） */
export function allergenDisclosuresToDisplay(
  list: Array<{ window: string; tags: string[] }>
): Array<{ window: string; tags: Array<{ name: string; icon: LucideIcon; color: string }> }> {
  return list.map((item) => ({
    window: item.window,
    tags: (item.tags || []).map((name) => {
      const style = ALLERGEN_TAG_STYLE[name] ?? defaultTagStyle;
      return { name, icon: style.icon, color: style.color };
    }),
  }));
}
