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
    description: 'Gateway API adoption, CoreDNS optimization, Cilium CNI networking, Karpenter autoscaling, East-West traffic optimization, and cost management.',
    descriptionKo: 'Gateway API 도입, CoreDNS 최적화, Cilium CNI 네트워킹, Karpenter 오토스케일링, East-West 트래픽 최적화, 비용 관리 전략을 다룹니다.',
    link: '/docs/infrastructure-optimization',
  },
  {
    titleId: 'homepage.features.observability.title',
    title: 'Operations & Observability',
    titleKo: '운영 & 옵저버빌리티',
    descriptionId: 'homepage.features.observability.description',
    description: 'GitOps cluster operations, node monitoring, EKS debugging, high availability architecture, Pod health lifecycle, and scheduling strategies.',
    descriptionKo: 'GitOps 클러스터 운영, 노드 모니터링, EKS 장애 진단, 고가용성 아키텍처, Pod 헬스체크 라이프사이클, 스케줄링 전략을 다룹니다.',
    link: '/docs/operations-observability',
  },
  {
    titleId: 'homepage.features.agentic.title',
    title: 'Agentic AI Platform',
    titleKo: 'Agentic AI 플랫폼',
    descriptionId: 'homepage.features.agentic.description',
    description: 'Production GenAI platform with vLLM/MoE serving, llm-d distributed inference, Inference Gateway, Milvus RAG, Kagent AI agents, and MLOps pipelines.',
    descriptionKo: 'vLLM/MoE 모델 서빙, llm-d 분산 추론, Inference Gateway, Milvus RAG, Kagent AI 에이전트, MLOps 파이프라인 등 프로덕션 GenAI 플랫폼을 다룹니다.',
    link: '/docs/agentic-ai-platform',
  },
  {
    titleId: 'homepage.features.aiops.title',
    title: 'AIOps & AIDLC',
    titleKo: 'AIOps & AIDLC',
    descriptionId: 'homepage.features.aiops.description',
    description: 'AIOps strategies for EKS, intelligent observability stack with ADOT/AMP/AMG, AIDLC framework with Kiro and MCP, predictive scaling and auto-recovery.',
    descriptionKo: 'EKS AIOps 전략, ADOT/AMP/AMG 지능형 관찰성 스택, Kiro + MCP 기반 AIDLC 프레임워크, 예측 스케일링 및 자동 복구 패턴을 다룹니다.',
    link: '/docs/aiops-aidlc',
  },
  {
    titleId: 'homepage.features.hybrid.title',
    title: 'Hybrid Infrastructure',
    titleKo: '하이브리드 인프라',
    descriptionId: 'homepage.features.hybrid.description',
    description: 'Hybrid nodes adoption, SR-IOV DGX H200 high-performance networking, shared file storage, and Harbor container registry integration.',
    descriptionKo: '하이브리드 노드 도입, SR-IOV DGX H200 고성능 네트워킹, 공유 파일 스토리지, Harbor 컨테이너 레지스트리 통합을 다룹니다.',
    link: '/docs/hybrid-infrastructure',
  },
  {
    titleId: 'homepage.features.security.title',
    title: 'Security & Governance',
    titleKo: '보안 & 거버넌스',
    descriptionId: 'homepage.features.security.description',
    description: 'Identity-First Security, GuardDuty threat detection, Kyverno policy management, supply chain security for enterprise Kubernetes.',
    descriptionKo: 'Identity-First Security, GuardDuty 위협 탐지, Kyverno 정책 관리, 소프트웨어 공급망 보안 등 엔터프라이즈 Kubernetes 보안을 다룹니다.',
    link: '/docs/security-governance',
  },
  {
    titleId: 'homepage.features.rosa.title',
    title: 'ROSA (OpenShift on AWS)',
    titleKo: 'ROSA (OpenShift on AWS)',
    descriptionId: 'homepage.features.rosa.description',
    description: 'Red Hat OpenShift Service on AWS installation guide, security configuration, and compliance management.',
    descriptionKo: 'Red Hat OpenShift Service on AWS 설치 가이드, 보안 구성, 컴플라이언스 관리를 다룹니다.',
    link: '/docs/rosa',
  },
  {
    titleId: 'homepage.features.benchmarks.title',
    title: 'Benchmark Reports',
    titleKo: '벤치마크 리포트',
    descriptionId: 'homepage.features.benchmarks.description',
    description: 'Quantitative performance benchmarks: CNI comparison (Cilium vs VPC CNI), Gateway API implementations, AI/ML workloads, and infrastructure performance.',
    descriptionKo: '정량적 성능 벤치마크: CNI 비교 (Cilium vs VPC CNI), Gateway API 구현체, AI/ML 워크로드, 인프라 성능 벤치마크 리포트를 제공합니다.',
    link: '/docs/benchmarks',
  },
];

function Feature({titleId, title, titleKo, descriptionId, description, descriptionKo, link}) {
  return (
    <div className={clsx('col col--3')}>
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
            클라우드 네이티브 아키텍처 엔지니어링 플레이북 & 벤치마크 리포트
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
        message: '클라우드 네이티브 아키텍처 엔지니어링 플레이북 & 벤치마크 리포트 — EKS 인프라 최적화, Agentic AI, AIOps, 성능 벤치마크',
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
                      기술 도메인 & 벤치마크
                    </Translate>
                  </h2>
                  <p className="lead">
                    <Translate id="homepage.domains.subtitle" description="Technical Domains section subtitle">
                      일곱 가지 핵심 기술 도메인과 정량적 벤치마크 리포트로 구성된 종합 가이드를 살펴보세요.
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
                        클라우드 네이티브 엔지니어링이 처음이신가요? 소개 문서에서 전체 구성을 확인하고, 벤치마크 리포트로 데이터 기반 의사결정을 시작하세요.
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
                      <Link
                        className="button button--outline button--primary margin--sm"
                        to="/docs/benchmarks">
                        <Translate id="homepage.quickstart.benchmarks" description="Benchmarks button">
                          벤치마크 보기
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
