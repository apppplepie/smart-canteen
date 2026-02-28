import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  key?: React.Key;
}

export function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`bg-white rounded-[10px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6 ${className}`}>
      {title && <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>}
      {children}
    </div>
  );
}
