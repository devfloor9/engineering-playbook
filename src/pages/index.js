import React, {useEffect, useRef, useState} from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

// 홈페이지에 schema.org WebSite + Organization JSON-LD를 주입한다.
function HomeStructuredData() {
  const {siteConfig} = useDocusaurusContext();
  const siteUrl = siteConfig.url + siteConfig.baseUrl.replace(/\/$/, '');
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteConfig.title,
      url: siteUrl,
      description: siteConfig.tagline,
      inLanguage: siteConfig.i18n.defaultLocale,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteConfig.title,
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/img/logo.svg`,
      },
      sameAs: ['https://github.com/devfloor9/engineering-playbook'],
    },
  ];
  return (
    <Head>
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Head>
  );
}

/* ── Scroll reveal: IntersectionObserver로 뷰포트 진입 시 애니메이션 ── */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      el.classList.add(styles.revealed);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealed);
            observer.unobserve(entry.target);
          }
        });
      },
      {threshold: 0.12},
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function Reveal({children, delay = 0, className = ''}) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${className}`}
      style={{transitionDelay: `${delay}ms`}}
    >
      {children}
    </div>
  );
}

// Decorative implementation preview below the reading paths.
const TERMINAL_LINES = [
  {cmd: 'eksctl create cluster --config-file=prod.yaml', out: '✓ EKS cluster "prod" ready · 3 nodes'},
  {cmd: 'kubectl apply -f vllm-deployment.yaml', out: '✓ deployment.apps/vllm-llama4 created'},
  {cmd: 'helm install kgateway kgateway/kgateway', out: '✓ 2-Tier AI Gateway deployed'},
  {cmd: 'karpenter get nodepools', out: '✓ gpu-pool · p5.48xlarge · spot 68% saved'},
];

function TypingTerminal() {
  const [lineIdx, setLineIdx] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showOutput, setShowOutput] = useState(false);
  const [history, setHistory] = useState([]);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedRef.current) {
      // 모션 최소화: 전체 히스토리를 정적으로 표시
      setHistory(TERMINAL_LINES.slice(0, 3));
      setLineIdx(3);
      setCharCount(TERMINAL_LINES[3].cmd.length);
      setShowOutput(true);
    }
  }, []);

  useEffect(() => {
    if (reducedRef.current) return undefined;
    const line = TERMINAL_LINES[lineIdx];
    if (charCount < line.cmd.length) {
      const t = setTimeout(() => setCharCount((c) => c + 1), 38);
      return () => clearTimeout(t);
    }
    if (!showOutput) {
      const t = setTimeout(() => setShowOutput(true), 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setHistory((h) => [...h.slice(-2), line]);
      setLineIdx((i) => (i + 1) % TERMINAL_LINES.length);
      setCharCount(0);
      setShowOutput(false);
    }, 2200);
    return () => clearTimeout(t);
  }, [charCount, showOutput, lineIdx]);

  const current = TERMINAL_LINES[lineIdx];

  return (
    <div className={styles.terminal}>
      <div className={styles.terminalBar}>
        <span className={styles.terminalDot} style={{background: '#FF5F57'}} />
        <span className={styles.terminalDot} style={{background: '#FEBC2E'}} />
        <span className={styles.terminalDot} style={{background: '#28C840'}} />
        <span className={styles.terminalTitle}>playbook — zsh</span>
      </div>
      <div className={styles.terminalBody}>
        {history.map((line, i) => (
          <div key={`${line.cmd}-${i}`} className={styles.terminalHistory}>
            <div className={styles.terminalLine}>
              <span className={styles.terminalPrompt}>$</span> {line.cmd}
            </div>
            <div className={styles.terminalOutput}>{line.out}</div>
          </div>
        ))}
        <div className={styles.terminalLine}>
          <span className={styles.terminalPrompt}>$</span>{' '}
          {current.cmd.slice(0, charCount)}
          <span className={styles.terminalCursor} />
        </div>
        {showOutput && (
          <div className={`${styles.terminalOutput} ${styles.terminalOutputNew}`}>
            {current.out}
          </div>
        )}
      </div>
    </div>
  );
}

