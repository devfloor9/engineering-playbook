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
  if (e.key === 'Escape' && !setup.hidden) { setup.hidden = true; return; }
  if (e.target && e.target.closest && e.target.closest('input, textarea, select')) return;
  if (!e.metaKey && !e.ctrlKey && !e.altKey) {
    if (e.code === 'KeyE') { e.preventDefault(); setup.hidden = !setup.hidden; if (!setup.hidden) pFill(); return; }
    if (e.code === 'KeyQ') { e.preventDefault(); pcfg.qrHidden = !pcfg.qrHidden; pStore(); pRender(); return; }
  }
  if (!setup.hidden) return;
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

// ---- presenter setup · survey QR (이 브라우저의 localStorage에만 저장) ----
const PKEY = 'ebpf-deck-presenter-v1';
const P_DEFAULT = {
  count: 1, hide: false, survey: '', qrHidden: false,
  speakers: [
    { name: 'YoungJoon Jeong', title: '', company: 'AWS', linkedin: '' },
    { name: '', title: '', company: '', linkedin: '' },
  ],
};
const setup = document.getElementById('setup');
const F = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s)
  .replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function pLoad() {
  const base = JSON.parse(JSON.stringify(P_DEFAULT));
  try {
    const saved = JSON.parse(localStorage.getItem(PKEY) || 'null');
    if (saved) {
      Object.assign(base, saved);
      base.speakers = [0, 1].map((i) => Object.assign({}, P_DEFAULT.speakers[i], (saved.speakers || [])[i]));
    }
  } catch (_) { /* 손상된 저장값은 기본값으로 대체 */ }
  return base;
}
let pcfg = pLoad();

function pStore() { localStorage.setItem(PKEY, JSON.stringify(pcfg)); }

function pRender() {
  document.querySelectorAll('[data-speakers]').forEach((el) => {
    const list = pcfg.speakers.slice(0, pcfg.count).filter((s) => s.name);
    el.hidden = pcfg.hide || list.length === 0;
    el.innerHTML = list.map((s) => `
      <div class="spk">
        <h4>${esc(s.name)}</h4>
        ${s.title ? `<p class="t">${esc(s.title)}</p>` : ''}
        ${s.company ? `<p class="c">${esc(s.company)}</p>` : ''}
        ${s.linkedin ? `<p class="l">LINKEDIN: ${esc(s.linkedin)}</p>` : ''}
      </div>`).join('');
  });
  const box = document.getElementById('qrBox');
  if (!box) return;
  const showQr = pcfg.survey && !pcfg.qrHidden && typeof qrcode === 'function';
  box.hidden = !showQr;
  if (showQr) {
    try {
      const qr = qrcode(0, 'M');
      qr.addData(pcfg.survey);
      qr.make();
      F('qrTarget').innerHTML = qr.createSvgTag({ scalable: true, margin: 2 });
    } catch (_) { box.hidden = true; }
  }
}

function pFill() {
  ['1', '2'].forEach((n) => {
    const s = pcfg.speakers[n - 1];
    F('s' + n + 'name').value = s.name;
    F('s' + n + 'title').value = s.title;
    F('s' + n + 'company').value = s.company;
    F('s' + n + 'linkedin').value = s.linkedin;
  });
  F('hideSpk').checked = pcfg.hide;
  F('surveyUrl').value = pcfg.survey;
  setup.querySelectorAll('.seg button').forEach((b) => b.classList.toggle('on', +b.dataset.count === pcfg.count));
  F('spk2').hidden = pcfg.count < 2;
}

function pSave() {
  pcfg.speakers = ['1', '2'].map((n) => ({
    name: F('s' + n + 'name').value.trim(),
    title: F('s' + n + 'title').value.trim(),
    company: F('s' + n + 'company').value.trim(),
    linkedin: F('s' + n + 'linkedin').value.trim(),
  }));
  pcfg.hide = F('hideSpk').checked;
  pcfg.survey = F('surveyUrl').value.trim();
  pStore();
  pRender();
  setup.hidden = true;
}

setup.querySelectorAll('.seg button').forEach((b) =>
  b.addEventListener('click', () => { pcfg.count = +b.dataset.count; pFill(); }));
F('setupClose').addEventListener('click', () => { setup.hidden = true; });
F('setupSave').addEventListener('click', pSave);
F('setupReset').addEventListener('click', () => {
  pcfg = JSON.parse(JSON.stringify(P_DEFAULT));
  localStorage.removeItem(PKEY);
  pFill();
  pRender();
});
pRender();

const init = parseInt(location.hash.slice(1), 10);
show(!isNaN(init) ? init - 1 : 0, false);
