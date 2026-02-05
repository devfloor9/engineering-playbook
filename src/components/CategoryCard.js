import React from 'react';
import Link from '@docusaurus/Link';
import {translate} from '@docusaurus/Translate';

const CategoryCard = ({category, title, description, icon, docCount, color}) => {
  const categoryInfo = {
    'performance-networking': {
      title: 'Infrastructure Optimization',
      description: 'EKS DNS optimization, Cilium ENI mode, network performance tuning',
      color: '#2e8555'
    },
    'observability-monitoring': {
      title: 'Operations & Observability',
      description: 'Hubble network visibility, AI/ML workload monitoring',
      color: '#25c2a0'
    },
    'genai-aiml': {
      title: 'Agentic AI Platform',
      description: 'Production GenAI platforms, GPU efficiency, MIG strategies',
      color: '#1877f2'
    },
    'hybrid-multicloud': {
      title: 'Hybrid Infrastructure',
      description: 'EKS hybrid nodes, cloud bursting architectures',
      color: '#f56565'
    },
    'security-compliance': {
      title: 'Security & Governance',
      description: 'ROSA network security, compliance architectures',
      color: '#ed8936'
    }
  };

  const info = categoryInfo[category] || {
    title: title || category,
    description: description || '',
    color: color || '#DDD'
  };

  return (
    <div className="col col--6 margin-bottom--lg">
      <Link 
        to={`/docs/${category}`} 
        className="card category-card"
        style={{
          textDecoration: 'none',
          height: '100%',
          transition: 'all 0.3s ease-in-out',
          border: `2px solid ${info.color}20`,
          borderRadius: '1rem'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = `0 8px 25px ${info.color}40`;
          e.currentTarget.style.borderColor = info.color;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          e.currentTarget.style.borderColor = `${info.color}20`;
        }}
      >
        <div className="card__header">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{
              margin: 0,
              color: info.color,
              fontSize: '1.2rem'
            }}>
              {info.title}
            </h3>
            {docCount && (
              <span style={{
                backgroundColor: info.color,
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '1rem',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                {docCount}개 문서
              </span>
            )}
          </div>
        </div>
        <div className="card__body">
          <p style={{
            margin: 0,
            color: 'var(--ifm-color-emphasis-700)',
            lineHeight: 1.5
          }}>
            {info.description}
          </p>
        </div>
        <div className="card__footer">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            color: info.color,
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            자세히 보기 →
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CategoryCard;