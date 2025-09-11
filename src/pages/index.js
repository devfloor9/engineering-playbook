import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const FeatureList = [
  {
    title: 'Performance & Networking',
    description: (
      <>
        Optimize EKS DNS performance, configure Cilium ENI mode, and implement 
        advanced networking strategies for high-performance Kubernetes clusters.
      </>
    ),
    link: '/docs/performance-networking',
  },
  {
    title: 'Observability & Monitoring',
    description: (
      <>
        Implement comprehensive monitoring solutions with Hubble network visibility,
        AI/ML workload monitoring, and advanced observability patterns.
      </>
    ),
    link: '/docs/observability-monitoring',
  },
  {
    title: 'GenAI & AI/ML',
    description: (
      <>
        Build production-ready GenAI platforms, maximize GPU efficiency with MIG
        and time-slicing strategies for AI/ML workloads on EKS.
      </>
    ),
    link: '/docs/genai-aiml',
  },
  {
    title: 'Hybrid & Multi-Cloud',
    description: (
      <>
        Extend EKS beyond the cloud with hybrid nodes, implement cloud bursting
        strategies, and manage multi-cloud architectures.
      </>
    ),
    link: '/docs/hybrid-multicloud',
  },
  {
    title: 'Security & Compliance',
    description: (
      <>
        Implement ROSA network security, compliance architectures, and security
        best practices for enterprise EKS deployments.
      </>
    ),
    link: '/docs/security-compliance',
  },
];

function Feature({title, description, link}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="card margin-bottom--lg">
        <div className="card__body">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <div className="card__footer">
          <Link
            className="button button--primary button--block"
            to={link}>
            Learn More
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
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Get Started
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
      description="Comprehensive EKS Architecture Deep Dive - Engineering best practices, patterns, and implementations">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              <div className="col col--12">
                <div className="text--center margin-bottom--xl">
                  <h2>Technical Domains</h2>
                  <p className="lead">
                    Explore comprehensive guides across five key technical domains for EKS engineering excellence.
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
                    <h2>Quick Start</h2>
                    <p>
                      New to EKS engineering? Start with our comprehensive introduction 
                      and work your way through the technical domains.
                    </p>
                    <div className={styles.quickStartButtons}>
                      <Link
                        className="button button--primary margin--sm"
                        to="/docs/intro">
                        Documentation
                      </Link>
                      <Link
                        className="button button--outline button--primary margin--sm"
                        to="/blog">
                        Latest Posts
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