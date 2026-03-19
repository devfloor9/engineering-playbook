import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideNavProps {
  current: number;
  total: number;
  onNavigate: (index: number) => void;
}

export function SlideNav({ current, total, onNavigate }: SlideNavProps) {
  return (
    <div className="flex items-center justify-center gap-4 bg-gray-900 px-6 py-3 border-t border-gray-800">
      <button
        onClick={() => onNavigate(Math.max(0, current - 1))}
        disabled={current === 0}
        className="text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="text-gray-400 text-sm font-mono min-w-[60px] text-center">
        {current + 1} / {total}
      </span>
      <button
        onClick={() => onNavigate(Math.min(total - 1, current + 1))}
        disabled={current === total - 1}
        className="text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
