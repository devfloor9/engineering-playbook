import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Performance & Networking',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        EKS DNS 성능 최적화, Cilium ENI 모드, CoreDNS 모니터링 등 
        네트워크 성능 향상을 위한 실전 가이드를 제공합니다.
      </>
    ),
  },
  {
    title: 'Observability & Monitoring',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Hubble을 통한 네트워크 가시성 확보, AI/ML 워크로드 모니터링, 
        Langfuse 통합 등 관찰 가능성 구현 방법을 다룹니다.
      </>
    ),
  },
  {
    title: 'GenAI & AI/ML',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        프로덕션 레디 GenAI 구축, GPU 효율성 극대화, MIG 및 Time-Slicing 전략 등 
        AI/ML 워크로드 최적화 기법을 소개합니다.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}