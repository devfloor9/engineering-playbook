interface MinimapProps {
  current: number;
  total: number;
  onSelect: (index: number) => void;
  sessionBreak?: number; // slide index where session 2 starts
}

export function Minimap({ current, total, onSelect, sessionBreak = 32 }: MinimapProps) {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-[3px]">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`w-2 transition-all duration-200 rounded-full ${
            i === current
              ? 'h-4 bg-[#ff9900]'
              : i === sessionBreak
              ? 'h-2 bg-amber-600/60'
              : 'h-2 bg-gray-700 hover:bg-gray-500'
          }`}
          title={`Slide ${i + 1}`}
        />
      ))}
    </div>
  );
}
