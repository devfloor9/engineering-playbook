// eBPF Deep Dive — compact deck navigation + presenter setup. No build step.
// DECK_ID는 덱마다 고유 — localStorage 키(프레젠터 설정)가 여기서 파생된다.
const DECK_ID = 'ebpf-deck';

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
  nRender();
  sUpdate();
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
  if (e.target && e.target.isContentEditable) return;
  if (!e.metaKey && !e.ctrlKey && !e.altKey) {
    if (e.code === 'KeyE') { e.preventDefault(); setup.hidden = !setup.hidden; if (!setup.hidden) pFill(); return; }
    if (e.code === 'KeyQ') { e.preventDefault(); pcfg.qrHidden = !pcfg.qrHidden; pStore(); pRender(); return; }
    if (e.code === 'KeyS') { e.preventDefault(); sOpen(); return; }
    if (e.code === 'KeyN') { e.preventDefault(); notesbar.hidden = !notesbar.hidden; nRender(); return; }
    if (e.code === 'KeyP') { e.preventDefault(); window.print(); return; }
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
const pdfBtn = document.getElementById('pdfBtn');
if (pdfBtn) pdfBtn.addEventListener('click', () => window.print());

// touch swipe
let tx0 = null;
addEventListener('touchstart', (e) => { tx0 = e.touches[0].clientX; }, { passive: true });
addEventListener('touchend', (e) => {
  if (tx0 === null) return;
  const dx = e.changedTouches[0].clientX - tx0;
  if (dx < -40) advance(); else if (dx > 40) retreat();
  tx0 = null;
}, { passive: true });

// ---- speaker notes (슬라이드 안 <aside class="notes"> — 화면에는 렌더되지 않음) ----
// S 키: 스피커 뷰 팝업 (현재/다음 미리보기 + 노트 + 경과 타이머 — 두 번째 모니터로 드래그)
// N 키: 같은 창 노트 오버레이 (팝업이 차단된 환경의 폴백)
const noteOf = (n) => {
  const el = slides[n] && slides[n].querySelector('.notes');
  return el ? el.innerHTML.trim() : '';
};
const titleOf = (n) => {
  const h = slides[n] && slides[n].querySelector('h1, h2, h3');
  return h ? h.textContent.replace(/\s+/g, ' ').trim() : '(제목 없음)';
};

const notesbar = document.createElement('div');
notesbar.id = 'notesbar';
notesbar.hidden = true;
document.body.appendChild(notesbar);
function nRender() {
  if (notesbar.hidden) return;
  notesbar.innerHTML = noteOf(cur) || '<em>이 슬라이드에는 노트가 없습니다</em>';
}

let sWin = null, sT0 = null, sTick = null;

function sOpen() {
  if (sWin && !sWin.closed) { sWin.focus(); return; }
  sWin = window.open('', DECK_ID + '-speaker', 'width=1080,height=720');
  if (!sWin) { notesbar.hidden = false; nRender(); return; } // 팝업 차단 → 오버레이 폴백
  const d = sWin.document;
  d.open();
  d.write('<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">'
    + '<title>Speaker View — ' + esc(document.title) + '</title><style>'
    + ':root{color-scheme:dark}'
    + '*{box-sizing:border-box;margin:0}'
    + 'body{background:#0b1017;color:#f3f3f7;font:14px/1.6 Pretendard,system-ui,sans-serif;height:100vh;display:flex;flex-direction:column;overflow:hidden}'
    + 'header{display:flex;align-items:center;gap:18px;padding:10px 18px;border-bottom:1px solid #2a3543;font-family:"JetBrains Mono",monospace;font-size:13px;color:#a6b2c3}'
    + '#svTimer{font-size:22px;font-weight:700;color:#ff9900;cursor:pointer;user-select:none}'
    + '#svClock{margin-left:auto}'
    + 'main{flex:1;display:grid;grid-template-columns:1.15fr 1fr;gap:14px;padding:14px;min-height:0}'
    + '.pv{display:flex;flex-direction:column;gap:12px;min-height:0}'
    + '.fr{flex:1;min-height:0;position:relative;border:1px solid #2a3543;border-radius:10px;overflow:hidden;background:#05070a}'
    + '.fr label{position:absolute;top:8px;left:10px;z-index:2;font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.14em;color:#a6b2c3;background:rgba(11,16,23,.8);padding:2px 8px;border-radius:6px}'
    + '.fr.next label{color:#41b3ff}'
    + '.fr iframe{width:1280px;height:800px;border:0;transform-origin:0 0;pointer-events:none}'
    + '.nt{display:flex;flex-direction:column;min-height:0;border:1px solid #2a3543;border-radius:10px;padding:16px 18px;background:#0e141d}'
    + '.nt h2{font-size:16px;color:#ffb84d;margin-bottom:4px}'
    + '.nt .nx{font-family:"JetBrains Mono",monospace;font-size:11px;color:#a6b2c3;margin-bottom:10px}'
    + '#svNotes{flex:1;overflow-y:auto;font-size:16.5px;line-height:1.7;white-space:normal}'
    + '#svNotes em{color:#a6b2c3}#svNotes b{color:#ffb84d}#svNotes code{font-family:"JetBrains Mono",monospace;font-size:.9em;color:#41b3ff}'
    + '.ctl{display:flex;gap:8px;margin-top:12px}'
    + '.ctl button{flex:1;background:#131a24;border:1px solid #2a3543;color:#f3f3f7;border-radius:8px;padding:10px 0;font-size:14px;cursor:pointer}'
    + '.ctl button:hover{border-color:#ff9900;color:#ff9900}'
    + '</style></head><body>'
    + '<header><span id="svCounter"></span><span id="svTimer" title="클릭하면 타이머 리셋">00:00</span><span id="svClock"></span></header>'
    + '<main><section class="pv">'
    + '<div class="fr"><label>CURRENT</label><iframe id="svCur"></iframe></div>'
    + '<div class="fr next"><label>NEXT</label><iframe id="svNext"></iframe></div>'
    + '</section><section class="nt">'
    + '<h2 id="svTitle"></h2><div class="nx" id="svNextTitle"></div>'
    + '<div id="svNotes"></div>'
    + '<div class="ctl"><button id="svPrev">‹ 이전</button><button id="svNextBtn">다음 ›</button></div>'
    + '</section></main></body></html>');
  d.close();

  d.getElementById('svPrev').addEventListener('click', retreat);
  d.getElementById('svNextBtn').addEventListener('click', advance);
  d.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); advance(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); retreat(); }
  });
  d.getElementById('svTimer').addEventListener('click', () => { sT0 = Date.now(); });

  const sScale = () => d.querySelectorAll('.fr iframe').forEach((f) => {
    f.style.transform = 'scale(' + (f.parentElement.clientWidth / 1280) + ')';
  });
  sWin.addEventListener('resize', sScale);
  setTimeout(sScale, 50);

  sT0 = sT0 || Date.now();
  clearInterval(sTick);
  sTick = setInterval(() => {
    if (sWin.closed) { clearInterval(sTick); return; }
    const s = Math.floor((Date.now() - sT0) / 1000);
    d.getElementById('svTimer').textContent =
      String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    d.getElementById('svClock').textContent = new Date().toLocaleTimeString('ko-KR', { hour12: false });
  }, 1000);
  sUpdate();
}

