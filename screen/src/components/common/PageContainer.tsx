import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
