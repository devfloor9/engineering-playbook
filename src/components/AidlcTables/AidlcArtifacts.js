import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const AidlcArtifacts = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const artifacts = [
    {
      name: 'Intent',
      description: isKo ? '달성할 고수준 목적 — 비즈니스 목표, 기능, 기술 결과. AI 분해의 시작점' : isZh ? '要实现的高层次目标 — 业务目标、功能、技术成果。AI 分解的起点' : 'High-level objective to achieve — business goals, features, technical outcomes. Starting point for AI decomposition',
      sdlcMapping: 'Epic / Feature',
      icon: '🎯',
      color: '#059669'
    },
    {
      name: 'Unit',
      description: isKo ? 'Intent에서 파생된 응집력 있는 독립 작업 단위. DDD Subdomain에 해당하며, 느슨 결합으로 병렬 개발 가능' : isZh ? '从 Intent 派生的内聚独立工作单元。对应 DDD 子域，通过松耦合实现并行开发' : 'Cohesive independent work unit derived from Intent. Corresponds to DDD Subdomain, enabling parallel development through loose coupling',
      sdlcMapping: 'Epic / Subdomain',
      icon: '📦',
      color: '#2563eb'
    },
    {
      name: 'Bolt',
      description: isKo ? 'Unit 내 태스크를 빠르게 구현하는 최소 반복 단위. 시간/일 단위 (Sprint의 주/월과 대비)' : isZh ? 'Unit 内快速实现任务的最小迭代单元。小时/天级粒度（相比 Sprint 的周/月）' : 'Minimum iteration unit for rapid task implementation within Unit. Hour/day granularity (vs. Sprint\'s week/month)',
      sdlcMapping: 'Sprint',
      icon: '⚡',
      color: '#d97706'
    },
    {
      name: 'Domain Design',
      description: isKo ? '비즈니스 로직을 인프라와 독립적으로 DDD 원칙(Aggregate, Entity, Value Object, Domain Event)으로 모델링' : isZh ? '使用 DDD 原则（聚合、实体、值对象、领域事件）独立于基础设施建模业务逻辑' : 'Model business logic independently of infrastructure using DDD principles (Aggregate, Entity, Value Object, Domain Event)',
      sdlcMapping: isKo ? '도메인 모델' : isZh ? '领域模型' : 'Domain Model',
      icon: '🏗️',
      color: '#7c3aed'
    },
    {
      name: 'Logical Design',
      description: isKo ? 'Domain Design에 NFR과 아키텍처 패턴(CQRS, Circuit Breaker)을 적용. ADR(Architecture Decision Record) 생성' : isZh ? '将非功能需求和架构模式（CQRS、Circuit Breaker）应用于 Domain Design。生成架构决策记录（ADR）' : 'Apply NFRs and architecture patterns (CQRS, Circuit Breaker) to Domain Design. Generate ADR (Architecture Decision Record)',
      sdlcMapping: isKo ? '아키텍처 설계' : isZh ? '架构设计' : 'Architecture Design',
      icon: '📐',
      color: '#0891b2'
    },
    {
      name: 'Deployment Unit',
      description: isKo ? '패키징된 실행 코드(컨테이너), 설정(Helm), 인프라(Terraform/ACK CRD). 기능·보안·NFR 테스트 완료 상태' : isZh ? '打包的可执行代码（容器）、配置（Helm）、基础设施（Terraform/ACK CRD）。功能、安全和非功能需求测试已完成' : 'Packaged executable code (container), configuration (Helm), infrastructure (Terraform/ACK CRD). Functional, security, and NFR testing completed',
      sdlcMapping: isKo ? '릴리스 패키지' : isZh ? '发布包' : 'Release Package',
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
          {isKo ? 'AIDLC 핵심 산출물' : isZh ? 'AIDLC 核心产出物' : 'AIDLC Core Artifacts'}
        </h2>
        <p style={{
          margin: 0,
          fontSize: '0.95rem',
          opacity: 0.95
        }}>
          {isKo ? 'AI-DLC 방법론의 6대 산출물과 SDLC 대응 관계' : isZh ? 'AI-DLC 方法论的六大产出物及其与 SDLC 的对应关系' : 'Six Core Artifacts of AI-DLC Methodology and Their SDLC Mapping'}
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
          {isKo ? '산출물 흐름' : isZh ? '产出物流程' : 'Artifact Flow'}
        </h3>

        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#059669',
            marginBottom: '0.25rem'
          }}>
            {isKo ? '개발 흐름' : isZh ? '开发流程' : 'Development Flow'}
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
            {isKo ? '설계 흐름' : isZh ? '设计流程' : 'Design Flow'}
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
