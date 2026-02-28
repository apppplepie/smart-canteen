import React from 'react';
import { 
  LayoutDashboard, 
  Store, 
  BookOpen, 
  ShieldCheck, 
  Search, 
  MessageSquare 
} from 'lucide-react';
import { NavItem } from '../common/NavItem';

const sidebarItems = [
  { path: '/', icon: LayoutDashboard, label: '平台首页' },
  { path: '/cafeteria', icon: Store, label: '食堂风采' },
  { path: '/menu', icon: BookOpen, label: '菜单查看' },
  { path: '/food-safety', icon: ShieldCheck, label: '食安公示' },
  { path: '/lost-found', icon: Search, label: '寻物平台' },
  { path: '/feedback', icon: MessageSquare, label: '留言建议' },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-4">
          业务模块
        </div>
        <nav>
          {sidebarItems.map((item) => (
            <NavItem
              key={item.path}
              to={item.path}
              icon={item.icon}
              label={item.label}
              isSidebar={true}
            />
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-[10px] p-4 text-center">
          <p className="text-xs text-slate-500 mb-2">系统版本 v1.0.0</p>
          <p className="text-xs text-slate-400">© 2026 智慧食堂</p>
        </div>
      </div>
    </aside>
  );
}
