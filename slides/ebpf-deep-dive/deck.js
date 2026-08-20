// eBPF Deep Dive — compact deck navigation (no build step)
const slides = [...document.querySelectorAll('.slide')];
const progress = document.getElementById('progress');
const counter = document.getElementById('counter');
const TOTAL = slides.length;
let cur = 0;

function clamp(n) { return Math.max(0, Math.min(TOTAL - 1, n)); }

function show(n, push = true) {
  n = clamp(n);
  slides.forEach((s, i) => {
    s.classList.toggle('active', i === n);
    if (i !== n) s.classList.remove('built');
  });
  cur = n;
  counter.textContent = String(n + 1).padStart(2, '0') + ' / ' + String(TOTAL).padStart(2, '0');
  progress.style.width = ((n + 1) / TOTAL * 100) + '%';
  if (push) history.replaceState(null, '', '#' + (n + 1));
}

function advance() {
  const s = slides[cur];
  if (s.querySelector('[data-build]') && !s.classList.contains('built')) {
    s.classList.add('built');
    return;
  }
  show(cur + 1);
}

function retreat() { show(cur - 1); }

addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); advance(); }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); retreat(); }
  else if (e.key === 'Home') show(0);
  else if (e.key === 'End') show(TOTAL - 1);
});

addEventListener('hashchange', () => {
  const n = parseInt(location.hash.slice(1), 10);
  if (!isNaN(n)) show(n - 1, false);
});

document.getElementById('navPrev').addEventListener('click', retreat);
document.getElementById('navNext').addEventListener('click', advance);

// touch swipe
let tx0 = null;
addEventListener('touchstart', (e) => { tx0 = e.touches[0].clientX; }, { passive: true });
addEventListener('touchend', (e) => {
  if (tx0 === null) return;
  const dx = e.changedTouches[0].clientX - tx0;
  if (dx < -40) advance(); else if (dx > 40) retreat();
  tx0 = null;
}, { passive: true });

const init = parseInt(location.hash.slice(1), 10);
show(!isNaN(init) ? init - 1 : 0, false);
