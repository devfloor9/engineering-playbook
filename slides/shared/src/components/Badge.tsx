import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  rose: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const sizeMap: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function Badge({ children, color = 'blue', size = 'md' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${colorMap[color] || colorMap.blue} ${sizeMap[size]}`}>
      {children}
    </span>
  );
}
