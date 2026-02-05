import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import TagList from '@site/src/components/TagList';

export default function TagEksPage() {
  const tagName = 'eks';
  const documents = [
  {
    "title": "Introduction",
    "path": "/docs/intro",
    "description": "Welcome to the Engineering Playbook - your comprehensive guide to Amazon EKS architecture and best practices",
    "tags": [
      "eks",
      "kubernetes",
      "introduction",
      "getting-started"
    ],
    "authors": []
  },
  {
    "title": "Engineering Playbook에 오신 것을 환영합니다",
    "path": "/blog/2025-01-15-welcome",
    "description": "Engineering Playbook에 오신 것을 환영합니다! 🎉\n\n안녕하세요! Engineering Playbook의 첫 번째 블로그 포스트입니다.\n\n이 플레이북은 Amazon EKS(Elastic Kubernetes Service) 관련 아키텍처 딥다이브 문서들을 체계적으로 정리한 종합 가이드입니다.\n\n 🎯 우리의 목표...",
    "tags": [
      "eks",
      "kubernetes",
      "engineering",
      "playbook"
    ],
    "authors": [
      "devfloor9"
    ]
  }
];

  return (
    <Layout
      title={`#${tagName} Tag Documentation`}
      description={`Documentation tagged with ${tagName} in the Engineering Playbook.`}
    >
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <header className="margin-bottom--xl">
              <h1>
                <span style={{
                  backgroundColor: 'var(--ifm-color-primary)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '2rem',
                  fontSize: '1.5rem'
                }}>
                  #{tagName}
                </span>
              </h1>
              <div className="margin-top--md">
                <div className="row">
                  <div className="col col--3">
                    <div className="card">
                      <div className="card__body text--center">
                        <h3 style={{color: 'var(--ifm-color-primary)', margin: 0}}>
                          2
                        </h3>
                        <p style={{margin: 0, fontSize: '0.9rem'}}>문서</p>
                      </div>
                    </div>
                  </div>
                  <div className="col col--3">
                    <div className="card">
                      <div className="card__body text--center">
                        <h3 style={{color: 'var(--ifm-color-primary)', margin: 0}}>
                          0
                        </h3>
                        <p style={{margin: 0, fontSize: '0.9rem'}}>카테고리</p>
                      </div>
                    </div>
                  </div>
                  <div className="col col--3">
                    <div className="card">
                      <div className="card__body text--center">
                        <h3 style={{color: 'var(--ifm-color-primary)', margin: 0}}>
                          0k
                        </h3>
                        <p style={{margin: 0, fontSize: '0.9rem'}}>단어</p>
                      </div>
                    </div>
                  </div>
                  <div className="col col--3">
                    <div className="card">
                      <div className="card__body text--center">
                        <h3 style={{color: 'var(--ifm-color-primary)', margin: 0}}>
                          2
                        </h3>
                        <p style={{margin: 0, fontSize: '0.9rem'}}>분 읽기</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="margin-top--md" style={{fontSize: '1.1rem'}}>
                <strong>관련 카테고리:</strong> 없음
              </p>
            </header>

            <section>
              <h2>문서 목록</h2>
              <div className="row">
                {documents.map((doc, index) => (
                  <div key={index} className="col col--12 margin-bottom--lg">
                    <div className="card">
                      <div className="card__body">
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem'}}>
                          <h3 style={{margin: 0, flex: 1}}>
                            <Link to={doc.path} style={{textDecoration: 'none'}}>
                              {doc.title}
                            </Link>
                          </h3>
                          {doc.category && (
                            <span style={{
                              backgroundColor: getCategoryColor(doc.category),
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.5rem',
                              fontSize: '0.8rem',
                              marginLeft: '1rem'
                            }}>
                              {getCategoryName(doc.category)}
                            </span>
                          )}
                        </div>
                        
                        {doc.description && (
                          <p style={{
                            color: 'var(--ifm-color-emphasis-700)',
                            marginBottom: '0.5rem'
                          }}>
                            {doc.description}
                          </p>
                        )}
                        
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.9rem',
                          color: 'var(--ifm-color-emphasis-600)'
                        }}>
                          <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                            {doc.date && (
                              <span>{new Date(doc.date).toLocaleDateString('en-US')}</span>
                            )}
                            {doc.difficulty && (
                              <span>Level: {getDifficultyName(doc.difficulty)}</span>
                            )}
                            {doc.estimatedTime && (
                              <span>Read time: {doc.estimatedTime}</span>
                            )}
                          </div>
                          <TagList tags={doc.tags.filter(t => t !== tagName)} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Helper functions
function getCategoryColor(category) {
  const colors = {
    'performance-networking': '#FF6B6B',
    'observability-monitoring': '#4ECDC4',
    'genai-aiml': '#45B7D1',
    'hybrid-multicloud': '#96CEB4',
    'security-compliance': '#FFEAA7'
  };
  return colors[category] || '#DDD';
}

function getCategoryName(category) {
  const names = {
    'performance-networking': 'Performance & Networking',
    'observability-monitoring': 'Observability & Monitoring',
    'genai-aiml': 'GenAI & AI/ML',
    'hybrid-multicloud': 'Hybrid & Multi-Cloud',
    'security-compliance': 'Security & Compliance'
  };
  return names[category] || category;
}

function getDifficultyName(difficulty) {
  const names = {
    'beginner': 'Beginner',
    'intermediate': 'Intermediate',
    'advanced': 'Advanced'
  };
  return names[difficulty] || difficulty;
}