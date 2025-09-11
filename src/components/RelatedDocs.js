import React, {useState, useEffect} from 'react';
import Link from '@docusaurus/Link';
import {translate} from '@docusaurus/Translate';

const RelatedDocs = ({currentDoc, maxResults = 3}) => {
  const [relatedDocs, setRelatedDocs] = useState([]);

  useEffect(() => {
    // 관련 문서 찾기 로직
    const findRelatedDocs = () => {
      if (!currentDoc || !currentDoc.tags) {
        return [];
      }

      // 실제 구현에서는 전체 문서 목록에서 태그 기반으로 관련 문서를 찾아야 함
      // 여기서는 예시 데이터를 사용
      const mockRelatedDocs = [
        {
          title: 'EKS DNS 성능 최적화',
          path: '/docs/performance-networking/dns-optimization',
          description: 'CoreDNS 성능을 최적화하는 방법',
          tags: ['eks', 'dns', 'performance'],
          category: 'performance-networking'
        },
        {
          title: 'Cilium ENI 모드 구성',
          path: '/docs/performance-networking/cilium-eni',
          description: 'Cilium ENI 모드로 네트워크 성능 향상',
          tags: ['cilium', 'networking', 'eni'],
          category: 'performance-networking'
        },
        {
          title: 'Hubble 네트워크 가시성',
          path: '/docs/observability-monitoring/hubble-visibility',
          description: 'Hubble을 사용한 네트워크 모니터링',
          tags: ['hubble', 'monitoring', 'networking'],
          category: 'observability-monitoring'
        }
      ];

      // 현재 문서와 태그가 겹치는 문서들을 찾아서 관련도 점수 계산
      const scored = mockRelatedDocs
        .filter(doc => doc.path !== currentDoc.path)
        .map(doc => {
          const commonTags = doc.tags.filter(tag => 
            currentDoc.tags.includes(tag)
          );
          const categoryMatch = doc.category === currentDoc.category ? 2 : 0;
          const score = commonTags.length + categoryMatch;
          
          return {
            ...doc,
            score,
            commonTags
          };
        })
        .filter(doc => doc.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);

      return scored;
    };

    setRelatedDocs(findRelatedDocs());
  }, [currentDoc, maxResults]);

  if (relatedDocs.length === 0) {
    return null;
  }

  return (
    <div className="related-docs">
      <h3>관련 문서</h3>
      <div className="row">
        {relatedDocs.map((doc, index) => (
          <div key={index} className="col col--12 margin-bottom--md">
            <div className="card">
              <div className="card__body">
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '1rem'}}>
                  <div style={{flex: 1}}>
                    <h4 style={{margin: '0 0 0.5rem 0'}}>
                      <Link to={doc.path} style={{textDecoration: 'none'}}>
                        {doc.title}
                      </Link>
                    </h4>
                    <p style={{
                      margin: '0 0 0.5rem 0',
                      color: 'var(--ifm-color-emphasis-700)',
                      fontSize: '0.9rem'
                    }}>
                      {doc.description}
                    </p>
                    <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                      {doc.commonTags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          style={{
                            backgroundColor: 'var(--ifm-color-primary)',
                            color: 'white',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem'
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: getCategoryColor(doc.category),
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap'
                  }}>
                    {getCategoryName(doc.category)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 카테고리별 색상 반환
const getCategoryColor = (category) => {
  const colors = {
    'performance-networking': '#FF6B6B',
    'observability-monitoring': '#4ECDC4',
    'genai-aiml': '#45B7D1',
    'hybrid-multicloud': '#96CEB4',
    'security-compliance': '#FFEAA7'
  };
  return colors[category] || '#DDD';
};

// 카테고리 한국어 이름 반환
const getCategoryName = (category) => {
  const names = {
    'performance-networking': '성능 & 네트워킹',
    'observability-monitoring': '관찰가능성',
    'genai-aiml': 'GenAI & AI/ML',
    'hybrid-multicloud': '하이브리드 클라우드',
    'security-compliance': '보안 & 컴플라이언스'
  };
  return names[category] || category;
};

export default RelatedDocs;