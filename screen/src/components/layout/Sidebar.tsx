import React from 'react';
import { NavItem } from '../common/NavItem';
import { navItems } from '../../mocks/nav';

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-4">
          业务模块
        </div>
        <nav>
          {navItems.map((item) => (
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
