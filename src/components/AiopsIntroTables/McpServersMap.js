import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const McpServersMap = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const categories = [
    {
      name: isKo ? '인프라 · IaC' : isZh ? '基础设施 · IaC' : 'Infrastructure · IaC',
      icon: '🏗️',
      color: '#2563eb',
      servers: [
        { name: 'EKS MCP', desc: isKo ? '클러스터 상태 · 리소스 관리' : isZh ? '集群状态 · 资源管理' : 'Cluster status · resource mgmt' },
        { name: 'ECS MCP', desc: isKo ? '서비스 배포 · 태스크 관리' : isZh ? '服务部署 · 任务管理' : 'Service deployment · task mgmt' },
        { name: 'IaC MCP', desc: isKo ? 'CloudFormation · CDK · 보안 검증' : isZh ? 'CloudFormation · CDK · 安全验证' : 'CloudFormation · CDK · security validation' },
        { name: 'Terraform MCP', desc: isKo ? 'plan/apply · 보안 스캔' : isZh ? 'plan/apply · 安全扫描' : 'plan/apply · security scan' },
        { name: 'Cloud Control API MCP', desc: isKo ? 'AWS 리소스 직접 관리' : isZh ? '直接管理 AWS 资源' : 'Direct AWS resource mgmt' },
        { name: 'Serverless MCP', desc: 'Lambda/API GW/SAM' },
        { name: 'Lambda Tool MCP', desc: isKo ? 'Lambda를 AI 도구로 실행' : isZh ? '将 Lambda 作为 AI 工具执行' : 'Execute Lambda as AI tool' },
        { name: 'IAM MCP', desc: isKo ? '역할/정책 · 최소 권한' : isZh ? '角色/策略 · 最小权限' : 'Roles/policies · least privilege' },
      ]
    },
    {
      name: isKo ? '관찰성 · 운영' : isZh ? '可观测性 · 运维' : 'Observability · Operations',
      icon: '📊',
      color: '#059669',
      servers: [
        { name: 'CloudWatch MCP', desc: isKo ? '메트릭 · 알람 · 로그 · 트러블슈팅' : isZh ? '指标 · 告警 · 日志 · 故障排查' : 'Metrics · alarms · logs · troubleshooting' },
        { name: 'Managed Prometheus MCP', desc: isKo ? 'PromQL 쿼리 · 메트릭 조회' : isZh ? 'PromQL 查询 · 指标查询' : 'PromQL query · metric lookup' },
        { name: 'CloudTrail MCP', desc: isKo ? 'API 활동 · 변경 추적' : isZh ? 'API 活动 · 变更跟踪' : 'API activity · change tracking' },
        { name: 'Support MCP', desc: isKo ? 'AWS Support 케이스 관리' : isZh ? 'AWS Support 案例管理' : 'AWS Support case mgmt' },
      ]
    },
    {
      name: 'AI · ML',
      icon: '🤖',
      color: '#8b5cf6',
      servers: [
        { name: 'Bedrock Knowledge Bases MCP', desc: isKo ? '엔터프라이즈 RAG 검색' : isZh ? '企业级 RAG 搜索' : 'Enterprise RAG search' },
        { name: 'Bedrock AgentCore MCP', desc: isKo ? 'AgentCore 플랫폼 API' : isZh ? 'AgentCore 平台 API' : 'AgentCore platform API' },
        { name: 'SageMaker AI MCP', desc: isKo ? 'ML 리소스 관리 · 개발' : isZh ? 'ML 资源管理 · 开发' : 'ML resource mgmt · development' },
        { name: 'Nova Canvas MCP', desc: isKo ? 'AI 이미지 생성' : isZh ? 'AI 图像生成' : 'AI image generation' },
        { name: 'Q Business MCP', desc: isKo ? '엔터프라이즈 AI 어시스턴트' : isZh ? '企业级 AI 助手' : 'Enterprise AI assistant' },
      ]
    },
    {
      name: isKo ? '데이터 · 메시징' : isZh ? '数据 · 消息' : 'Data · Messaging',
      icon: '🗄️',
      color: '#7c3aed',
      servers: [
        { name: 'DynamoDB MCP', desc: isKo ? '테이블 · CRUD · 데이터 모델링' : isZh ? '表 · CRUD · 数据建模' : 'Table · CRUD · data modeling' },
        { name: 'Aurora PostgreSQL/MySQL MCP', desc: isKo ? 'RDS Data API DB 운영' : isZh ? 'RDS Data API 数据库运维' : 'RDS Data API DB operations' },
        { name: 'Neptune MCP', desc: isKo ? '그래프 DB (openCypher/Gremlin)' : isZh ? '图数据库（openCypher/Gremlin）' : 'Graph DB (openCypher/Gremlin)' },
        { name: 'SNS/SQS MCP', desc: isKo ? '메시징 · 큐 관리' : isZh ? '消息 · 队列管理' : 'Messaging · queue mgmt' },
        { name: 'Step Functions MCP', desc: isKo ? '워크플로우 실행' : isZh ? '工作流执行' : 'Workflow execution' },
        { name: 'MSK MCP', desc: isKo ? 'Kafka 클러스터 관리' : isZh ? 'Kafka 集群管理' : 'Kafka cluster mgmt' },
      ]
    },
    {
      name: isKo ? '비용 · 개발 도구' : isZh ? '成本 · 开发工具' : 'Cost · Dev Tools',
      icon: '💰',
      color: '#d97706',
      servers: [
        { name: 'Cost Explorer MCP', desc: isKo ? '비용 분석 · 리포팅' : isZh ? '成本分析 · 报告' : 'Cost analysis · reporting' },
        { name: 'Pricing MCP', desc: isKo ? '배포 전 비용 예측' : isZh ? '部署前成本预估' : 'Pre-deployment cost estimation' },
        { name: 'Documentation MCP', desc: isKo ? 'AWS 공식 문서 검색' : isZh ? 'AWS 官方文档搜索' : 'AWS official docs search' },
        { name: 'Knowledge MCP', desc: isKo ? '코드 샘플 · 콘텐츠 (GA, Remote)' : isZh ? '代码示例 · 内容（GA，远程）' : 'Code samples · content (GA, Remote)' },
      ]
    },
    {
      name: isKo ? '보안 · 유틸리티' : isZh ? '安全 · 实用工具' : 'Security · Utilities',
      icon: '🛡️',
      color: '#dc2626',
      servers: [
        { name: 'Git Repo Research MCP', desc: isKo ? '시맨틱 코드 검색 · 분석' : isZh ? '语义代码搜索 · 分析' : 'Semantic code search · analysis' },
        { name: 'Diagram MCP', desc: isKo ? '아키텍처 다이어그램 생성' : isZh ? '架构图生成' : 'Architecture diagram generation' },
        { name: 'Frontend MCP', desc: isKo ? 'React · 웹 개发 가이드' : isZh ? 'React · Web 开发指南' : 'React · web dev guide' },
        { name: 'Finch MCP', desc: isKo ? '로컬 컨테이너 빌드 · ECR 연동' : isZh ? '本地容器构建 · ECR 集成' : 'Local container build · ECR integration' },
      ]
    }
  ];

  const hostingOptions = [
    {
      title: isKo ? '로컬 실행' : isZh ? '本地' : 'Local',
      color: '#2563eb',
      borderStyle: 'solid',
      items: isKo ? ['npx/uvx로 개별 설치', 'IDE 프로세스로 실행', '50+ GA'] : isZh ? ['通过 npx/uvx 安装', '作为 IDE 进程运行', '50+ GA'] : ['Install via npx/uvx', 'Run as IDE process', '50+ GA']
    },
    {
      title: 'Fully Managed',
      color: '#7c3aed',
      borderStyle: 'dashed',
      items: isKo ? ['AWS 클라우드 호스팅', 'IAM·CloudTrail 통합', 'EKS/ECS Preview'] : isZh ? ['AWS 云托管', 'IAM·CloudTrail 集成', 'EKS/ECS 预览'] : ['AWS cloud hosted', 'IAM·CloudTrail integration', 'EKS/ECS Preview']
    },
    {
      title: isKo ? '통합 서버' : isZh ? '统一' : 'Unified',
      color: '#dc2626',
      borderStyle: 'dashed',
      items: isKo ? ['15,000+ API 단일 엔드포인트', 'Agent SOPs 내장', 'Preview'] : isZh ? ['15,000+ API 单一端点', 'Agent SOPs 内置', '预览'] : ['15,000+ API single endpoint', 'Agent SOPs built-in', 'Preview']
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
            {isKo ? 'AWS MCP Servers — 50+ 서비스 에코시스템' : isZh ? 'AWS MCP 服务器 — 50+ 服务生态系统' : 'AWS MCP Servers — 50+ Service Ecosystem'}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            {isKo ? 'AI 도구(Kiro, Q Developer, Claude Code)가 직접 제어하는 AWS 서비스 맵' : isZh ? 'AI 工具（Kiro、Q Developer、Claude Code）直接控制的 AWS 服务地图' : 'AWS service map directly controlled by AI tools (Kiro, Q Developer, Claude Code)'}
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
          {isKo
            ? `외 ${52 - totalServers}+ 추가 서버 (Aurora DSQL, DocumentDB, Redshift, ElastiCache, AppSync, IoT SiteWise 등) — 전체 목록은 GitHub 참조`
            : isZh
            ? `另有 ${52 - totalServers}+ 个服务器（Aurora DSQL、DocumentDB、Redshift、ElastiCache、AppSync、IoT SiteWise 等）— 完整列表参见 GitHub`
            : `Plus ${52 - totalServers}+ additional servers (Aurora DSQL, DocumentDB, Redshift, ElastiCache, AppSync, IoT SiteWise, etc.) — See GitHub for full list`}
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
          {isKo ? '호스팅 방식 진화' : isZh ? '托管方式演进' : 'Hosting Evolution'}
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
          {isKo
            ? '개별 로컬 서버(GA)로 시작 → 보안·감사 요구 시 Fully Managed → 복합 운영에는 통합 서버'
            : isZh
            ? '从本地独立服务器（GA）开始 → 安全/审计需求时使用完全托管 → 复杂运维使用统一服务器'
            : 'Start with Individual Local (GA) → Fully Managed for security/audit → Unified for complex ops'}
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
        {isKo ? '전체 목록: github.com/awslabs/mcp | 서버 추가는 지속 업데이트 중' : isZh ? '完整列表: github.com/awslabs/mcp | 持续更新新服务器' : 'Full list: github.com/awslabs/mcp | Continuously updated with new servers'}
      </div>
    </div>
  );
};

export default McpServersMap;
