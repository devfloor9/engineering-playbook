import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const SolutionsComparisonTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const solutions = [
    {
      id: 'kagent',
      solution: isKo ? 'Kagent (참조)' : isZh ? 'Kagent（参考）' : 'Kagent (Reference)',
      features: isKo ? 'AI 에이전트 전용 CRD, 워크플로우 오케스트레이션' : isZh ? 'AI 代理专用 CRD，工作流编排' : 'AI agent-specific CRD, workflow orchestration',
      useCase: isKo ? '멀티 에이전트 시스템, 복잡한 워크플로우' : isZh ? '多代理系统，复杂工作流' : 'Multi-agent systems, complex workflows',
      color: '#667eea'
    },
    {
      id: 'kubeai',
      solution: isKo ? 'KubeAI' : isZh ? 'KubeAI' : 'KubeAI',
      features: isKo ? '경량 LLM 서빙, OpenAI 호환 API' : isZh ? '轻量级 LLM 服务，OpenAI 兼容 API' : 'Lightweight LLM serving, OpenAI-compatible API',
      useCase: isKo ? '간단한 모델 서빙, 빠른 프로토타이핑' : isZh ? '简单模型服务，快速原型' : 'Simple model serving, rapid prototyping',
      color: '#3b82f6'
    },
    {
      id: 'seldon',
      solution: isKo ? 'Seldon Core' : isZh ? 'Seldon Core' : 'Seldon Core',
      features: isKo ? 'MLOps 플랫폼, A/B 테스트, 카나리 배포' : isZh ? 'MLOps 平台，A/B 测试，金丝雀部署' : 'MLOps platform, A/B testing, canary deployments',
      useCase: isKo ? '엔터프라이즈 ML 운영, 복잡한 배포 전략' : isZh ? '企业 ML 运维，复杂部署策略' : 'Enterprise ML ops, complex deployment strategies',
      color: '#10b981'
    },
    {
      id: 'kserve',
      solution: isKo ? 'KServe' : isZh ? 'KServe' : 'KServe',
      features: isKo ? '서버리스 추론, 자동 스케일링' : isZh ? '无服务器推理，自动扩展' : 'Serverless inference, auto-scaling',
      useCase: isKo ? '이벤트 기반 추론, 비용 최적화' : isZh ? '事件驱动推理，成本优化' : 'Event-driven inference, cost optimization',
      color: '#f59e0b'
    }
  ];

  return (
    <div style={{
      maxWidth: '100%',
      margin: '20px 0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '15px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '🔍 Kagent 대안 솔루션 비교' : isZh ? '🔍 Kagent 替代方案比较' : '🔍 Kagent Alternative Solutions Comparison'}
      </div>

      <div style={{
        overflowX: 'auto',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: 'var(--ifm-background-surface-color)'
        }}>
          <thead>
            <tr style={{ background: 'var(--ifm-color-emphasis-100)' }}>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                borderBottom: '2px solid var(--ifm-color-emphasis-300)',
                width: '20%'
              }}>
                {isKo ? '솔루션' : isZh ? '解决方案' : 'Solution'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                borderBottom: '2px solid var(--ifm-color-emphasis-300)',
                width: '40%'
              }}>
                {isKo ? '특징' : isZh ? '特性' : 'Features'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                borderBottom: '2px solid var(--ifm-color-emphasis-300)',
                width: '40%'
              }}>
                {isKo ? '적합한 사용 사례' : isZh ? '适用场景' : 'Suitable Use Cases'}
              </th>
            </tr>
          </thead>
          <tbody>
            {solutions.map((item, index) => (
              <tr key={item.id} style={{
                background: index % 2 === 0 ? 'var(--ifm-background-surface-color)' : 'var(--ifm-color-emphasis-50)'
              }}>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--ifm-color-emphasis-200)',
                  fontWeight: '600'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '4px',
                      height: '32px',
                      borderRadius: '2px',
                      background: item.color
                    }}></div>
                    <span>{item.solution}</span>
                  </div>
                </td>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--ifm-color-emphasis-200)'
                }}>
                  {item.features}
                </td>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--ifm-color-emphasis-200)'
                }}>
                  {item.useCase}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SolutionsComparisonTable;
