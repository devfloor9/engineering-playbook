import React, {useState} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function TagsIndexPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const tagStats = {
  "eks": {
    "count": 2,
    "documents": [
      {
        "fullPath": "/home/ec2-user/engineering-playbook/docs/intro.md",
        "relativePath": "intro.md",
        "name": "intro.md",
        "metadata": {
          "title": "Introduction",
          "description": "Welcome to the EKS Engineering Playbook - your comprehensive guide to Amazon EKS architecture and best practices",
          "tags": [
            "eks",
            "kubernetes",
            "introduction",
            "getting-started"
          ],
          "wordCount": 305,
          "excerpt": "EKS Engineering Playbook\n\nWelcome to the EKS Engineering Playbook - a comprehensive collection of technical guides, best practices, and architectural patterns for Amazon Elastic Kubernetes Serv..."
        },
        "path": "/docs/intro",
        "type": "doc"
      },
      {
        "fullPath": "/home/ec2-user/engineering-playbook/blog/2025-01-15-welcome.md",
        "relativePath": "2025-01-15-welcome.md",
        "name": "2025-01-15-welcome.md",
        "metadata": {
          "slug": "welcome",
          "title": "EKS Engineering Playbook에 오신 것을 환영합니다",
          "authors": [
            "devfloor9"
          ],
          "tags": [
            "eks",
            "kubernetes",
            "engineering",
            "playbook"
          ],
          "wordCount": 181,
          "excerpt": "EKS Engineering Playbook에 오신 것을 환영합니다! 🎉\n\n안녕하세요! EKS Engineering Playbook의 첫 번째 블로그 포스트입니다.\n\n이 플레이북은 Amazon EKS(Elastic Kubernetes Service) 관련 아키텍처 딥다이브 문서들을 체계적으로 정리한 종합 가이드입니다.\n\n 🎯 우리의 목표..."
        },
        "path": "/blog/2025-01-15-welcome",
        "type": "blog"
      }
    ],
    "categories": [],
    "totalWords": 486
  },
  "kubernetes": {
    "count": 2,
    "documents": [
      {
        "fullPath": "/home/ec2-user/engineering-playbook/docs/intro.md",
        "relativePath": "intro.md",
        "name": "intro.md",
        "metadata": {
          "title": "Introduction",
          "description": "Welcome to the EKS Engineering Playbook - your comprehensive guide to Amazon EKS architecture and best practices",
          "tags": [
            "eks",
            "kubernetes",
            "introduction",
            "getting-started"
          ],
          "wordCount": 305,
          "excerpt": "EKS Engineering Playbook\n\nWelcome to the EKS Engineering Playbook - a comprehensive collection of technical guides, best practices, and architectural patterns for Amazon Elastic Kubernetes Serv..."
        },
        "path": "/docs/intro",
        "type": "doc"
      },
      {
        "fullPath": "/home/ec2-user/engineering-playbook/blog/2025-01-15-welcome.md",
        "relativePath": "2025-01-15-welcome.md",
        "name": "2025-01-15-welcome.md",
        "metadata": {
          "slug": "welcome",
          "title": "EKS Engineering Playbook에 오신 것을 환영합니다",
          "authors": [
            "devfloor9"
          ],
          "tags": [
            "eks",
            "kubernetes",
            "engineering",
            "playbook"
          ],
          "wordCount": 181,
          "excerpt": "EKS Engineering Playbook에 오신 것을 환영합니다! 🎉\n\n안녕하세요! EKS Engineering Playbook의 첫 번째 블로그 포스트입니다.\n\n이 플레이북은 Amazon EKS(Elastic Kubernetes Service) 관련 아키텍처 딥다이브 문서들을 체계적으로 정리한 종합 가이드입니다.\n\n 🎯 우리의 목표..."
        },
        "path": "/blog/2025-01-15-welcome",
        "type": "blog"
      }
    ],
    "categories": [],
    "totalWords": 486
  },
  "introduction": {
    "count": 1,
    "documents": [
      {
        "fullPath": "/home/ec2-user/engineering-playbook/docs/intro.md",
        "relativePath": "intro.md",
        "name": "intro.md",
        "metadata": {
          "title": "Introduction",
          "description": "Welcome to the EKS Engineering Playbook - your comprehensive guide to Amazon EKS architecture and best practices",
          "tags": [
            "eks",
            "kubernetes",
            "introduction",
            "getting-started"
          ],
          "wordCount": 305,
          "excerpt": "EKS Engineering Playbook\n\nWelcome to the EKS Engineering Playbook - a comprehensive collection of technical guides, best practices, and architectural patterns for Amazon Elastic Kubernetes Serv..."
        },
        "path": "/docs/intro",
        "type": "doc"
      }
    ],
    "categories": [],
    "totalWords": 305
  },
  "getting-started": {
    "count": 1,
    "documents": [
      {
        "fullPath": "/home/ec2-user/engineering-playbook/docs/intro.md",
        "relativePath": "intro.md",
        "name": "intro.md",
        "metadata": {
          "title": "Introduction",
          "description": "Welcome to the EKS Engineering Playbook - your comprehensive guide to Amazon EKS architecture and best practices",
          "tags": [
            "eks",
            "kubernetes",
            "introduction",
            "getting-started"
          ],
          "wordCount": 305,
          "excerpt": "EKS Engineering Playbook\n\nWelcome to the EKS Engineering Playbook - a comprehensive collection of technical guides, best practices, and architectural patterns for Amazon Elastic Kubernetes Serv..."
        },
        "path": "/docs/intro",
        "type": "doc"
      }
    ],
    "categories": [],
    "totalWords": 305
  },
  "algolia": {
    "count": 1,
    "documents": [
      {
        "fullPath": "/home/ec2-user/engineering-playbook/docs/setup/algolia-search-setup.md",
        "relativePath": "setup/algolia-search-setup.md",
        "name": "algolia-search-setup.md",
        "metadata": {
          "title": "Algolia 검색 설정 가이드",
          "description": "EKS Engineering Playbook에서 Algolia DocSearch를 설정하고 관리하는 방법을 설명합니다.",
          "tags": [
            "algolia",
            "search",
            "docusaurus",
            "setup"
          ],
          "category": "setup",
          "date": "2025-01-15",
          "authors": [
            "devfloor9"
          ],
          "difficulty": "intermediate",
          "estimated_time": "30분",
          "wordCount": 750,
          "excerpt": "Algolia 검색 설정 가이드\n\n이 가이드는 EKS Engineering Playbook에서 Algolia DocSearch를 설정하고 관리하는 방법을 설명합니다.\n\n 개요\n\nAlgolia DocSearch는 문서 사이트를 위한 강력한 검색 솔루션입니다. 이 플레이북에서는 다음과 같은 검색 기능을 제공합니다:\n\n- 실시간 검색 결과\n- 다국어 지..."
        },
        "path": "/docs/setup/algolia-search-setup",
        "type": "doc"
      }
    ],
    "categories": [
      "setup"
    ],
    "totalWords": 750
  },
  "search": {
    "count": 1,
    "documents": [
      {
        "fullPath": "/home/ec2-user/engineering-playbook/docs/setup/algolia-search-setup.md",
        "relativePath": "setup/algolia-search-setup.md",
        "name": "algolia-search-setup.md",
        "metadata": {
          "title": "Algolia 검색 설정 가이드",
          "description": "EKS Engineering Playbook에서 Algolia DocSearch를 설정하고 관리하는 방법을 설명합니다.",
          "tags": [
            "algolia",
            "search",
            "docusaurus",
            "setup"
          ],
          "category": "setup",
          "date": "2025-01-15",
          "authors": [
            "devfloor9"
          ],
          "difficulty": "intermediate",
          "estimated_time": "30분",
          "wordCount": 750,
          "excerpt": "Algolia 검색 설정 가이드\n\n이 가이드는 EKS Engineering Playbook에서 Algolia DocSearch를 설정하고 관리하는 방법을 설명합니다.\n\n 개요\n\nAlgolia DocSearch는 문서 사이트를 위한 강력한 검색 솔루션입니다. 이 플레이북에서는 다음과 같은 검색 기능을 제공합니다:\n\n- 실시간 검색 결과\n- 다국어 지..."
        },
        "path": "/docs/setup/algolia-search-setup",
        "type": "doc"
      }
    ],
    "categories": [
      "setup"
    ],
    "totalWords": 750
  },
  "docusaurus": {
    "count": 1,
    "documents": [
      {
        "fullPath": "/home/ec2-user/engineering-playbook/docs/setup/algolia-search-setup.md",
        "relativePath": "setup/algolia-search-setup.md",
        "name": "algolia-search-setup.md",
        "metadata": {
          "title": "Algolia 검색 설정 가이드",
          "description": "EKS Engineering Playbook에서 Algolia DocSearch를 설정하고 관리하는 방법을 설명합니다.",
          "tags": [
            "algolia",
            "search",
            "docusaurus",
            "setup"
          ],
          "category": "setup",
          "date": "2025-01-15",
          "authors": [
            "devfloor9"
          ],
          "difficulty": "intermediate",
          "estimated_time": "30분",
          "wordCount": 750,
          "excerpt": "Algolia 검색 설정 가이드\n\n이 가이드는 EKS Engineering Playbook에서 Algolia DocSearch를 설정하고 관리하는 방법을 설명합니다.\n\n 개요\n\nAlgolia DocSearch는 문서 사이트를 위한 강력한 검색 솔루션입니다. 이 플레이북에서는 다음과 같은 검색 기능을 제공합니다:\n\n- 실시간 검색 결과\n- 다국어 지..."
        },
        "path": "/docs/setup/algolia-search-setup",
        "type": "doc"
      }
    ],
    "categories": [
      "setup"
    ],
    "totalWords": 750
  },
  "setup": {
    "count": 1,
    "documents": [
      {
        "fullPath": "/home/ec2-user/engineering-playbook/docs/setup/algolia-search-setup.md",
        "relativePath": "setup/algolia-search-setup.md",
        "name": "algolia-search-setup.md",
        "metadata": {
          "title": "Algolia 검색 설정 가이드",
          "description": "EKS Engineering Playbook에서 Algolia DocSearch를 설정하고 관리하는 방법을 설명합니다.",
          "tags": [
            "algolia",
            "search",
            "docusaurus",
            "setup"
          ],
          "category": "setup",
          "date": "2025-01-15",
          "authors": [
            "devfloor9"
          ],
          "difficulty": "intermediate",
          "estimated_time": "30분",
          "wordCount": 750,
          "excerpt": "Algolia 검색 설정 가이드\n\n이 가이드는 EKS Engineering Playbook에서 Algolia DocSearch를 설정하고 관리하는 방법을 설명합니다.\n\n 개요\n\nAlgolia DocSearch는 문서 사이트를 위한 강력한 검색 솔루션입니다. 이 플레이북에서는 다음과 같은 검색 기능을 제공합니다:\n\n- 실시간 검색 결과\n- 다국어 지..."
        },
        "path": "/docs/setup/algolia-search-setup",
        "type": "doc"
      }
    ],
    "categories": [
      "setup"
    ],
    "totalWords": 750
  },
  "engineering": {
    "count": 1,
    "documents": [
      {
        "fullPath": "/home/ec2-user/engineering-playbook/blog/2025-01-15-welcome.md",
        "relativePath": "2025-01-15-welcome.md",
        "name": "2025-01-15-welcome.md",
        "metadata": {
          "slug": "welcome",
          "title": "EKS Engineering Playbook에 오신 것을 환영합니다",
          "authors": [
            "devfloor9"
          ],
          "tags": [
            "eks",
            "kubernetes",
            "engineering",
            "playbook"
          ],
          "wordCount": 181,
          "excerpt": "EKS Engineering Playbook에 오신 것을 환영합니다! 🎉\n\n안녕하세요! EKS Engineering Playbook의 첫 번째 블로그 포스트입니다.\n\n이 플레이북은 Amazon EKS(Elastic Kubernetes Service) 관련 아키텍처 딥다이브 문서들을 체계적으로 정리한 종합 가이드입니다.\n\n 🎯 우리의 목표..."
        },
        "path": "/blog/2025-01-15-welcome",
        "type": "blog"
      }
    ],
    "categories": [],
    "totalWords": 181
  },
  "playbook": {
    "count": 1,
    "documents": [
      {
        "fullPath": "/home/ec2-user/engineering-playbook/blog/2025-01-15-welcome.md",
        "relativePath": "2025-01-15-welcome.md",
        "name": "2025-01-15-welcome.md",
        "metadata": {
          "slug": "welcome",
          "title": "EKS Engineering Playbook에 오신 것을 환영합니다",
          "authors": [
            "devfloor9"
          ],
          "tags": [
            "eks",
            "kubernetes",
            "engineering",
            "playbook"
          ],
          "wordCount": 181,
          "excerpt": "EKS Engineering Playbook에 오신 것을 환영합니다! 🎉\n\n안녕하세요! EKS Engineering Playbook의 첫 번째 블로그 포스트입니다.\n\n이 플레이북은 Amazon EKS(Elastic Kubernetes Service) 관련 아키텍처 딥다이브 문서들을 체계적으로 정리한 종합 가이드입니다.\n\n 🎯 우리의 목표..."
        },
        "path": "/blog/2025-01-15-welcome",
        "type": "blog"
      }
    ],
    "categories": [],
    "totalWords": 181
  }
};
  
  const filteredTags = Object.entries(tagStats).filter(([tag, stats]) => {
    const matchesSearch = tag.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      stats.categories.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  }).sort(([,a], [,b]) => b.count - a.count);
  
  const categories = [
    { value: 'all', label: '전체' },
    { value: 'performance-networking', label: '성능 & 네트워킹' },
    { value: 'observability-monitoring', label: '관찰가능성' },
    { value: 'genai-aiml', label: 'GenAI & AI/ML' },
    { value: 'hybrid-multicloud', label: '하이브리드 클라우드' },
    { value: 'security-compliance', label: '보안 & 컴플라이언스' }
  ];

  return (
    <Layout
      title="태그 목록"
      description="EKS Engineering Playbook의 모든 태그를 확인하고 관련 문서를 찾아보세요."
    >
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <header className="margin-bottom--xl text--center">
              <h1>Tags</h1>
              <p style={{fontSize: '1.1rem', color: 'var(--ifm-color-emphasis-700)'}}>
                Browse <strong>{Object.keys(tagStats).length} tags</strong> to find relevant documentation
              </p>
            </header>

            <div className="margin-bottom--lg">
              <div className="row">
                <div className="col col--8">
                  <input
                    type="text"
                    placeholder="태그 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--ifm-color-emphasis-300)',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div className="col col--4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--ifm-color-emphasis-300)',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              {filteredTags.map(([tag, stats]) => (
                <div key={tag} className="col col--6 col--lg-4 margin-bottom--md">
                  <Link
                    to={`/tags/${tag}`}
                    className="card"
                    style={{
                      textDecoration: 'none',
                      height: '100%',
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="card__body">
                      <h3 style={{
                        margin: '0 0 0.5rem 0',
                        color: 'var(--ifm-color-primary)',
                        fontSize: '1.1rem'
                      }}>
                        #{tag}
                      </h3>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{
                          backgroundColor: 'var(--ifm-color-primary)',
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '1rem',
                          fontSize: '0.8rem'
                        }}>
                          {stats.count}개 문서
                        </span>
                        <span style={{
                          color: 'var(--ifm-color-emphasis-600)',
                          fontSize: '0.8rem'
                        }}>
                          {Math.round(stats.totalWords / 200)}분 읽기
                        </span>
                      </div>
                      {stats.categories.length > 0 && (
                        <div style={{fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-600)'}}>
                          카테고리: {stats.categories.join(', ')}
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
            
            {filteredTags.length === 0 && (
              <div className="text--center margin-vert--xl">
                <h3>검색 결과가 없습니다</h3>
                <p>다른 검색어나 카테고리를 시도해보세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}