import React, {useEffect, useLayoutEffect, useMemo, useRef} from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useAllDocsData} from '@docusaurus/plugin-content-docs/client';
import Layout from '@theme/Layout';
import Icon from '@site/src/components/Icon';
import {RINGS, STATIONS, VIEW_BOX} from '@site/src/components/HomeSurvey/contours';
import styles from './index.module.css';

const chapters = [
  {id: 'eks-best-practices', title: 'EKS Best Practices', href: '/docs/eks-best-practices',
    category: {ko: '인프라 운영', en: 'Infrastructure'},
    ko: '네트워크, 보안, 확장, 비용. EKS 운영의 기본기를 쌓고 문제의 원인을 좁힙니다.',
    en: 'Networking, security, scaling, and cost. Build an operational foundation and trace problems to their source.',
    areas: {ko: ['네트워킹', '컨트롤 플레인', '리소스·비용', '운영 안정성', '보안'], en: ['Networking', 'Control plane', 'Resources & cost', 'Reliability', 'Security']},
    sheet: '120 100 300 260'},
  {id: 'agentic-ai-platform', title: 'Agentic AI Platform', href: '/docs/agentic-ai-platform',
    category: {ko: 'AI 시스템', en: 'AI systems'},
    ko: '모델 서빙부터 Gateway, 데이터, 관측까지. AI 플랫폼을 구성하는 요소와 선택 기준을 다룹니다.',
    en: 'Model serving, gateways, data, and observability. Understand the components and decisions behind an AI platform.',
    areas: {ko: ['설계·아키텍처', '모델 서빙', '운영·MLOps', '레퍼런스 아키텍처'], en: ['Design & architecture', 'Model serving', 'Operations & MLOps', 'Reference architecture']},
    sheet: '210 60 320 280'},
  {id: 'eks-hybrid-nodes', title: 'EKS Hybrid Nodes', href: '/docs/eks-hybrid-nodes',
    category: {ko: '하이브리드 인프라', en: 'Hybrid infrastructure'},
    ko: '온프레미스 노드를 EKS에 연결하고 네트워크, 스토리지, GPU를 운영합니다.',
    en: 'Connect on-premises nodes to EKS and operate networking, storage, and GPU workloads.'},
  {id: 'aidlc', title: 'AIDLC', href: '/docs/aidlc',
    category: {ko: '개발 방법론', en: 'Development practice'},
    ko: '요구사항에서 구현과 검증까지, AI와 협업하는 개발 과정을 정리합니다.',
    en: 'A development workflow for working with AI, from requirements through implementation and validation.'},
  {id: 'benchmarks', title: 'Benchmarks', href: '/docs/benchmarks',
    category: {ko: '측정', en: 'Measurement'},
    ko: '측정 조건과 결과를 함께 읽고 성능, 비용, 아키텍처의 차이를 비교합니다.',
    en: 'Read results alongside their test conditions to compare performance, cost, and architecture.'},
  {id: 'rosa', title: 'ROSA', href: '/docs/rosa',
    category: {ko: 'OpenShift on AWS', en: 'OpenShift on AWS'},
    ko: 'Red Hat OpenShift on AWS의 설치, 보안, 엔터프라이즈 운영을 다룹니다.',
    en: 'Installation, security, and enterprise operations for Red Hat OpenShift on AWS.'},
];

/* The three entry points, plotted on the survey field by reading depth.
   `dy`/`dx` describe the leader line from the station to its label anchor. */
const [VB_W, VB_H] = VIEW_BOX.split(' ').slice(2).map(Number);
const pct = (v, total) => `${((v / total) * 100).toFixed(2)}%`;
const plot = (at, dy, dx) => {
  const [x, y] = at;
  return {
    leader: `M${x} ${y}V${y + dy}H${x + dx}`,
    vars: {'--x': pct(x + dx, VB_W), '--y': pct(y + dy, VB_H), '--tx': dx < 0 ? '-100%' : '0%'},
  };
};
const stations = [
  {key: 'deep', ring: 1, at: STATIONS.shallow, ...plot(STATIONS.shallow, -61, 15),
    to: '/docs/eks-best-practices/operations-reliability/eks-debugging',
    depth: {ko: '진단', en: 'Diagnose'}, label: {ko: 'EKS 장애 진단', en: 'EKS debugging'},
    note: {ko: '증상별 확인 순서', en: 'Symptom-first checklists'}},
  {key: 'mid', ring: 4, at: STATIONS.mid, ...plot(STATIONS.mid, 126, -10),
    to: '/docs/agentic-ai-platform/model-serving',
    depth: {ko: '구현', en: 'Implement'}, label: {ko: '모델 서빙', en: 'Model serving'},
    note: {ko: 'GPU · 추론 엔진 · 라우팅', en: 'GPU · engines · routing'}},
  {key: 'outer', ring: 7, at: STATIONS.deep, ...plot(STATIONS.deep, -86, 16),
    to: '/docs/agentic-ai-platform/design-architecture/platform-selection/ai-platform-decision-framework',
    depth: {ko: '설계', en: 'Design'}, label: {ko: '아키텍처 선택', en: 'Architecture decisions'},
    note: {ko: '플랫폼 의사결정 프레임워크', en: 'Platform decision framework'}},
];

