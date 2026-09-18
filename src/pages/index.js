import React from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';
import Icon from '@site/src/components/Icon';

const topics = [
  {title: 'EKS Best Practices', href: '/docs/eks-best-practices', category: 'Infrastructure',
    ko: '네트워크, 보안, 확장, 비용. EKS 운영의 기본기를 쌓고 문제의 원인을 좁힙니다.',
    en: 'Networking, security, scaling, and cost. Build an operational foundation and trace problems to their source.',
    subjects: ['Networking', 'Reliability', 'Karpenter']},
  {title: 'Agentic AI Platform', href: '/docs/agentic-ai-platform', category: 'AI systems',
    ko: '모델 서빙부터 Gateway, 데이터, 관측까지. AI 플랫폼을 구성하는 요소와 선택 기준을 다룹니다.',
    en: 'Model serving, gateways, data, and observability. Understand the components and decisions behind an AI platform.',
    subjects: ['Model serving', 'AI Gateway', 'MLOps']},
  {title: 'EKS Hybrid Nodes', href: '/docs/eks-hybrid-nodes', category: 'Hybrid infrastructure',
    ko: '온프레미스 노드를 EKS에 연결하고 네트워크, 스토리지, GPU를 운영합니다.',
    en: 'Connect on-premises nodes to EKS and operate networking, storage, and GPU workloads.'},
  {title: 'ROSA', href: '/docs/rosa', category: 'OpenShift on AWS',
    ko: 'Red Hat OpenShift on AWS의 설치, 보안, 엔터프라이즈 운영을 다룹니다.',
    en: 'Installation, security, and enterprise operations for Red Hat OpenShift on AWS.'},
  {title: 'AIDLC', href: '/docs/aidlc', category: 'Development practice',
    ko: '요구사항에서 구현과 검증까지, AI와 협업하는 개발 과정을 정리합니다.',
    en: 'A development workflow for working with AI, from requirements through implementation and validation.'},
  {title: 'Benchmarks', href: '/docs/benchmarks', category: 'Measurement',
    ko: '측정 조건과 결과를 함께 읽고 성능, 비용, 아키텍처의 차이를 비교합니다.',
    en: 'Read results alongside their test conditions to compare performance, cost, and architecture.'},
  {title: 'Industry Solutions', href: '/docs/industry-solutions', category: 'Applied engineering',
    ko: '산업별 요구사항을 실제 설계와 구현 시나리오로 연결합니다.',
    en: 'Connect industry requirements to concrete designs and implementation scenarios.'},
];

