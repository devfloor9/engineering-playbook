import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <img
          src={useBaseUrl('/img/hero-illustration.png')}
          alt="Engineering Playbook"
          className={styles.heroImage}
        />
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">
          <Translate id="homepage.tagline" description="Site tagline">
            Amazon EKS 기반 인프라, AI/ML, 보안, 운영에 대한 고객 사례 중심의 실전 엔지니어링 가이드
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
        message: 'Amazon EKS 기반 인프라, AI/ML, 보안, 운영에 대한 고객 사례 중심의 실전 엔지니어링 가이드',
        description: 'Homepage meta description',
      })}>
      <HomepageHeader />
    </Layout>
  );
}
