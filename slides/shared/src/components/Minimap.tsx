interface MinimapProps {
  current: number;
  total: number;
  onSelect: (index: number) => void;
}

export function Minimap({ current, total, onSelect }: MinimapProps) {
  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-50">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
            i === current
              ? 'bg-blue-400 scale-125'
              : 'bg-gray-600 hover:bg-gray-400'
          }`}
          title={`Slide ${i + 1}`}
        />
      ))}
    </div>
  );
}
