import React, {useEffect, useRef, useState} from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
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

/* ── 카운트업 스탯: 뷰포트 진입 시 0 → 목표값 ── */
function CountUp({end, suffix = '', duration = 1400}) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setValue(end);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (now) => {
              const progress = Math.min((now - start) / duration, 1);
              // ease-out cubic
              const eased = 1 - Math.pow(1 - progress, 3);
              setValue(Math.round(end * eased));
              if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            observer.unobserve(entry.target);
          }
        });
      },
      {threshold: 0.4},
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

/* ── 타이핑 터미널: 명령어 순환 타이핑 애니메이션 ── */
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
    description: 'Amazon EKS 네트워킹, 컨트롤 플레인 확장, 보안 인증, Karpenter 비용 최적화, 운영 안정성',
    href: '/docs/eks-best-practices',
    icon: '🏗️',
    iconBg: '#E3F2FD',
    tags: ['EKS', 'Karpenter', 'Gateway API'],
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
    title: 'Security & Governance',
    descriptionId: 'topic.security.desc',
    description: 'Zero-Trust 네트워킹, IAM 역할 관리, 컨테이너 보안 스캐닝 자동화',
    href: '/docs/security-governance',
    icon: '🔒',
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
    size: 'third',
  },
  {
    title: 'Hybrid Infrastructure',
    descriptionId: 'topic.hybrid.desc',
    description: '온프레미스-클라우드 하이브리드 아키텍처, ROSA, 멀티 클라우드 전략',
    href: '/docs/hybrid-infrastructure',
    icon: '☁️',
    iconBg: '#E0F7FA',
    size: 'third',
  },
  {
    title: 'Benchmarks',
    descriptionId: 'topic.benchmarks.desc',
    description: '성능 벤치마크, 비용 분석, 아키텍처 비교 리포트',
    href: '/docs/benchmarks',
    icon: '📈',
    iconBg: '#FCE4EC',
    size: 'third',
  },
];

function HeroSection() {
  return (
    <section className={styles.hero}>
      {/* 애니메이션 배경: 그리드 + 글로우 오브 */}
      <div className={styles.heroGrid} aria-hidden="true" />
      <div className={`${styles.heroOrb} ${styles.heroOrbA}`} aria-hidden="true" />
      <div className={`${styles.heroOrb} ${styles.heroOrbB}`} aria-hidden="true" />
      <div className={styles.heroInner}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            <Translate id="hero.badge">Engineering Playbook</Translate>
          </div>
          <h1 className={styles.heroTitle}>
            The Engineering{' '}
            <span className={styles.heroTitleAccent}>Playbook</span>
          </h1>
          <p className={styles.heroSubtitle}>
            <Translate id="hero.subtitle">
              Amazon EKS 기반 인프라, AI/ML 워크플로우, 보안, 자동화된 운영에 대한 실전 엔지니어링 가이드
            </Translate>
          </p>
          <div className={styles.heroButtons}>
            <Link className={styles.btnPrimary} to="/docs/intro">
              <Translate id="hero.startReading">Start Reading</Translate>
              <span className={styles.btnArrow}>→</span>
            </Link>
            <Link className={styles.btnSecondary} to="/docs/agentic-ai-platform">
              <Translate id="hero.exploreTopics">Explore Topics</Translate>
            </Link>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <TypingTerminal />
        </div>
      </div>
      {/* 스탯 스트립 */}
      <div className={styles.statsStrip}>
        <div className={styles.statItem}>
          <div className={styles.statValue}>
            <CountUp end={270} suffix="+" />
          </div>
          <div className={styles.statLabel}>
            <Translate id="stats.guides">Engineering Guides</Translate>
          </div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <div className={styles.statValue}>
            <CountUp end={7} />
          </div>
          <div className={styles.statLabel}>
            <Translate id="stats.domains">Knowledge Domains</Translate>
          </div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <div className={styles.statValue}>
            <CountUp end={40} suffix="+" />
          </div>
          <div className={styles.statLabel}>
            <Translate id="stats.refarch">Reference Architectures</Translate>
          </div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <div className={styles.statValue}>KO · EN</div>
          <div className={styles.statLabel}>
            <Translate id="stats.languages">Bilingual Docs</Translate>
          </div>
        </div>
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
          <Translate id="topics.browse">Browse Guides</Translate>{' '}
          <span className={styles.btnArrow}>→</span>
        </span>
      </Link>
    </Reveal>
  );
}

function TopicsSection() {
  return (
    <section className={styles.topics}>
      <div className={styles.topicsInner}>
        <Reveal>
          <div className={styles.topicsHeader}>
            <div>
              <h2 className={styles.topicsTitle}>
                <Translate id="topics.title">Core Knowledge Domains</Translate>
              </h2>
              <p className={styles.topicsSubtitle}>
                <Translate id="topics.subtitle">
                  클라우드 엔지니어링의 핵심 영역을 깊이 있게 다루는 가이드 모음
                </Translate>
              </p>
            </div>
            <Link className={styles.viewAll} to="/docs/intro">
              <Translate id="topics.viewAll">View all modules</Translate> ↗
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
  return (
    <section className={styles.cta}>
      <Reveal>
        <div className={styles.ctaInner}>
          <div className={styles.ctaGlow} aria-hidden="true" />
          <h2 className={styles.ctaTitle}>
            <Translate id="cta.title">Ready to architect for scale?</Translate>
          </h2>
          <p className={styles.ctaSubtitle}>
            <Translate id="cta.subtitle">
              Engineering Playbook으로 더 안정적인 시스템을 구축하세요.
            </Translate>
          </p>
          <div className={styles.ctaButtons}>
            <Link className={styles.btnPrimary} to="/docs/intro">
              <Translate id="cta.getGuide">Get the Full Guide</Translate>
              <span className={styles.btnArrow}>→</span>
            </Link>
          </div>
        </div>
      </Reveal>
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
