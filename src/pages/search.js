import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';

export default function SearchPage() {
  return (
    <Layout
      title="검색"
      description="EKS Engineering Playbook에서 원하는 내용을 검색하세요"
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <h1>문서 검색</h1>
            <p>
              EKS Engineering Playbook에서 원하는 내용을 검색하세요. 
              검색창에 키워드를 입력하면 관련 문서들을 찾을 수 있습니다.
            </p>
            <div className="search-tips">
              <h3>검색 팁</h3>
              <ul>
                <li><strong>키워드 검색:</strong> "EKS DNS", "Kubernetes 모니터링" 등</li>
                <li><strong>태그 검색:</strong> "performance", "security", "ai-ml" 등</li>
                <li><strong>카테고리 검색:</strong> "네트워킹", "보안", "관찰가능성" 등</li>
                <li><strong>영어/한국어:</strong> 두 언어 모두 지원</li>
              </ul>
            </div>
            <div className="search-categories">
              <h3>주요 카테고리</h3>
              <div className="row">
                <div className="col col--6">
                  <div className="card margin-bottom--md">
                    <div className="card__header">
                      <h4>🚀 Performance & Networking</h4>
                    </div>
                    <div className="card__body">
                      <p>EKS DNS 최적화, Cilium ENI 모드, 네트워크 성능 튜닝</p>
                    </div>
                  </div>
                </div>
                <div className="col col--6">
                  <div className="card margin-bottom--md">
                    <div className="card__header">
                      <h4>👁️ Observability & Monitoring</h4>
                    </div>
                    <div className="card__body">
                      <p>Hubble 네트워크 가시성, AI/ML 워크로드 모니터링</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col col--6">
                  <div className="card margin-bottom--md">
                    <div className="card__header">
                      <h4>🤖 GenAI & AI/ML</h4>
                    </div>
                    <div className="card__body">
                      <p>프로덕션 GenAI 구축, GPU 효율성, MIG 전략</p>
                    </div>
                  </div>
                </div>
                <div className="col col--6">
                  <div className="card margin-bottom--md">
                    <div className="card__header">
                      <h4>🌐 Hybrid & Multi-Cloud</h4>
                    </div>
                    <div className="card__body">
                      <p>EKS 하이브리드 노드, 클라우드 버스팅</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col col--6">
                  <div className="card margin-bottom--md">
                    <div className="card__header">
                      <h4>🔒 Security & Compliance</h4>
                    </div>
                    <div className="card__body">
                      <p>ROSA 네트워크 보안, 컴플라이언스 아키텍처</p>
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