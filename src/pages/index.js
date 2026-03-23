import React from 'react';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import styles from './index.module.css';

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
    title: 'Infrastructure Optimization',
    descriptionId: 'topic.infra.desc',
    description: 'Amazon EKS 컨트롤 플레인, 데이터 플레인, 멀티 리전 네트워킹, Karpenter 비용 최적화',
    href: '/docs/infrastructure-optimization',
    icon: '🏗️',
    iconBg: '#E3F2FD',
    tags: ['EKS', 'Karpenter', 'Networking'],
    size: 'small',
    accent: true,
  },
  {
    title: 'Operations & Observability',
    descriptionId: 'topic.ops.desc',
    description: 'Prometheus, Grafana, OpenTelemetry 기반 풀스택 관측성과 장애 대응 자동화',
    href: '/docs/operations-observability',
    icon: '📊',
    iconBg: '#E8F5E9',
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
      <div className={styles.heroInner}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
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
              <span>→</span>
            </Link>
            <Link className={styles.btnSecondary} to="/docs/agentic-ai-platform">
              <Translate id="hero.exploreTopics">Explore Topics</Translate>
            </Link>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroImageWrapper}>
            <img
              src={useBaseUrl('/img/hero-illustration.png')}
              alt="Engineers working late in office"
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
            />
            <div className={styles.heroOverlay}>
              <div className={styles.heroOverlayLabel}>Current Build</div>
              <div className={styles.heroOverlayCode}>
                eksctl create cluster --config-file=prod.yaml
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TopicCard({title, description, descriptionId, href, icon, iconBg, tags, size, accent}) {
  const sizeClass = {
    large: styles.bentoLarge,
    small: styles.bentoSmall,
    wide: styles.bentoWide,
    third: styles.bentoThird,
  }[size] || styles.bentoThird;

  return (
    <Link
      to={href}
      className={`${styles.bentoCard} ${sizeClass} ${accent ? styles.bentoAccent : ''}`}
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
        Browse Guides →
      </span>
    </Link>
  );
}

function TopicsSection() {
  return (
    <section className={styles.topics}>
      <div className={styles.topicsInner}>
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
        <div className={styles.bentoGrid}>
          {topics.map((topic) => (
            <TopicCard key={topic.title} {...topic} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className={styles.cta}>
      <div className={styles.ctaInner}>
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
          </Link>
        </div>
      </div>
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
      <HeroSection />
      <TopicsSection />
      <CTASection />
    </Layout>
  );
}
