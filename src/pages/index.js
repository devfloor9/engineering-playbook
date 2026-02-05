import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const FeatureList = [
  {
    titleId: 'homepage.features.infrastructure.title',
    title: 'Infrastructure Optimization',
    titleKo: '인프라 최적화',
    descriptionId: 'homepage.features.infrastructure.description',
    description: 'Optimize DNS performance, configure container networking modes, and implement advanced networking strategies for high-performance cloud native clusters.',
    descriptionKo: 'DNS 성능 최적화, 컨테이너 네트워킹 모드 구성, 고성능 클라우드 네이티브 클러스터를 위한 고급 네트워킹 전략을 구현합니다.',
    link: '/docs/infrastructure-optimization',
  },
  {
    titleId: 'homepage.features.observability.title',
    title: 'Operations & Observability',
    titleKo: '운영 & 옵저버빌리티',
    descriptionId: 'homepage.features.observability.description',
    description: 'Implement comprehensive monitoring solutions with Hubble network visibility, AI/ML workload monitoring, and advanced observability patterns.',
    descriptionKo: 'Hubble 네트워크 가시성, AI/ML 워크로드 모니터링, 고급 옵저버빌리티 패턴을 활용한 종합 모니터링 솔루션을 구현합니다.',
    link: '/docs/operations-observability',
  },
  {
    titleId: 'homepage.features.agentic.title',
    title: 'Agentic AI Platform',
    titleKo: 'Agentic AI 플랫폼',
    descriptionId: 'homepage.features.agentic.description',
    description: 'Build production-ready GenAI platforms, maximize GPU efficiency with MIG and time-slicing strategies for AI/ML workloads on Kubernetes.',
    descriptionKo: '프로덕션급 GenAI 플랫폼을 구축하고, Kubernetes에서 AI/ML 워크로드를 위한 MIG 및 타임슬라이싱 전략으로 GPU 효율성을 극대화합니다.',
    link: '/docs/agentic-ai-platform',
  },
  {
    titleId: 'homepage.features.hybrid.title',
    title: 'Hybrid Infrastructure',
    titleKo: '하이브리드 인프라',
    descriptionId: 'homepage.features.hybrid.description',
    description: 'Extend cloud native platforms with hybrid nodes, implement cloud bursting strategies, and manage multi-cloud architectures.',
    descriptionKo: '하이브리드 노드로 클라우드 네이티브 플랫폼을 확장하고, 클라우드 버스팅 전략을 구현하며, 멀티 클라우드 아키텍처를 관리합니다.',
    link: '/docs/hybrid-infrastructure',
  },
  {
    titleId: 'homepage.features.security.title',
    title: 'Security & Governance',
    titleKo: '보안 & 거버넌스',
    descriptionId: 'homepage.features.security.description',
    description: 'Implement network security, compliance architectures, and security best practices for enterprise cloud native deployments.',
    descriptionKo: '네트워크 보안, 컴플라이언스 아키텍처, 엔터프라이즈 클라우드 네이티브 배포를 위한 보안 모범 사례를 구현합니다.',
    link: '/docs/security-governance',
  },
];

function Feature({titleId, title, titleKo, descriptionId, description, descriptionKo, link}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="card margin-bottom--lg">
        <div className="card__body">
          <h3>
            <Translate id={titleId} description={title}>
              {titleKo}
            </Translate>
          </h3>
          <p>
            <Translate id={descriptionId} description={description}>
              {descriptionKo}
            </Translate>
          </p>
        </div>
        <div className="card__footer">
          <Link
            className="button button--primary button--block"
            to={link}>
            <Translate id="homepage.features.learnMore" description="Learn More button">
              자세히 보기
            </Translate>
          </Link>
        </div>
      </div>
    </div>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">
          <Translate id="homepage.tagline" description="Site tagline">
            클라우드 네이티브 아키텍처 & 모범 사례
          </Translate>
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            <Translate id="homepage.getStarted" description="Get Started button">
              시작하기
            </Translate>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description={translate({
        id: 'homepage.description',
        message: '클라우드 네이티브 아키텍처 종합 가이드 - 엔지니어링 모범 사례, 패턴, 구현',
        description: 'Homepage meta description',
      })}>
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              <div className="col col--12">
                <div className="text--center margin-bottom--xl">
                  <h2>
                    <Translate id="homepage.domains.title" description="Technical Domains section title">
                      기술 도메인
                    </Translate>
                  </h2>
                  <p className="lead">
                    <Translate id="homepage.domains.subtitle" description="Technical Domains section subtitle">
                      클라우드 네이티브 엔지니어링을 위한 5가지 핵심 기술 도메인의 종합 가이드를 살펴보세요.
                    </Translate>
                  </p>
                </div>
              </div>
            </div>
            <div className="row">
              {FeatureList.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.quickStart}>
          <div className="container">
            <div className="row">
              <div className="col col--8 col--offset-2">
                <div className="card">
                  <div className="card__body text--center">
                    <h2>
                      <Translate id="homepage.quickstart.title" description="Quick Start section title">
                        빠른 시작
                      </Translate>
                    </h2>
                    <p>
                      <Translate id="homepage.quickstart.description" description="Quick Start section description">
                        클라우드 네이티브 엔지니어링이 처음이신가요? 종합 소개 문서부터 시작하여 각 기술 도메인을 학습해 보세요.
                      </Translate>
                    </p>
                    <div className={styles.quickStartButtons}>
                      <Link
                        className="button button--primary margin--sm"
                        to="/docs/intro">
                        <Translate id="homepage.quickstart.button" description="Documentation button">
                          문서 보기
                        </Translate>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
