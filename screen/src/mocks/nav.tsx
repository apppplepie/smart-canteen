import {
  LayoutDashboard,
  Store,
  BookOpen,
  ShieldCheck,
  Search,
  MessageSquare,
} from 'lucide-react';

export const navItems = [
  { path: '/', icon: LayoutDashboard, label: '平台首页' },
  { path: '/cafeteria', icon: Store, label: '食堂风采' },
  { path: '/menu', icon: BookOpen, label: '菜单查看' },
  { path: '/food-safety', icon: ShieldCheck, label: '食安公示' },
  { path: '/lost-found', icon: Search, label: '寻物平台' },
  { path: '/feedback', icon: MessageSquare, label: '留言建议' },
];
