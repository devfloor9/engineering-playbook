import { useState, useEffect, useRef } from 'react';
import { SlideNav, Minimap, SlideSearch } from '@shared/components';
import { slides } from './slides/index';

export default function App() {
  const [current, setCurrent] = useState(0);
  const [slideTexts, setSlideTexts] = useState<string[]>([]);
  const hiddenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrent((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrent((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Home') {
        setCurrent(0);
      } else if (e.key === 'End') {
        setCurrent(slides.length - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Extract text from hidden rendered slides
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = hiddenRef.current;
      if (!container) return;
      const texts: string[] = [];
      const children = container.querySelectorAll('[data-slide]');
      children.forEach((el, i) => {
        texts[i] = el.textContent || '';
      });
      if (texts.length > 0) setSlideTexts(texts);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const SlideComponent = slides[current];
  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Top bar: search */}
      <div className="relative flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-800">
        <SlideSearch slideTexts={slideTexts} current={current} onNavigate={setCurrent} />
        <span className="text-gray-600 text-xs ml-auto">Ctrl+F to search</span>
      </div>

      {/* Slide area */}
      <div className="flex-1 relative overflow-hidden">
        <SlideComponent />
        <Minimap current={current} total={slides.length} onSelect={setCurrent} />
      </div>

      {/* Bottom nav - outside slide */}
      <SlideNav current={current} total={slides.length} onNavigate={setCurrent} />

      {/* Hidden: render all slides for text extraction */}
      <div ref={hiddenRef} className="sr-only" aria-hidden="true">
        {slides.map((Slide, i) => (
          <div key={i} data-slide>
            <Slide />
          </div>
        ))}
      </div>
    </div>
  );
}
