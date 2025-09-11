import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';

export default function SearchPage() {
  return (
    <Layout
      title="Search"
      description="Search the EKS Engineering Playbook for technical documentation and guides"
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <h1>Search Documentation</h1>
            <p>
              Find technical guides, best practices, and implementation details 
              across all EKS engineering domains.
            </p>
            <div className="search-tips">
              <h3>Search Tips</h3>
              <ul>
                <li><strong>Keywords:</strong> "EKS DNS", "Kubernetes monitoring", "GPU optimization"</li>
                <li><strong>Tags:</strong> "performance", "security", "ai-ml", "networking"</li>
                <li><strong>Categories:</strong> Search within specific technical domains</li>
                <li><strong>Languages:</strong> Content available in Korean and English</li>
              </ul>
            </div>
            <div className="search-categories">
              <h3>Technical Domains</h3>
              <div className="row">
                <div className="col col--6">
                  <div className="card margin-bottom--md">
                    <div className="card__header">
                      <h4>Performance & Networking</h4>
                    </div>
                    <div className="card__body">
                      <p>EKS DNS optimization, Cilium ENI mode, network performance tuning</p>
                    </div>
                  </div>
                </div>
                <div className="col col--6">
                  <div className="card margin-bottom--md">
                    <div className="card__header">
                      <h4>Observability & Monitoring</h4>
                    </div>
                    <div className="card__body">
                      <p>Hubble network visibility, AI/ML workload monitoring</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col col--6">
                  <div className="card margin-bottom--md">
                    <div className="card__header">
                      <h4>GenAI & AI/ML</h4>
                    </div>
                    <div className="card__body">
                      <p>Production GenAI platforms, GPU efficiency, MIG strategies</p>
                    </div>
                  </div>
                </div>
                <div className="col col--6">
                  <div className="card margin-bottom--md">
                    <div className="card__header">
                      <h4>Hybrid & Multi-Cloud</h4>
                    </div>
                    <div className="card__body">
                      <p>EKS hybrid nodes, cloud bursting architectures</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col col--6">
                  <div className="card margin-bottom--md">
                    <div className="card__header">
                      <h4>Security & Compliance</h4>
                    </div>
                    <div className="card__body">
                      <p>ROSA network security, compliance architectures</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}