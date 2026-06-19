import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Logo({ className, size = 'md' }: LogoProps) {
  const sizeMap = {
    sm: 'w-6 h-6 text-[12px]',
    md: 'w-8 h-8 text-[16px]',
    lg: 'w-10 h-10 text-[20px]',
    xl: 'w-12 h-12 text-[24px]',
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-center rounded-xl bg-foreground text-background font-bold select-none",
        sizeMap[size],
        className
      )}
    >
      <span className="leading-none flex items-center justify-center h-full pt-[2px]">A</span>
    </div>
  );
}
