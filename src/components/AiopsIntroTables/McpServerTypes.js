import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const McpServerTypes = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const types = [
    {
      name: isKo ? '개별 로컬 MCP 서버' : isZh ? '本地独立 MCP 服务器' : 'Individual Local MCP Server',
      count: '50+',
      status: 'GA',
      statusColor: '#059669',
      color: '#2563eb',
      released: '2024~',
      location: isKo ? '로컬 (npx/pip)' : isZh ? '本地（npx/pip）' : 'Local (npx/pip)',
      scope: isKo ? '서비스별 1개 서버' : isZh ? '每服务 1 个服务器' : '1 server per service',
      feature: isKo ? '서비스별 심화 도구 (kubectl, PromQL 등)' : isZh ? '服务专用深度工具（kubectl、PromQL 等）' : 'Service-specific deep tools (kubectl, PromQL, etc.)',
      install: 'npx @awslabs/mcp-server-eks',
      useCase: isKo ? 'Kiro/IDE에서 개별 AWS 서비스 직접 제어' : isZh ? '从 Kiro/IDE 直接控制单个 AWS 服务' : 'Direct control of individual AWS services from Kiro/IDE',
    },
    {
      name: isKo ? 'Fully Managed MCP 서버' : isZh ? '完全托管 MCP 服务器' : 'Fully Managed MCP Server',
      count: 'EKS, ECS',
      status: 'Preview',
      statusColor: '#d97706',
      color: '#7c3aed',
      released: '2025.11',
      location: isKo ? 'AWS 클라우드 (Remote)' : isZh ? 'AWS 云（远程）' : 'AWS Cloud (Remote)',
      scope: isKo ? '서비스별 클라우드 호스팅 버전' : isZh ? '每服务云托管版本' : 'Cloud-hosted version per service',
      feature: isKo ? 'IAM 통합, CloudTrail 감사, 자동 패치, 베스트 프랙티스 KB' : isZh ? 'IAM 集成、CloudTrail 审计、自动补丁、最佳实践知识库' : 'IAM integration, CloudTrail auditing, auto patching, best practice KB',
      install: isKo ? 'Kiro/IDE에서 remote 연결' : isZh ? '从 Kiro/IDE 远程连接' : 'Remote connection from Kiro/IDE',
      useCase: isKo ? '엔터프라이즈 보안·감사 요구사항이 있는 환경' : isZh ? '具有企业安全与审计要求的环境' : 'Environments with enterprise security & audit requirements',
    },
    {
      name: isKo ? 'AWS MCP Server (통합)' : isZh ? 'AWS MCP 服务器（统一）' : 'AWS MCP Server (Unified)',
      count: '15,000+ API',
      status: 'Preview',
      statusColor: '#d97706',
      color: '#dc2626',
      released: '2025.11',
      location: isKo ? 'AWS 클라우드 (Remote)' : isZh ? 'AWS 云（远程）' : 'AWS Cloud (Remote)',
      scope: isKo ? '전체 AWS API 단일 서버' : isZh ? '单一服务器涵盖所有 AWS API' : 'All AWS APIs in single server',
      feature: isKo ? 'API 실행 + AWS 문서 + Agent SOPs (워크플로우 가이드)' : isZh ? 'API 执行 + AWS 文档 + Agent SOPs（工作流指南）' : 'API execution + AWS docs + Agent SOPs (workflow guides)',
      install: isKo ? 'Kiro/IDE에서 remote 연결' : isZh ? '从 Kiro/IDE 远程连接' : 'Remote connection from Kiro/IDE',
      useCase: isKo ? '멀티 서비스 복합 작업, 자연어 기반 AWS 운영' : isZh ? '多服务复杂任务，基于自然语言的 AWS 运维' : 'Multi-service complex tasks, natural language AWS operations',
    },
  ];

  const rows = [
    { label: isKo ? '출시' : isZh ? '发布' : 'Release', key: 'released' },
    { label: isKo ? '실행 위치' : isZh ? '运行位置' : 'Location', key: 'location' },
    { label: isKo ? '범위' : isZh ? '范围' : 'Scope', key: 'scope' },
    { label: isKo ? '핵심 특징' : isZh ? '核心特性' : 'Key Features', key: 'feature' },
    { label: isKo ? '설치/연결' : isZh ? '安装/连接' : 'Install/Connect', key: 'install' },
    { label: isKo ? '활용 시나리오' : isZh ? '使用场景' : 'Use Case', key: 'useCase' },
  ];

  return (
    <div style={{
      maxWidth: '760px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '15px',
      lineHeight: '1.6'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? 'AWS MCP 서버 3가지 제공 방식' : isZh ? 'AWS MCP 服务器 3 种部署方式' : '3 AWS MCP Server Deployment Options'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '개별 로컬 (GA) · Fully Managed (Preview) · 통합 서버 (Preview)' : isZh ? '本地独立（GA）· 完全托管（预览）· 统一服务器（预览）' : 'Individual Local (GA) · Fully Managed (Preview) · Unified Server (Preview)'}
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {/* Column Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '110px 1fr 1fr 1fr',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }} />
          {types.map((t) => (
            <div key={t.name} style={{
              padding: '12px 14px',
              background: `${t.color}08`,
              borderLeft: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '700',
                color: t.color,
                marginBottom: '4px'
              }}>
                {t.name}
              </div>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <span style={{
                  background: `${t.color}15`,
                  color: t.color,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {t.count}
                </span>
                <span style={{
                  background: `${t.statusColor}15`,
                  color: t.statusColor,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Data Rows */}
        {rows.map((row, idx) => (
          <div key={row.key} style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr 1fr 1fr',
            borderBottom: idx < rows.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '10px 14px',
              background: '#f8fafc',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              display: 'flex',
              alignItems: 'center'
            }}>
              {row.label}
            </div>
            {types.map((t) => (
              <div key={`${row.key}-${t.name}`} style={{
                padding: '10px 14px',
                fontSize: '12px',
                color: '#4b5563',
                borderLeft: '1px solid #f3f4f6',
                display: 'flex',
                alignItems: 'center'
              }}>
                {row.key === 'install' ? (
                  <code style={{
                    background: '#f3f4f6',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    wordBreak: 'break-all'
                  }}>
                    {t[row.key]}
                  </code>
                ) : (
                  t[row.key]
                )}
              </div>
            ))}
          </div>
        ))}

        {/* Footer */}
        <div style={{
          background: '#fffbeb',
          borderTop: '1px solid #fde68a',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#92400e'
        }}>
          <strong>{isKo ? '권장 시작점:' : isZh ? '推荐起点:' : 'Recommended Start:'}</strong> {isKo
            ? '개별 로컬 MCP 서버(GA)로 시작하여 Kiro+MCP 패턴을 검증한 후, 엔터프라이즈 보안 요구사항에 따라 Fully Managed로 전환하세요. AWS MCP Server(통합)는 멀티 서비스 복합 작업에 적합합니다.'
            : isZh
            ? '从本地独立 MCP 服务器（GA）开始验证 Kiro+MCP 模式，然后根据企业安全要求迁移到完全托管。AWS MCP 服务器（统一）适合多服务复杂任务。'
            : 'Start with Individual Local MCP Server (GA) to validate Kiro+MCP patterns, then migrate to Fully Managed based on enterprise security requirements. AWS MCP Server (Unified) is ideal for multi-service complex tasks.'}
        </div>
      </div>
    </div>
  );
};

export default McpServerTypes;
