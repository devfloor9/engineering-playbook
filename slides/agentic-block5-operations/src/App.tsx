import { useState, useEffect } from 'react';
import * as Slides from './slides';

const slideComponents = [
  Slides.Slide01,
  Slides.Slide02,
  Slides.Slide03,
  Slides.Slide04,
  Slides.Slide05,
  Slides.Slide06,
  Slides.Slide07,
  Slides.Slide08,
  Slides.Slide09,
  Slides.Slide10,
  Slides.Slide11,
  Slides.Slide12,
  Slides.Slide13,
  Slides.Slide14,
  Slides.Slide15,
  Slides.Slide16,
];

function App() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setCurrentSlide((prev) => Math.min(prev + 1, slideComponents.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Home') {
        setCurrentSlide(0);
      } else if (e.key === 'End') {
        setCurrentSlide(slideComponents.length - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const CurrentSlideComponent = slideComponents[currentSlide];

  return (
    <div className="relative w-screen h-screen bg-gray-900 text-white overflow-hidden">
      <CurrentSlideComponent />

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-gray-800/80 px-6 py-3 rounded-full backdrop-blur-sm">
        <button
          onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
          disabled={currentSlide === 0}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          ← Prev
        </button>
        <span className="text-gray-300 font-mono">
          {currentSlide + 1} / {slideComponents.length}
        </span>
        <button
          onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, slideComponents.length - 1))}
          disabled={currentSlide === slideComponents.length - 1}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          Next →
        </button>
      </div>

      <div className="absolute bottom-8 right-8 flex gap-2">
        {slideComponents.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentSlide
                ? 'bg-blue-500 w-8'
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      <div className="absolute top-8 right-8 text-xs text-gray-500">
        ← → Space | Home | End
      </div>
    </div>
  );
}

export default App;