const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/* Scroll reveal. Content is visible by default; JS arms the hidden start state
   only after mount, so a failed script never hides the page. */
function useReveal() {
  const ref = useRef(null);
  useClientLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return undefined;
    node.dataset.armed = '';
    // The root extends far above the viewport: a section the reader jumped past
    // (End key, anchor link) counts as intersecting and reveals at once.
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      node.dataset.revealed = '';
      io.disconnect();
    }, {threshold: 0, rootMargin: '100000px 0px -12% 0px'});
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return ref;
}

function useDocCounts() {
  const data = useAllDocsData();
  return useMemo(() => {
    const docs = data?.default?.versions?.[0]?.docs ?? [];
    const counts = {total: docs.length};
    for (const doc of docs) {
      const chapter = doc.id.split('/')[0];
      counts[chapter] = (counts[chapter] || 0) + 1;
    }
    return counts;
  }, [data]);
}

function Arrow({name = 'arrow-right'}) {
  return <Icon name={name} size={18} className={styles.arrow} />;
}

function HomeStructuredData() {
  const {siteConfig, i18n} = useDocusaurusContext();
  const homePath = useBaseUrl('/');
  const siteUrl = siteConfig.url + siteConfig.baseUrl.replace(/\/$/, '');
  const structuredData = [
    {'@context': 'https://schema.org', '@type': 'WebSite', name: siteConfig.title,
      url: `${siteConfig.url}${homePath}`, description: siteConfig.tagline, inLanguage: i18n.currentLocale},
    {'@context': 'https://schema.org', '@type': 'Organization', name: siteConfig.title, url: siteUrl,
      logo: {'@type': 'ImageObject', url: `${siteUrl}/img/logo.svg`},
      sameAs: ['https://github.com/devfloor9/engineering-playbook']},
  ];
  return <Head><script type="application/ld+json">{JSON.stringify(structuredData)}</script></Head>;
}

/* The contour rings, defined once and reused by the chapter sheets via <use>. */
function ContourDefs() {
  return <svg className={styles.defs} aria-hidden="true" focusable="false">
    <defs>
      <g id="ep-contours">
        {RINGS.map((d, i) => <path key={i} d={d} pathLength="1" fill="none" stroke="currentColor" strokeWidth="1" className={styles.ring} style={{'--i': i}} />)}
      </g>
    </defs>
  </svg>;
}

function SurveyField({ko}) {
  const scale = ko ? ['개요', '설계', '구현', '운영', '진단'] : ['Overview', 'Design', 'Implement', 'Operate', 'Diagnose'];
  return <div className={styles.fieldWrap}>
    <figure className={styles.field} aria-label={ko ? '매뉴얼의 주제 지형도: 읽는 깊이에 따라 배치한 세 진입점' : 'Survey of the manual: three entry points plotted by reading depth'}>
      <svg viewBox={VIEW_BOX} className={styles.fieldSvg} aria-hidden="true" focusable="false">
        <use href="#ep-contours" />
        {stations.map((s, i) => <g key={s.key} className={styles.stationGroup} style={{'--d': `${1.3 + i * 0.22}s`}}>
          <path d={s.leader} pathLength="1" className={styles.leader} />
          <g transform={`translate(${s.at[0]} ${s.at[1]})`}>
            <circle r="11" className={styles.ripple} />
            <circle r="4.5" className={styles.station} />
          </g>
        </g>)}
      </svg>
      {stations.map((s, i) => <Link key={s.key} to={s.to} className={styles.stationLabel} style={{...s.vars, '--d': `${1.3 + i * 0.22}s`}}>
        <span className={styles.stationDepth}>{ko ? s.depth.ko : s.depth.en} · L{s.ring}</span>
        <span className={styles.stationName}>{ko ? s.label.ko : s.label.en}<Arrow /></span>
        <span className={styles.stationNote}>{ko ? s.note.ko : s.note.en}</span>
      </Link>)}
      <figcaption className={styles.srOnly}>{stations.map((s) => (ko ? s.label.ko : s.label.en)).join(', ')}</figcaption>
    </figure>
    <div className={styles.elevation} aria-hidden="true">
      <span className={styles.elevationTitle}>{ko ? '읽는 깊이' : 'Depth'}</span>
      <div className={styles.elevationScale}>
        {scale.map((t, i) => <span key={t} style={{'--k': i}}><i />{t}</span>)}
      </div>
    </div>
  </div>;
}

