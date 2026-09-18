import { useState, useEffect, useRef } from 'react';
import { MotionConfig } from 'framer-motion';
import { slides } from './slides/index';
import { slideDetails } from './slideDetails';

function slideFromHash() {
  const value = /^#(\d+)$/.exec(window.location.hash);
  return value ? Math.max(0, Math.min(slides.length - 1, Number(value[1]) - 1)) : 0;
}

export default function App() {
  const [current, setCurrent] = useState(slideFromHash);
  const stage = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.target instanceof Element &&
        e.target.closest('input, textarea, select, button, a, [data-slide-scroll], [contenteditable]:not([contenteditable="false"])')) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrent((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrent((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrent(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrent(slides.length - 1);
      }
    };
    const handleHashChange = () => {
      if (/^#\d+$/.test(window.location.hash)) setCurrent(slideFromHash());
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    window.history.replaceState(null, '', `#${current + 1}`);
    stage.current?.scrollTo(0, 0);
    document.title = `${current + 1}. ${slideDetails[current].title} — EKS Networking`;
  }, [current]);

  const SlideComponent = slides[current];
  const detail = slideDetails[current];
  return (
    <MotionConfig reducedMotion="user">
      <div className="deck">
        <a className="skip-link" href="#deck-navigation">슬라이드 탐색으로 이동</a>
        <main ref={stage} className="deck-stage" tabIndex={-1} aria-label={detail.title}>
          <SlideComponent key={current} />
        </main>
        <footer>
          <div className="deck-sources" aria-label="현재 슬라이드 출처">
            <span>출처</span>
            {detail.sources.map(({ label, href }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
            ))}
          </div>
          <nav id="deck-navigation" tabIndex={-1} className="deck-navigation" aria-label="슬라이드 탐색">
            <button onClick={() => setCurrent(current - 1)} disabled={current === 0}>이전</button>
            <label className="sr-only" htmlFor="slide-select">슬라이드 선택</label>
            <select id="slide-select" value={current} onChange={e => setCurrent(Number(e.target.value))}>
              {slideDetails.map(({ title }, i) => <option key={title} value={i}>{i + 1}. {title}</option>)}
            </select>
            <span className="deck-count">{current + 1} / {slides.length}</span>
            <button onClick={() => setCurrent(current + 1)} disabled={current === slides.length - 1}>다음</button>
          </nav>
          <p className="deck-help">← → · Space · Page Up/Down · Home/End · 본문이 길면 스크롤</p>
          <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {current + 1} / {slides.length}: {detail.title}
          </p>
        </footer>
      </div>
    </MotionConfig>
  );
}
