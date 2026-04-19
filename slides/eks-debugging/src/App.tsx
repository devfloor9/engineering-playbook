import { useState, useEffect } from 'react';
import { SlideNav } from './components/SlideNav';
import { Minimap } from './components/Minimap';
import { slides } from './slides';

export default function App() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrent(prev => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrent(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Home') {
        setCurrent(0);
      } else if (e.key === 'End') {
        setCurrent(slides.length - 1);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 50) {
        if (e.deltaY > 0) {
          setCurrent(prev => Math.min(prev + 1, slides.length - 1));
        } else {
          setCurrent(prev => Math.max(prev - 1, 0));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const SlideComponent = slides[current];

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <SlideComponent />
      <SlideNav current={current} total={slides.length} onNavigate={setCurrent} />
      <Minimap current={current} total={slides.length} onSelect={setCurrent} sessionBreak={32} />
    </div>
  );
}
