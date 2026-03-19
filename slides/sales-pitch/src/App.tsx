import { useState, useEffect } from 'react';
import { SlideNav, Minimap } from '@shared/components';
import { slides } from './slides/index';

export default function App() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const SlideComponent = slides[current];
  return (
    <div className="slide-viewport">
      <div className="slide-stage">
        <div className="slide-frame">
          <SlideComponent />
        </div>
      </div>
      {/* SlideNav and Minimap hidden for sales pitch */}
    </div>
  );
}
