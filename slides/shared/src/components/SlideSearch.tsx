import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SlideSearchProps {
  slideTexts: string[];
  current: number;
  onNavigate: (index: number) => void;
}

export function SlideSearch({ slideTexts, current, onNavigate }: SlideSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const lower = query.toLowerCase();
    setResults(
      slideTexts
        .map((text, i) => (text.toLowerCase().includes(lower) ? i : -1))
        .filter((i) => i >= 0)
    );
  }, [query, slideTexts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="text-gray-400 hover:text-white transition-colors"
        title="Search (Ctrl+F)"
      >
        <Search size={18} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-1 max-w-md">
      <Search size={16} className="text-gray-500 flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="슬라이드 검색..."
        className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-700 focus:border-blue-500 focus:outline-none"
      />
      {query && (
        <span className="text-gray-500 text-xs whitespace-nowrap">
          {results.length}건
        </span>
      )}
      <button
        onClick={() => { setIsOpen(false); setQuery(''); }}
        className="text-gray-400 hover:text-white"
      >
        <X size={16} />
      </button>

      {query && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-gray-900 border-b border-gray-700 max-h-60 overflow-y-auto z-50">
          {results.map((idx) => (
            <button
              key={idx}
              onClick={() => {
                onNavigate(idx);
                setIsOpen(false);
                setQuery('');
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors border-b border-gray-800 ${
                idx === current
                  ? 'bg-blue-900/50 text-blue-300'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span className="text-gray-500 font-mono mr-2">#{idx + 1}</span>
              <span className="text-gray-400">
                {highlightMatch(slideTexts[idx]?.substring(0, 120) || '', query)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  const start = Math.max(0, idx - 20);
  const snippet = (start > 0 ? '...' : '') + text.substring(start, start + 80);
  return snippet;
}
