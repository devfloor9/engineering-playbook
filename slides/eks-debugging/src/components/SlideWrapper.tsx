import { motion } from 'framer-motion';

interface SlideWrapperProps {
  children: React.ReactNode;
  className?: string;
  accent?: 'blue' | 'rose' | 'amber' | 'emerald' | 'purple' | 'orange';
}

const accentLine: Record<string, string> = {
  blue: 'bg-blue-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  purple: 'bg-purple-500',
  orange: 'bg-[#ff9900]',
};

export function SlideWrapper({ children, className = '', accent = 'blue' }: SlideWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`min-h-screen bg-[#0a0a0f] text-white flex flex-col ${className}`}
    >
      <div className={`h-1 w-full ${accentLine[accent]}`} />
      <div className="flex-1 p-10 max-w-[1920px] mx-auto w-full">
        {children}
      </div>
    </motion.div>
  );
}
