import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideNavProps {
  current: number;
  total: number;
  onNavigate: (index: number) => void;
}

export function SlideNav({ current, total, onNavigate }: SlideNavProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/80 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-700/50">
      <button
        onClick={() => onNavigate(Math.max(0, current - 1))}
        disabled={current === 0}
        className="p-1 text-gray-400 hover:text-white disabled:opacity-30 transition"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="text-sm text-gray-300 font-mono min-w-[60px] text-center">
        {current + 1} / {total}
      </span>
      <button
        onClick={() => onNavigate(Math.min(total - 1, current + 1))}
        disabled={current === total - 1}
        className="p-1 text-gray-400 hover:text-white disabled:opacity-30 transition"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
