import React from 'react';
import Link from '@docusaurus/Link';
import {translate} from '@docusaurus/Translate';

const TagList = ({tags, showCount = false}) => {
  if (!tags || tags.length === 0) {
    return null;
  }

  // 태그별 색상 매핑
  const getTagColor = (tag) => {
    const colorMap = {
      // 기술 도메인
      'performance-networking': '#FF6B6B',
      'observability-monitoring': '#4ECDC4', 
      'genai-aiml': '#45B7D1',
      'hybrid-multicloud': '#96CEB4',
      'security-compliance': '#FFEAA7',
      
      // 핵심 기술
      'eks': '#FF9F43',
      'kubernetes': '#326CE5',
      'aws': '#FF9900',
      
      // 네트워킹
      'networking': '#6C5CE7',
      'dns': '#A29BFE',
      'cni': '#FD79A8',
      'cilium': '#00B894',
      'calico': '#0984E3',
      
      // 모니터링
      'monitoring': '#00CEC9',
      'observability': '#55A3FF',
      'prometheus': '#E17055',
      'grafana': '#F39C12',
      
      // AI/ML
      'ai': '#6C5CE7',
      'ml': '#A29BFE',
      'gpu': '#E84393',
      'genai': '#00B894',
      'llm': '#0984E3',
      
      // 보안
      'security': '#E17055',
      'rbac': '#D63031',
      'iam': '#74B9FF',
      'compliance': '#FDCB6E',
      
      // 기본 색상
      'default': '#DDD'
    };
    
    return colorMap[tag.toLowerCase()] || colorMap['default'];
  };

  return (
    <div className="tag-list">
      {tags.map((tag, index) => (
        <Link
          key={index}
          to={`/tags/${tag}`}
          className="tag-item"
          style={{
            backgroundColor: getTagColor(tag),
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.75rem',
            fontSize: '0.8rem',
            textDecoration: 'none',
            margin: '0.125rem',
            display: 'inline-block',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = 'none';
          }}
        >
          #{tag}
          {showCount && (
            <span className="tag-count" style={{marginLeft: '0.25rem', opacity: 0.8}}>
              ({/* 태그 개수는 별도 로직으로 계산 */})
            </span>
          )}
        </Link>
      ))}
    </div>
  );
};

export default TagList;