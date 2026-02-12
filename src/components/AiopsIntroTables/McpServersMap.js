import React from 'react';

const McpServersMap = () => {
  const categories = [
    {
      name: '인프라 · IaC',
      icon: '🏗️',
      color: '#2563eb',
      servers: [
        { name: 'EKS MCP', desc: '클러스터 상태 · 리소스 관리' },
        { name: 'ECS MCP', desc: '서비스 배포 · 태스크 관리' },
        { name: 'IaC MCP', desc: 'CloudFormation · CDK · 보안 검증' },
        { name: 'Terraform MCP', desc: 'plan/apply · 보안 스캔' },
        { name: 'Cloud Control API MCP', desc: 'AWS 리소스 직접 관리' },
        { name: 'Serverless MCP', desc: 'Lambda/API GW/SAM' },
        { name: 'Lambda Tool MCP', desc: 'Lambda를 AI 도구로 실행' },
        { name: 'IAM MCP', desc: '역할/정책 · 최소 권한' },
      ]
    },
    {
      name: '관찰성 · 운영',
      icon: '📊',
      color: '#059669',
      servers: [
        { name: 'CloudWatch MCP', desc: '메트릭 · 알람 · 로그 · 트러블슈팅' },
        { name: 'Managed Prometheus MCP', desc: 'PromQL 쿼리 · 메트릭 조회' },
        { name: 'CloudTrail MCP', desc: 'API 활동 · 변경 추적' },
        { name: 'Support MCP', desc: 'AWS Support 케이스 관리' },
      ]
    },
    {
      name: 'AI · ML',
      icon: '🤖',
      color: '#8b5cf6',
      servers: [
        { name: 'Bedrock Knowledge Bases MCP', desc: '엔터프라이즈 RAG 검색' },
        { name: 'Bedrock AgentCore MCP', desc: 'AgentCore 플랫폼 API' },
        { name: 'SageMaker AI MCP', desc: 'ML 리소스 관리 · 개발' },
        { name: 'Nova Canvas MCP', desc: 'AI 이미지 생성' },
        { name: 'Q Business MCP', desc: '엔터프라이즈 AI 어시스턴트' },
      ]
    },
    {
      name: '데이터 · 메시징',
      icon: '🗄️',
      color: '#7c3aed',
      servers: [
        { name: 'DynamoDB MCP', desc: '테이블 · CRUD · 데이터 모델링' },
        { name: 'Aurora PostgreSQL/MySQL MCP', desc: 'RDS Data API DB 운영' },
        { name: 'Neptune MCP', desc: '그래프 DB (openCypher/Gremlin)' },
        { name: 'SNS/SQS MCP', desc: '메시징 · 큐 관리' },
        { name: 'Step Functions MCP', desc: '워크플로우 실행' },
        { name: 'MSK MCP', desc: 'Kafka 클러스터 관리' },
      ]
    },
    {
      name: '비용 · 개발 도구',
      icon: '💰',
      color: '#d97706',
      servers: [
        { name: 'Cost Explorer MCP', desc: '비용 분석 · 리포팅' },
        { name: 'Pricing MCP', desc: '배포 전 비용 예측' },
        { name: 'Documentation MCP', desc: 'AWS 공식 문서 검색' },
        { name: 'Knowledge MCP', desc: '코드 샘플 · 콘텐츠 (GA, Remote)' },
      ]
    },
    {
      name: '보안 · 유틸리티',
      icon: '🛡️',
      color: '#dc2626',
      servers: [
        { name: 'Git Repo Research MCP', desc: '시맨틱 코드 검색 · 분석' },
        { name: 'Diagram MCP', desc: '아키텍처 다이어그램 생성' },
        { name: 'Frontend MCP', desc: 'React · 웹 개발 가이드' },
        { name: 'Finch MCP', desc: '로컬 컨테이너 빌드 · ECR 연동' },
      ]
    }
  ];

  const hostingOptions = [
    {
      title: '로컬 실행',
      color: '#2563eb',
      borderStyle: 'solid',
      items: ['npx/uvx로 개별 설치', 'IDE 프로세스로 실행', '50+ GA']
    },
    {
      title: 'Fully Managed',
      color: '#7c3aed',
      borderStyle: 'dashed',
      items: ['AWS 클라우드 호스팅', 'IAM·CloudTrail 통합', 'EKS/ECS Preview']
    },
    {
      title: '통합 서버',
      color: '#dc2626',
      borderStyle: 'dashed',
      items: ['15,000+ API 단일 엔드포인트', 'Agent SOPs 내장', 'Preview']
    }
  ];

  const totalServers = categories.reduce((acc, cat) => acc + cat.servers.length, 0);

  return (
    <div style={{
      maxWidth: '760px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '15px',
      lineHeight: '1.6'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
            AWS MCP Servers — 50+ 서비스 에코시스템
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            AI 도구(Kiro, Q Developer, Claude Code)가 직접 제어하는 AWS 서비스 맵
          </div>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.2)',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: '600',
          whiteSpace: 'nowrap'
        }}>
          50+ Servers
        </div>
      </div>

      {/* Category Sections */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        padding: '24px'
      }}>
        <div style={{
          display: 'grid',
          gap: '24px'
        }}>
          {categories.map((category) => (
            <div key={category.name}>
              {/* Category Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '18px' }}>{category.icon}</span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: category.color
                }}>
                  {category.name}
                </span>
                <span style={{
                  background: `${category.color}15`,
                  color: category.color,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {category.servers.length}
                </span>
              </div>

              {/* Server Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
              }}>
                {category.servers.map((server) => (
                  <div key={server.name} style={{
                    background: `${category.color}08`,
                    border: `1px solid ${category.color}20`,
                    borderRadius: '6px',
                    padding: '8px 10px'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: category.color,
                      marginBottom: '2px'
                    }}>
                      {server.name}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      lineHeight: '1.4'
                    }}>
                      {server.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Servers Indicator */}
        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: '#f8fafc',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#4b5563',
          textAlign: 'center'
        }}>
          외 {52 - totalServers}+ 추가 서버 (Aurora DSQL, DocumentDB, Redshift, ElastiCache, AppSync, IoT SiteWise 등) — 전체 목록은 GitHub 참조
        </div>
      </div>

      {/* Hosting Comparison */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: '1px solid #e5e7eb',
        padding: '24px',
        marginTop: '2px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          호스팅 방식 진화
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: '0'
        }}>
          {hostingOptions.map((option, idx) => (
            <React.Fragment key={option.title}>
              <div style={{
                flex: 1,
                border: `2px ${option.borderStyle} ${option.color}`,
                borderRadius: '8px',
                padding: '12px',
                background: `${option.color}05`
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: option.color,
                  marginBottom: '8px',
                  textAlign: 'center'
                }}>
                  {option.title}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#4b5563',
                  lineHeight: '1.5'
                }}>
                  {option.items.map((item, i) => (
                    <div key={i} style={{ marginBottom: i < option.items.length - 1 ? '4px' : '0' }}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              {idx < hostingOptions.length - 1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 8px',
                  fontSize: '20px',
                  color: '#9ca3af',
                  fontWeight: '700'
                }}>
                  →
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div style={{
          marginTop: '16px',
          fontSize: '11px',
          color: '#6b7280',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          개별 로컬 서버(GA)로 시작 → 보안·감사 요구 시 Fully Managed → 복합 운영에는 통합 서버
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: '#dbeafe',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '12px 16px',
        fontSize: '12px',
        color: '#1e40af',
        textAlign: 'center'
      }}>
        전체 목록: github.com/awslabs/mcp | 서버 추가는 지속 업데이트 중
      </div>
    </div>
  );
};

export default McpServersMap;
