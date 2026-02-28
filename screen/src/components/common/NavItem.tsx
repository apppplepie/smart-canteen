import React from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  isSidebar?: boolean;
  key?: React.Key;
}

export function NavItem({ to, icon: Icon, label, isSidebar = false }: NavItemProps) {
  const baseClasses = "flex items-center transition-colors duration-200 rounded-[10px]";
  
  if (isSidebar) {
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `${baseClasses} px-4 py-3 mb-2 ${
            isActive
              ? 'bg-[#1565d8]/10 text-[#1565d8] font-medium'
              : 'text-slate-600 hover:bg-slate-100'
          }`
        }
      >
        <Icon className="w-5 h-5 mr-3" />
        <span>{label}</span>
      </NavLink>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${baseClasses} px-4 py-2 mx-1 ${
          isActive
            ? 'text-[#1565d8] font-medium bg-[#1565d8]/5'
            : 'text-slate-600 hover:text-[#1565d8] hover:bg-slate-50'
        }`
      }
    >
      <span>{label}</span>
    </NavLink>
  );
}