function Hero({ko, counts}) {
  const searchUrl = useBaseUrl('/search/');
  return <header className={styles.hero}>
    <div className={styles.heroCopy}>
      <h1 className={styles.heroTitle}>
        {ko ? <>설계의 이유부터,<br />운영의 디테일까지.</> : <>From design rationale<br />to operating detail.</>}
      </h1>
      <p className={styles.heroLead}>{ko
        ? 'EKS 운영, AI 플랫폼 구축, 성능 검증을 다루는 실전 엔지니어링 매뉴얼입니다. 각 장은 왜 그 선택을 하는지 먼저 설명하고, 측정 조건이 붙은 결과와 재현 가능한 운영 절차로 이어집니다.'
        : 'A practical engineering manual for EKS operations, AI platforms, and performance testing. Each chapter explains the reasoning first, then follows through with measured results and reproducible operating procedures.'}</p>
      <div className={styles.heroActions}>
        <Link className={styles.primaryLink} to="/docs/intro">
          <span>{ko ? '매뉴얼 펼치기' : 'Open the manual'}</span>
          <span className={styles.primaryDisc}><Icon name="arrow-right" size={16} /></span>
        </Link>
        <a className={styles.ghostLink} href="#survey">{ko ? '주제 지형도 보기' : 'See the survey'}<Icon name="arrow-down" size={16} className={styles.arrow} /></a>
      </div>
      <form role="search" aria-label={ko ? '문서 검색' : 'Search the manual'} action={searchUrl} method="get" className={styles.homeSearch}>
        <Icon name="search" size={18} />
        <label className={styles.srOnly} htmlFor="home-search">{ko ? '검색어' : 'Search terms'}</label>
        <input id="home-search" type="search" name="q" required autoComplete="off" spellCheck="false" placeholder={ko ? 'CoreDNS, KV Cache, 장애 진단…' : 'CoreDNS, KV cache, troubleshooting…'} />
        <button type="submit">{ko ? '검색' : 'Search'}<Icon name="arrow-right" size={16} /></button>
      </form>
      <p className={styles.readout}>
        <span>{counts.total.toLocaleString()} {ko ? '문서' : 'documents'}</span>
        <span>{chapters.length} {ko ? '장' : 'chapters'}</span>
        <span>{ko ? '한국어 원문 · English 번역' : 'Korean source · English mirror'}</span>
      </p>
    </div>
    <SurveyField ko={ko} />
  </header>;
}