const topics = [
  {
    title: 'Agentic AI Platform',
    descriptionId: 'topic.agentic.desc',
    description: 'EKS 기반 Agentic AI 플랫폼 설계, 2-Tier Gateway, Knowledge Feature Store, 모델 서빙, MLOps 파이프라인',
    href: '/docs/agentic-ai-platform',
    icon: '🧠',
    iconBg: '#EDE7F6',
    tags: ['EKS', 'vLLM', 'Bifrost', 'AgentCore'],
    size: 'large',
  },
  {
    title: 'EKS Best Practices',
    descriptionId: 'topic.eks.desc',
    description: 'Amazon EKS 네트워킹, 컨트롤 플레인 확장, 보안 & 거버넌스, Karpenter 비용 최적화, 운영 안정성',
    href: '/docs/eks-best-practices',
    icon: '🏗️',
    iconBg: '#E3F2FD',
    tags: ['EKS', 'Karpenter', 'Security'],
    size: 'small',
    accent: true,
  },
  {
    title: 'ROSA (OpenShift on AWS)',
    descriptionId: 'topic.rosa.desc',
    description: 'Red Hat OpenShift on AWS 설치, 보안 컴플라이언스, 엔터프라이즈 운영 가이드',
    href: '/docs/rosa',
    icon: '🔴',
    iconBg: '#FFEBEE',
    size: 'wide',
  },
  {
    title: 'AIDLC',
    descriptionId: 'topic.aidlc.desc',
    description: 'AI 주도 개발 방법론, Intent→Unit→Bolt 모델, DDD 통합',
    href: '/docs/aidlc',
    icon: '🧠',
    iconBg: '#E3F2FD',
    size: 'wide',
  },
  {
    title: 'EKS Hybrid Nodes',
    descriptionId: 'topic.hybrid.desc',
    description: 'EKS Hybrid Nodes Best Practices — 네트워킹·보안·스토리지·GPU·운영 레퍼런스 가이드',
    href: '/docs/eks-hybrid-nodes',
    icon: '☁️',
    iconBg: '#E0F7FA',
    size: 'wide',
  },
  {
    title: 'Benchmarks',
    descriptionId: 'topic.benchmarks.desc',
    description: '성능 벤치마크, 비용 분석, 아키텍처 비교 리포트',
    href: '/docs/benchmarks',
    icon: '📈',
    iconBg: '#FCE4EC',
    size: 'wide',
  },
  {
    title: 'Industry Solutions',
    descriptionId: 'topic.industry.desc',
    description: '산업별 요구사항과 활용 시나리오를 다루는 구현 가이드',
    href: '/docs/industry-solutions', icon: '◇', iconBg: '#EDE7F6', size: 'wide',
  },
];

function HeroSection() {
  const {i18n} = useDocusaurusContext();
  const ko = i18n.currentLocale === 'ko';
  const searchUrl = useBaseUrl('/search/');
  const paths = [
    {to: '/docs/eks-best-practices/operations-reliability/eks-debugging', title: ko ? 'EKS 운영 문제 해결' : 'Troubleshoot EKS'},
    {to: '/docs/agentic-ai-platform/model-serving', title: ko ? 'AI 추론 환경 구축' : 'Build an inference platform'},
    {to: '/docs/agentic-ai-platform/design-architecture/platform-selection/ai-platform-decision-framework', title: ko ? '아키텍처 비교' : 'Compare architectures'},
    {to: 'https://github.com/devfloor9/sample-genai-on-eks-starter-kit', title: ko ? 'Starter Kit 시작 ↗' : 'Start with the starter kit ↗'},
  ];
  return (
    <section className={styles.readingHero}>
      <div className={styles.readingHeroInner}>
        <span className={styles.eyebrow}>{ko ? '설계 · 구축 · 운영' : 'Design · Build · Operate'}</span>
        <h1>Engineering <span>Playbook</span></h1>
        <p>{ko ? 'Amazon EKS 운영과 AI 플랫폼 구축에 필요한 설계 근거, 설정, 검증 방법을 찾습니다.' : 'Find architecture decisions, configuration examples, and validation steps for Amazon EKS and AI platforms.'}</p>
        <form role="search" action={searchUrl} method="get" className={styles.homeSearch}>
          <label htmlFor="home-search">{ko ? '어떤 문서가 필요한가요?' : 'What are you working on?'}</label>
          <div>
            <input id="home-search" type="search" name="q" required placeholder={ko ? 'CoreDNS, KV Cache, 장애 진단…' : 'CoreDNS, KV cache, troubleshooting…'} />
            <button type="submit">{ko ? '검색' : 'Search'}</button>
          </div>
        </form>
        <nav className={styles.startingPaths} aria-label={ko ? '목적별 시작 경로' : 'Starting paths'}>
          {paths.map(path => <Link key={path.to} to={path.to}>{path.title}<span aria-hidden="true">→</span></Link>)}
        </nav>
      </div>
    </section>
  );
}

