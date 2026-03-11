import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
  color?: string;
  className?: string;
}

const colorMap: Record<string, { border: string; text: string; bg: string }> = {
  blue: { border: 'border-blue-500/30', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  emerald: { border: 'border-emerald-500/30', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  amber: { border: 'border-amber-500/30', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  purple: { border: 'border-purple-500/30', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  rose: { border: 'border-rose-500/30', text: 'text-rose-400', bg: 'bg-rose-500/10' },
  cyan: { border: 'border-cyan-500/30', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  orange: { border: 'border-orange-500/30', text: 'text-orange-400', bg: 'bg-orange-500/10' },
  red: { border: 'border-red-500/30', text: 'text-red-400', bg: 'bg-red-500/10' },
  gray: { border: 'border-gray-600/50', text: 'text-gray-300', bg: 'bg-gray-800/50' },
};

export function Card({ title, children, icon, color = 'blue', className = '' }: CardProps) {
  const c = colorMap[color] || colorMap.blue;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-900 rounded-xl p-6 border ${c.border} ${className}`}
    >
      {title && (
        <div className="flex items-center gap-3 mb-3">
          {icon && <span className={c.text}>{icon}</span>}
          <h3 className={`text-lg font-bold ${c.text}`}>{title}</h3>
        </div>
      )}
      {!title && icon && <div className="mb-3"><span className={c.text}>{icon}</span></div>}
      <div className="text-gray-300 text-sm leading-relaxed">{children}</div>
    </motion.div>
  );
}