function Legend({ko}) {
  const items = [
    {glyph: 'contour', t: ko ? '왜 그런지부터 설명합니다' : 'Explains the reasoning first',
      d: ko ? '명령 모음이 아니라 각 선택의 배경과 트레이드오프를 함께 적습니다.' : 'Not a list of commands: every choice comes with its background and trade-offs.'},
    {glyph: 'station', t: ko ? '숫자에는 측정 조건이 붙습니다' : 'Every number carries its conditions',
      d: ko ? '벤치마크는 결과와 함께 측정 환경, 검증 수준을 밝힙니다. 계산 예시와 실측 결과를 구분합니다.' : 'Benchmarks state their environment and verification level, and calculated examples stay separate from measured results.'},
    {glyph: 'transect', t: ko ? '현장에서 나온 절차입니다' : 'Procedures from the field',
      d: ko ? '실제 운영과 고객 사례에서 만난 문제를 재현 가능한 확인 순서로 정리합니다.' : 'Problems met in real operations and customer work, written up as reproducible check sequences.'},
  ];
  return <section className={styles.legend} aria-label={ko ? '이 매뉴얼을 읽는 방법' : 'How this manual works'}>
    {items.map((it) => <div key={it.glyph} className={styles.legendItem}>
      <svg className={styles.legendGlyph} viewBox="0 0 48 24" aria-hidden="true" focusable="false">
        {it.glyph === 'contour' && <><path d="M2 18C10 6 18 4 26 9s14 4 20-3" /><path d="M2 22c8-9 14-11 22-7s14 6 22 0" opacity=".55" /></>}
        {it.glyph === 'station' && <><path d="M2 12h14M32 12h14" /><circle cx="24" cy="12" r="4" className={styles.legendMarker} /><circle cx="24" cy="12" r="9" opacity=".4" /></>}
        {it.glyph === 'transect' && <><path d="M2 12h44" /><circle cx="10" cy="12" r="2.5" /><circle cx="24" cy="12" r="2.5" /><circle cx="38" cy="12" r="2.5" /></>}
      </svg>
      <h2>{it.t}</h2>
      <p>{it.d}</p>
    </div>)}
  </section>;
}

function Survey({ko, counts}) {
  const ref = useReveal();
  const featured = chapters.slice(0, 2);
  const rest = chapters.slice(2);
  const docsWord = (n) => `${n} ${ko ? '문서' : n === 1 ? 'doc' : 'docs'}`;
  return <section id="survey" ref={ref} className={styles.survey} aria-labelledby="survey-title">
    <div className={styles.sectionHead}>
      <h2 id="survey-title">{ko ? '필요한 깊이까지, 한 장씩.' : 'Find your next chapter.'}</h2>
      <p>{ko ? '기반 인프라에서 AI 시스템까지. 지금 다루는 문제에 맞는 장으로 들어가세요.' : 'From the underlying infrastructure to AI systems. Start with the problem in front of you.'}</p>
    </div>
    <div className={styles.sheets}>
      {featured.map((c, i) => <Link to={c.href} key={c.id} className={styles.sheet} style={{'--i': i}}>
        <svg className={styles.sheetMap} viewBox={c.sheet} aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice"><use href="#ep-contours" /></svg>
        <div className={styles.sheetHead}>
          <span className={styles.sheetCategory}>{ko ? c.category.ko : c.category.en}</span>
          <span className={styles.count}>{docsWord(counts[c.id] ?? 0)}</span>
        </div>
        <h3>{c.title}</h3>
        <p>{ko ? c.ko : c.en}</p>
        <div className={styles.sheetAreasClip}><ul className={styles.sheetAreas}>{(ko ? c.areas.ko : c.areas.en).map((a) => <li key={a}>{a}</li>)}</ul></div>
        <span className={styles.sheetGo}>{ko ? '장 열기' : 'Open chapter'}<Arrow /></span>
      </Link>)}
    </div>
    <ol className={styles.rows}>
      {rest.map((c, i) => <li key={c.id} style={{'--i': i}}>
        <Link to={c.href} className={styles.row}>
          <span className={styles.rowTitle}><h3>{c.title}</h3><span>{ko ? c.category.ko : c.category.en}</span></span>
          <p>{ko ? c.ko : c.en}</p>
          <span className={styles.count}>{docsWord(counts[c.id] ?? 0)}</span>
          <Arrow />
        </Link>
      </li>)}
    </ol>
  </section>;
}

