import React from 'react';

const AidlcArtifacts = () => {
  const artifacts = [
    {
      name: 'Intent',
      description: '달성할 고수준 목적 — 비즈니스 목표, 기능, 기술 결과. AI 분해의 시작점',
      sdlcMapping: 'Epic / Feature',
      icon: '🎯',
      color: '#059669'
    },
    {
      name: 'Unit',
      description: 'Intent에서 파생된 응집력 있는 독립 작업 단위. DDD Subdomain에 해당하며, 느슨 결합으로 병렬 개발 가능',
      sdlcMapping: 'Epic / Subdomain',
      icon: '📦',
      color: '#2563eb'
    },
    {
      name: 'Bolt',
      description: 'Unit 내 태스크를 빠르게 구현하는 최소 반복 단위. 시간/일 단위 (Sprint의 주/월과 대비)',
      sdlcMapping: 'Sprint',
      icon: '⚡',
      color: '#d97706'
    },
    {
      name: 'Domain Design',
      description: '비즈니스 로직을 인프라와 독립적으로 DDD 원칙(Aggregate, Entity, Value Object, Domain Event)으로 모델링',
      sdlcMapping: '도메인 모델',
      icon: '🏗️',
      color: '#7c3aed'
    },
    {
      name: 'Logical Design',
      description: 'Domain Design에 NFR과 아키텍처 패턴(CQRS, Circuit Breaker)을 적용. ADR(Architecture Decision Record) 생성',
      sdlcMapping: '아키텍처 설계',
      icon: '📐',
      color: '#0891b2'
    },
    {
      name: 'Deployment Unit',
      description: '패키징된 실행 코드(컨테이너), 설정(Helm), 인프라(Terraform/ACK CRD). 기능·보안·NFR 테스트 완료 상태',
      sdlcMapping: '릴리스 패키지',
      icon: '🚀',
      color: '#dc2626'
    }
  ];

  return (
    <div style={{
      maxWidth: '760px',
      margin: '2rem auto',
      padding: '0 1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #312e81 0%, #6366f1 100%)',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        color: 'white'
      }}>
        <h2 style={{
          margin: '0 0 0.5rem 0',
          fontSize: '1.5rem',
          fontWeight: '600'
        }}>
          AIDLC 핵심 산출물
        </h2>
        <p style={{
          margin: 0,
          fontSize: '0.95rem',
          opacity: 0.95
        }}>
          AI-DLC 방법론의 6대 산출물과 SDLC 대응 관계
        </p>
      </div>

      {artifacts.map((artifact, index) => (
        <div
          key={index}
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderLeft: `4px solid ${artifact.color}`,
            borderRadius: '8px',
            padding: '1.25rem',
            marginBottom: '1rem',
            transition: 'box-shadow 0.2s ease'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>{artifact.icon}</span>
              <h3 style={{
                margin: 0,
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                {artifact.name}
              </h3>
            </div>
            <span style={{
              background: '#f3f4f6',
              color: '#4b5563',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}>
              {artifact.sdlcMapping}
            </span>
          </div>
          <p style={{
            margin: 0,
            fontSize: '0.95rem',
            lineHeight: '1.6',
            color: '#4b5563'
          }}>
            {artifact.description}
          </p>
        </div>
      ))}

      <div style={{
        marginTop: '2rem',
        padding: '1.25rem',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <h3 style={{
          margin: '0 0 1rem 0',
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1f2937'
        }}>
          산출물 흐름
        </h3>

        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#059669',
            marginBottom: '0.25rem'
          }}>
            개발 흐름
          </div>
          <div style={{
            fontSize: '0.95rem',
            color: '#4b5563',
            fontFamily: 'Menlo, Monaco, Courier New, monospace'
          }}>
            Intent → Unit → Bolt
          </div>
        </div>

        <div>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#7c3aed',
            marginBottom: '0.25rem'
          }}>
            설계 흐름
          </div>
          <div style={{
            fontSize: '0.95rem',
            color: '#4b5563',
            fontFamily: 'Menlo, Monaco, Courier New, monospace'
          }}>
            Domain Design → Logical Design → Deployment Unit
          </div>
        </div>
      </div>
    </div>
  );
};

export default AidlcArtifacts;