function Arrow() {
  return <Icon name="arrow-right" size={18} className={styles.arrow} />;
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

function ManualCover() {
  return <div className={styles.coverScene} aria-hidden="true">
    <div className={styles.coverAnnotation}>THE ENGINEERING REFERENCE</div>
    <div className={styles.cover}>
      <div className={styles.coverTop}><span>EP / FIELD NOTES</span><span>01 — 07</span></div>
      <div className={styles.coverTitle}>Design.<br />Build.<br /><span>Operate.</span></div>
      <svg className={styles.coverDiagram} viewBox="0 0 360 170" fill="none">
        <path d="M30 85H115M180 30V140M245 85H330M115 30H245V140H115Z" stroke="currentColor" strokeWidth="1" />
        <path d="M30 30H115M245 140H330M65 30V140M295 30V140" stroke="currentColor" strokeOpacity=".35" />
        <circle cx="30" cy="85" r="10" fill="currentColor" /><circle cx="330" cy="85" r="10" fill="currentColor" />
        <path d="m180 57 28 28-28 28-28-28Z" fill="currentColor" />
        <circle cx="115" cy="30" r="5" fill="var(--ep-surface-container-lowest)" stroke="currentColor" />
        <circle cx="245" cy="140" r="5" fill="var(--ep-surface-container-lowest)" stroke="currentColor" />
        <path d="M22 25v10m-5-5h10M328 135v10m-5-5h10" stroke="currentColor" strokeOpacity=".6" />
      </svg>
      <div className={styles.coverBottom}><span>CLOUD INFRASTRUCTURE<br />& AI PLATFORMS</span><span className={styles.coverMark}>ep.</span></div>
    </div>
    <span className={styles.coverTab}>ENGINEERING PLAYBOOK</span>
    <span className={styles.coverCaption}>Architecture / Implementation / Operations</span>
  </div>;
}

function Hero({ko}) {
  const searchUrl = useBaseUrl('/search/');
  return <header className={styles.hero}>
    <div className={styles.heroRule}>
      <span><span className={styles.square} /> A FIELD GUIDE FOR ENGINEERS</span>
      <span className={styles.heroRuleRight}>AWS · KUBERNETES · AI</span>
    </div>
    <div className={styles.heroGrid}>
      <div className={styles.heroCopy}>
        <h1>Engineering<br /><span>Playbook.</span></h1>
        <p className={styles.heroLead}>{ko ? '설계의 이유부터, 운영의 디테일까지.' : 'From architecture decisions to operational detail.'}</p>
        <p className={styles.heroDescription}>{ko
          ? 'EKS 운영, AI 플랫폼 구축, 성능 검증을 다루는 기술 매뉴얼입니다. 개념과 선택 기준을 이해하고, 구현 예제와 운영 절차로 이어가세요.'
          : 'A practical manual for EKS operations, AI platforms, and performance testing. Connect concepts and design choices with implementation examples and operational procedures.'}</p>
        <div className={styles.heroActions}>
          <Link className={styles.primaryLink} to="/docs/intro">{ko ? '매뉴얼 펼치기' : 'Open the manual'}<span aria-hidden="true">→</span></Link>
          <a className={styles.contentsLink} href="#contents">{ko ? '전체 목차' : 'Explore the contents'}<span aria-hidden="true">↓</span></a>
        </div>
        <form role="search" aria-label={ko ? '문서 검색' : 'Search the manual'} action={searchUrl} method="get" className={styles.homeSearch}>
          <Icon name="search" size={18} />
          <label className={styles.srOnly} htmlFor="home-search">{ko ? '검색어' : 'Search terms'}</label>
          <input id="home-search" type="search" name="q" required placeholder={ko ? 'CoreDNS, KV Cache, 장애 진단…' : 'CoreDNS, KV cache, troubleshooting…'} />
          <button type="submit">{ko ? '검색' : 'Search'}<span aria-hidden="true">↵</span></button>
        </form>
        <p className={styles.heroMeta}>{ko ? `${topics.length}개 주제 · 한국어 중심, English 번역 제공` : `${topics.length} topics · Korean with English translations`}</p>
      </div>
      <ManualCover />
    </div>
    <nav className={styles.quickLinks} aria-label={ko ? '바로 찾기' : 'Quick reference'}>
      <span className={styles.quickLabel}>{ko ? '바로 찾기' : 'QUICK REFERENCE'}</span>
      <Link to="/docs/eks-best-practices/operations-reliability/eks-debugging">{ko ? 'EKS 장애 진단' : 'EKS troubleshooting'}<Arrow /></Link>
      <Link to="/docs/agentic-ai-platform/model-serving">{ko ? '모델 서빙' : 'Model serving'}<Arrow /></Link>
      <Link to="/docs/agentic-ai-platform/design-architecture/platform-selection/ai-platform-decision-framework">{ko ? '아키텍처 선택' : 'Architecture decisions'}<Arrow /></Link>
    </nav>
  </header>;
}

function Contents({ko}) {
  return <section id="contents" className={styles.contents} aria-labelledby="contents-title">
    <div className={styles.sectionHeading}>
      <div><span className={styles.kicker}>THE CONTENTS</span><h2 id="contents-title">{ko ? '필요한 깊이까지, 한 장씩.' : 'Find your next chapter.'}</h2></div>
      <p>{ko ? '기반 인프라에서 AI 시스템까지.\n지금 다루는 문제에 맞는 주제로 들어가세요.' : 'From the underlying infrastructure to AI systems.\nStart with the problem in front of you.'}</p>
    </div>
    <div className={styles.featuredTopics}>
      {topics.slice(0, 2).map((topic, index) => <Link to={topic.href} key={topic.href} className={`${styles.featuredTopic} ${index === 1 ? styles.aiTopic : ''}`}>
        <div className={styles.chapterHeading}><span className={styles.chapterNumber}>0{index + 1}</span><span>{topic.category}</span><Arrow /></div>
        <h3>{topic.title}</h3><p>{ko ? topic.ko : topic.en}</p>
        <div className={styles.topicFoot}><span>{topic.subjects.join(' / ')}</span><span>{ko ? '읽기' : 'Read'} →</span></div>
      </Link>)}
    </div>
    <div className={styles.chapterList}>
      {topics.slice(2).map((topic, index) => <Link to={topic.href} key={topic.href} className={styles.chapterRow}>
        <span className={styles.chapterNumber}>0{index + 3}</span>
        <div className={styles.chapterName}><h3>{topic.title}</h3><span>{topic.category}</span></div>
        <p>{ko ? topic.ko : topic.en}</p><Arrow />
      </Link>)}
    </div>
  </section>;
}

function ReadingPaths({ko}) {
  const paths = [
    {number: '01', verb: 'Understand', title: ko ? '구조와 선택 기준을 이해합니다.' : 'Understand the design choices.',
      description: ko ? '구성 요소의 역할과 대안을 비교하고, 요구사항에 맞는 설계를 찾습니다.' : 'Compare component roles and alternatives against your requirements.',
      to: '/docs/agentic-ai-platform/design-architecture/platform-selection/ai-platform-decision-framework', link: ko ? 'AI 플랫폼 의사결정 가이드' : 'AI platform decision framework'},
    {number: '02', verb: 'Implement', title: ko ? '구현을 따라가며 확인합니다.' : 'Work through the implementation.',
      description: ko ? '모델 서빙 구성과 배포 예제를 살펴보고, 환경에 맞는 적용 조건을 확인합니다.' : 'Review serving configurations and deployment examples, including the conditions they depend on.',
      to: '/docs/agentic-ai-platform/model-serving', link: ko ? '모델 서빙 가이드' : 'Model serving guide'},
    {number: '03', verb: 'Operate', title: ko ? '동작을 관찰하고 원인을 찾습니다.' : 'Observe behavior and diagnose problems.',
      description: ko ? '메트릭, 장애 진단 순서, 운영 체크리스트를 통해 시스템의 상태를 읽습니다.' : 'Use metrics, diagnostic procedures, and checklists to understand how the system behaves.',
      to: '/docs/eks-best-practices/operations-reliability/eks-debugging', link: ko ? 'EKS 장애 진단 가이드' : 'EKS troubleshooting guide'},
  ];
  return <section className={styles.readingSection} aria-labelledby="reading-title"><div className={styles.readingInner}>
    <div className={styles.sectionHeading}>
      <div><span className={styles.kicker}>HOW TO READ</span><h2 id="reading-title">{ko ? '이해하고, 적용하고, 검증합니다.' : 'Understand. Apply. Verify.'}</h2></div>
      <Link className={styles.textLink} to="/docs/intro">{ko ? '읽기 경로 안내' : 'Guide to the manual'}<Arrow /></Link>
    </div>
    <div className={styles.readingGrid}>{paths.map(path => <article key={path.number} className={styles.readingStep}>
      <div className={styles.stepLabel}><span>{path.number}</span>{path.verb}</div>
      <h3>{path.title}</h3><p>{path.description}</p>
      <Link to={path.to}>{path.link}<span aria-hidden="true">→</span></Link>
    </article>)}</div>
  </div></section>;
}

function Repositories({ko}) {
  return <section className={styles.repositories} aria-labelledby="repositories-title">
    <div><span className={styles.kicker}>PUT IT INTO PRACTICE</span><h2 id="repositories-title">{ko ? '문서 옆에, 실행할 코드.' : 'The code beside the manual.'}</h2>
      <p>{ko ? '참고 아키텍처와 배포 구성을 저장소에서 확인하세요.' : 'Continue with reference architectures and deployment configurations in the repositories.'}</p></div>
    <div className={styles.repositoryLinks}>
      <Link to="https://github.com/devfloor9/ai-on-eks"><span><strong>AI on EKS</strong><small>{ko ? 'AI 워크로드 구성과 운영 예제' : 'AI workload configurations and examples'}</small></span><Arrow /></Link>
      <Link to="https://github.com/devfloor9/sample-genai-on-eks-starter-kit"><span><strong>GenAI on EKS Starter Kit</strong><small>{ko ? '플랫폼 구성 요소와 시작 가이드' : 'Platform components and a starting guide'}</small></span><Arrow /></Link>
    </div>
    <div className={styles.sourceNote}>
      <span>{ko ? '함께 고쳐가는 기술 매뉴얼' : 'An engineering manual, maintained in the open'}</span>
      <Link to="https://github.com/devfloor9/engineering-playbook">{ko ? '소스와 변경 이력' : 'Source and revision history'} ↗</Link>
      <Link to="/ai-docs">{ko ? 'AI용 문서 안내' : 'AI documentation guide'} →</Link>
    </div>
  </section>;
}

export default function Home() {
  const {i18n} = useDocusaurusContext();
  const ko = i18n.currentLocale === 'ko';
  return <Layout title="Engineering Playbook" description={ko ? 'EKS 운영, AI 플랫폼 구축, 성능 검증을 다루는 실전 엔지니어링 매뉴얼' : 'A practical engineering manual for EKS operations, AI platforms, and performance testing.'}>
    <HomeStructuredData />
    <main className={styles.home} data-ep-theme="manual"><Hero ko={ko} /><Contents ko={ko} /><ReadingPaths ko={ko} /><Repositories ko={ko} /></main>
  </Layout>;
}
