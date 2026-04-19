interface BadgeProps {
  children: React.ReactNode;
  color?: 'blue' | 'rose' | 'amber' | 'emerald' | 'purple' | 'orange' | 'gray';
}

const styles: Record<string, string> = {
  blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  rose: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  orange: 'bg-[#ff9900]/20 text-[#ff9900] border-[#ff9900]/30',
  gray: 'bg-gray-700/50 text-gray-300 border-gray-600/30',
};

export function Badge({ children, color = 'blue' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${styles[color]}`}>
      {children}
    </span>
  );
}
