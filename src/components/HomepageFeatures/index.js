import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: '🚀 Performance & Networking',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        EKS DNS 성능 최적화, Cilium ENI 모드, CoreDNS 모니터링 등 
        네트워크 성능 향상을 위한 실전 가이드를 제공합니다.
      </>
    ),
    link: '/docs/performance-networking',
  },
  {
    title: '👁️ Observability & Monitoring',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Hubble을 통한 네트워크 가시성 확보, AI/ML 워크로드 모니터링, 
        Langfuse 통합 등 관찰 가능성 구현 방법을 다룹니다.
      </>
    ),
    link: '/docs/observability-monitoring',
  },
  {
    title: '🤖 GenAI & AI/ML',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        프로덕션 레디 GenAI 구축, GPU 효율성 극대화, MIG 및 Time-Slicing 전략 등 
        AI/ML 워크로드 최적화 기법을 소개합니다.
      </>
    ),
    link: '/docs/genai-aiml',
  },
  {
    title: '🌐 Hybrid & Multi-Cloud',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        EKS를 클라우드 너머로 확장, 하이브리드 워크로드 스케일링, 
        멀티클라우드 아키텍처 구현 방법을 다룹니다.
      </>
    ),
    link: '/docs/hybrid-multicloud',
  },
  {
    title: '🔒 Security & Compliance',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        ROSA 네트워크 보안 컴플라이언스, 보안 아키텍처 모범 사례, 
        컴플라이언스 구현 가이드를 제공합니다.
      </>
    ),
    link: '/docs/security-compliance',
  },
];

function Feature({Svg, title, description, link}) {
  return (
    <div className={clsx('col col--4')}>
      <Link to={link} className="category-card" style={{display: 'block', textDecoration: 'none'}}>
        <div className="text--center">
          <Svg className={styles.featureSvg} role="img" />
        </div>
        <div className="text--center padding-horiz--md">
          <Heading as="h3">{title}</Heading>
          <p>{description}</p>
        </div>
      </Link>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="text--center margin-bottom--lg">
          <Heading as="h2">5개 핵심 기술 도메인</Heading>
          <p>EKS 아키텍처의 모든 측면을 다루는 종합 가이드</p>
        </div>
        <div className="row">
          {FeatureList.slice(0, 3).map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
        <div className="row">
          <div className="col col--2"></div>
          {FeatureList.slice(3).map((props, idx) => (
            <Feature key={idx + 3} {...props} />
          ))}
          <div className="col col--2"></div>
        </div>
      </div>
    </section>
  );
}