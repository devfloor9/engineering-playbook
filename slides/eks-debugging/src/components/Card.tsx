import { motion } from 'framer-motion';

interface CardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  accent?: 'blue' | 'rose' | 'amber' | 'emerald' | 'purple' | 'orange';
  delay?: number;
}

const borderColor: Record<string, string> = {
  blue: 'border-blue-500/30',
  rose: 'border-rose-500/30',
  amber: 'border-amber-500/30',
  emerald: 'border-emerald-500/30',
  purple: 'border-purple-500/30',
  orange: 'border-[#ff9900]/30',
};
const titleColor: Record<string, string> = {
  blue: 'text-blue-400',
  rose: 'text-rose-400',
  amber: 'text-amber-400',
  emerald: 'text-emerald-400',
  purple: 'text-purple-400',
  orange: 'text-[#ff9900]',
};
const iconColor: Record<string, string> = {
  blue: 'text-blue-400',
  rose: 'text-rose-400',
  amber: 'text-amber-400',
  emerald: 'text-emerald-400',
  purple: 'text-purple-400',
  orange: 'text-[#ff9900]',
};

export function Card({ title, children, icon, accent = 'blue', delay = 0 }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`bg-gray-900 rounded-xl p-6 border ${borderColor[accent]}`}
    >
      <div className="flex items-center gap-3 mb-3">
        {icon && <span className={iconColor[accent]}>{icon}</span>}
        <h3 className={`text-xl font-bold ${titleColor[accent]}`}>{title}</h3>
      </div>
      <div className="text-gray-300 text-lg leading-relaxed">{children}</div>
    </motion.div>
  );
}