function TopicCard({title, description, descriptionId, href, icon, iconBg, tags, size, accent, index}) {
  const sizeClass = {
    large: styles.bentoLarge,
    small: styles.bentoSmall,
    wide: styles.bentoWide,
    third: styles.bentoThird,
  }[size] || styles.bentoThird;

  return (
    <Reveal delay={index * 70} className={sizeClass}>
      <Link
        to={href}
        className={`${styles.bentoCard} ${accent ? styles.bentoAccent : ''}`}
      >
        <div
          className={styles.bentoIcon}
          style={{background: accent ? 'rgba(255,255,255,0.15)' : iconBg}}
        >
          {icon}
        </div>
        <h3 className={styles.bentoCardTitle}>{title}</h3>
        <p className={styles.bentoDescription}>
          <Translate id={descriptionId}>{description}</Translate>
        </p>
        {tags && (
          <div className={styles.bentoTags}>
            {tags.map((tag) => (
              <span key={tag} className={styles.bentoTag}>{tag}</span>
            ))}
          </div>
        )}
        <span className={styles.bentoLink}>
          <Translate id="topics.browse">문서 보기</Translate>{' '}
          <span className={styles.btnArrow}>→</span>
        </span>
      </Link>
    </Reveal>
  );
}

function TopicsSection() {
  return (
    <section id="topics" className={styles.topics}>
      <div className={styles.topicsInner}>
        <Reveal>
          <div className={styles.topicsHeader}>
            <div>
              <h2 className={styles.topicsTitle}>
                <Translate id="topics.title">주제별 문서</Translate>
              </h2>
              <p className={styles.topicsSubtitle}>
                <Translate id="topics.subtitle">
                  클라우드 엔지니어링의 핵심 영역을 깊이 있게 다루는 가이드 모음
                </Translate>
              </p>
            </div>
            <Link className={styles.viewAll} to="/docs/intro">
              <Translate id="topics.viewAll">전체 문서 안내</Translate> →
            </Link>
          </div>
        </Reveal>
        <div className={styles.bentoGrid}>
          {topics.map((topic, i) => (
            <TopicCard key={topic.title} {...topic} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const {i18n} = useDocusaurusContext();
  const ko = i18n.currentLocale === 'ko';
  return (
    <section className={styles.referenceSection}>
      <div>
        <h2>{ko ? '문서에서 구현으로' : 'From documentation to implementation'}</h2>
        <p>{ko ? '구현 예제와 배포 구성을 함께 확인할 수 있습니다.' : 'Continue with deployment configurations and implementation examples.'}</p>
        <div className={styles.referenceLinks}>
          <Link to="https://github.com/devfloor9/ai-on-eks">AI on EKS ↗</Link>
          <Link to="https://github.com/devfloor9/sample-genai-on-eks-starter-kit">GenAI on EKS Starter Kit ↗</Link>
          <Link to="/docs/intro">{ko ? '추천 읽기 경로' : 'Suggested reading paths'} →</Link>
        </div>
        <p className={styles.referenceMeta}>{ko ? `${topics.length}개 주제 · 한국어 / English` : `${topics.length} topics · Korean / English`}</p>
      </div>
      <div className={styles.referenceTerminal} aria-hidden="true"><TypingTerminal /></div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description={translate({
        id: 'homepage.description',
        message: 'Amazon EKS 기반 인프라, AI/ML, 보안, 운영에 대한 실전 엔지니어링 가이드',
      })}>
      <HomeStructuredData />
      <HeroSection />
      <TopicsSection />
      <CTASection />
    </Layout>
  );
}