function sUpdate() {
  if (!sWin || sWin.closed) return;
  const d = sWin.document;
  const $ = (id) => d.getElementById(id);
  if (!$('svNotes')) return;
  $('svCounter').textContent = String(cur + 1).padStart(2, '0') + ' / ' + String(TOTAL).padStart(2, '0');
  $('svTitle').textContent = (cur + 1) + ' · ' + titleOf(cur);
  $('svNextTitle').textContent = cur + 1 < TOTAL ? 'NEXT → ' + titleOf(cur + 1) : 'NEXT → (마지막 슬라이드)';
  $('svNotes').innerHTML = noteOf(cur) || '<em>이 슬라이드에는 노트가 없습니다</em>';
  const base = location.href.split('#')[0];
  $('svCur').src = base + '#' + (cur + 1);
  const nx = $('svNext');
  if (cur + 1 < TOTAL) { nx.src = base + '#' + (cur + 2); nx.style.opacity = 1; }
  else { nx.style.opacity = .25; }
}

addEventListener('beforeunload', () => { if (sWin && !sWin.closed) sWin.close(); });

// ---- presenter setup · survey QR (이 브라우저의 localStorage에만 저장) ----
const PKEY = DECK_ID + '-presenter-v1';
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

// ---- inline edit ([data-edit="key"] — 클릭해서 텍스트 수정, 이 브라우저 localStorage에만 저장) ----
// 같은 key를 가진 요소끼리 실시간 동기화 (예: 커버·클로징에 같은 문구)
document.querySelectorAll('[data-edit]').forEach((el) => {
  el.contentEditable = 'true';
  el.spellcheck = false;
  const key = DECK_ID + '-edit-' + el.dataset.edit;
  const saved = localStorage.getItem(key);
  if (saved !== null && saved.trim() !== '') el.textContent = saved;
  el.addEventListener('input', () => {
    localStorage.setItem(key, el.textContent);
    document.querySelectorAll('[data-edit="' + el.dataset.edit + '"]').forEach((o) => {
      if (o !== el && o.textContent !== el.textContent) o.textContent = el.textContent;
    });
  });
  el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); el.blur(); } });
});

const init = parseInt(location.hash.slice(1), 10);
show(!isNaN(init) ? init - 1 : 0, false);