function Transect({ko}) {
  const ref = useReveal();
  const steps = [
    {n: '1', verb: ko ? '이해' : 'Understand', title: ko ? '구조와 선택 기준을 이해합니다.' : 'Understand the design choices.',
      d: ko ? '구성 요소의 역할과 대안을 비교하고, 요구사항에 맞는 설계를 찾습니다.' : 'Compare component roles and alternatives against your requirements.',
      to: '/docs/agentic-ai-platform/design-architecture/platform-selection/ai-platform-decision-framework', link: ko ? 'AI 플랫폼 의사결정 가이드' : 'AI platform decision framework'},
    {n: '2', verb: ko ? '적용' : 'Apply', title: ko ? '구현을 따라가며 확인합니다.' : 'Work through the implementation.',
      d: ko ? '모델 서빙 구성과 배포 예제를 살펴보고, 환경에 맞는 적용 조건을 확인합니다.' : 'Review serving configurations and deployment examples, including the conditions they depend on.',
      to: '/docs/agentic-ai-platform/model-serving', link: ko ? '모델 서빙 가이드' : 'Model serving guide'},
    {n: '3', verb: ko ? '검증' : 'Verify', title: ko ? '동작을 관찰하고 원인을 찾습니다.' : 'Observe behavior and diagnose problems.',
      d: ko ? '메트릭, 장애 진단 순서, 운영 체크리스트로 시스템의 상태를 읽습니다.' : 'Use metrics, diagnostic procedures, and checklists to understand how the system behaves.',
      to: '/docs/eks-best-practices/operations-reliability/eks-debugging', link: ko ? 'EKS 장애 진단 가이드' : 'EKS debugging guide'},
  ];
  return <section ref={ref} className={styles.transect} aria-labelledby="transect-title">
    <div className={styles.transectInner}>
      <div className={styles.sectionHead}>
        <h2 id="transect-title">{ko ? '이해하고, 적용하고, 검증합니다.' : 'Understand. Apply. Verify.'}</h2>
        <Link className={styles.textLink} to="/docs/intro">{ko ? '읽기 경로 안내' : 'Guide to the manual'}<Arrow /></Link>
      </div>
      <div className={styles.transectLine} aria-hidden="true">
        <svg viewBox="0 0 100 2" preserveAspectRatio="none"><path d="M0 1H100" pathLength="1" /></svg>
        {steps.map((s, i) => <span key={s.n} className={styles.transectMark} style={{'--i': i}} />)}
      </div>
      <ol className={styles.steps}>
        {steps.map((s, i) => <li key={s.n} className={styles.step} style={{'--i': i}}>
          <span className={styles.stepLabel}><b>{s.n}</b>{s.verb}</span>
          <h3>{s.title}</h3>
          <p>{s.d}</p>
          <Link to={s.to}>{s.link}<Arrow /></Link>
        </li>)}
      </ol>
    </div>
  </section>;
}

function Repositories({ko}) {
  return <section className={styles.repositories} aria-labelledby="repositories-title">
    <div className={styles.repoIntro}>
      <h2 id="repositories-title">{ko ? '문서 옆에, 실행할 코드.' : 'The code beside the manual.'}</h2>
      <p>{ko ? '참고 아키텍처와 배포 구성을 저장소에서 확인하세요.' : 'Continue with reference architectures and deployment configurations in the repositories.'}</p>
    </div>
    <div className={styles.repoLinks}>
      <Link to="https://github.com/devfloor9/ai-on-eks"><span><strong>AI on EKS</strong><small>{ko ? 'AI 워크로드 구성과 운영 예제' : 'AI workload configurations and examples'}</small></span><Arrow name="external-link" /></Link>
      <Link to="https://github.com/devfloor9/sample-genai-on-eks-starter-kit"><span><strong>GenAI on EKS Starter Kit</strong><small>{ko ? '플랫폼 구성 요소와 시작 가이드' : 'Platform components and a starting guide'}</small></span><Arrow name="external-link" /></Link>
    </div>
    <div className={styles.sourceNote}>
      <span>{ko ? '함께 고쳐가는 기술 매뉴얼' : 'An engineering manual, maintained in the open'}</span>
      <Link to="https://github.com/devfloor9/engineering-playbook">{ko ? '소스와 변경 이력' : 'Source and revision history'}<Icon name="external-link" size={16} /></Link>
      <Link to="/ai-docs">{ko ? 'AI용 문서 안내' : 'AI documentation guide'}<Icon name="arrow-right" size={16} /></Link>
    </div>
  </section>;
}

export default function Home() {
  const {i18n} = useDocusaurusContext();
  const ko = i18n.currentLocale === 'ko';
  const counts = useDocCounts();
  return <Layout title="Engineering Playbook" description={ko ? 'EKS 운영, AI 플랫폼 구축, 성능 검증을 다루는 실전 엔지니어링 매뉴얼' : 'A practical engineering manual for EKS operations, AI platforms, and performance testing.'}>
    <HomeStructuredData />
    <main className={styles.home} data-ep-theme="manual">
      <ContourDefs />
      <Hero ko={ko} counts={counts} />
      <Legend ko={ko} />
      <Survey ko={ko} counts={counts} />
      <Transect ko={ko} />
      <Repositories ko={ko} />
    </main>
  </Layout>;
}
