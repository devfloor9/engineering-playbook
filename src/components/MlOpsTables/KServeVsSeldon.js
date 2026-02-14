import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const KServeVsSeldon = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const comparisons = [
    {
      feature: isKo ? '아키텍처' : isZh ? '架构' : 'Architecture',
      kserve: isKo ? 'Knative 기반, 서버리스' : isZh ? '基于 Knative，无服务器' : 'Knative-based, Serverless',
      seldon: isKo ? 'Kubernetes 네이티브' : isZh ? 'Kubernetes 原生' : 'Kubernetes Native',
      icon: '🏗️'
    },
    {
      feature: isKo ? '오토스케일링' : isZh ? '自动扩展' : 'Auto-scaling',
      kserve: 'Knative Autoscaler (KPA)',
      seldon: 'HPA, KEDA ' + (isKo ? '지원' : isZh ? '支持' : 'Support'),
      icon: '📈'
    },
    {
      feature: isKo ? '프로토콜' : isZh ? '协议' : 'Protocol',
      kserve: 'HTTP/gRPC, V1/V2 API',
      seldon: 'REST, gRPC, Kafka',
      icon: '🔌'
    },
    {
      feature: isKo ? '트랜스포머' : isZh ? '转换器' : 'Transformer',
      kserve: isKo ? '내장 Pre/Post Processing' : isZh ? '内置预处理/后处理' : 'Built-in Pre/Post Processing',
      seldon: isKo ? 'Python/Java 커스텀' : isZh ? 'Python/Java 自定义' : 'Python/Java Custom',
      icon: '🔄'
    },
    {
      feature: 'Explainability',
      kserve: isKo ? 'Alibi Explain 통합' : isZh ? 'Alibi Explain 集成' : 'Alibi Explain Integration',
      seldon: isKo ? 'Alibi Explain 통합' : isZh ? 'Alibi Explain 集成' : 'Alibi Explain Integration',
      icon: '🔍'
    },
    {
      feature: isKo ? '멀티 프레임워크' : isZh ? '多框架' : 'Multi-framework',
      kserve: 'TensorFlow, PyTorch, SKLearn, XGBoost',
      seldon: isKo ? '동일 + Custom Servers' : isZh ? '相同 + 自定义服务器' : 'Same + Custom Servers',
      icon: '🎯'
    },
    {
      feature: isKo ? '배포 복잡도' : isZh ? '部署复杂度' : 'Deployment Complexity',
      kserve: isKo ? '중간 (Knative 필요)' : isZh ? '中等（需要 Knative）' : 'Medium (Knative Required)',
      seldon: isKo ? '낮음 (Kubernetes만 필요)' : isZh ? '低（仅需 Kubernetes）' : 'Low (Kubernetes Only)',
      icon: '⚙️'
    },
    {
      feature: isKo ? '커뮤니티' : isZh ? '社区' : 'Community',
      kserve: 'CNCF Incubating',
      seldon: isKo ? '활발한 오픈소스' : isZh ? '活跃的开源社区' : 'Active Open Source',
      icon: '👥'
    }
  ];

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '15px',
      lineHeight: '1.6'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '⚖️ KServe vs Seldon Core 비교' : isZh ? '⚖️ KServe vs Seldon Core 比较' : '⚖️ KServe vs Seldon Core Comparison'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '두 모델 서빙 프레임워크의 기능 비교' : isZh ? '两个模型服务框架的功能比较' : 'Feature Comparison of Two Model Serving Frameworks'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '20px'
      }}>
        <div style={{
          display: 'grid',
          gap: '12px'
        }}>
          {comparisons.map((item, index) => (
            <div
              key={index}
              style={{
                background: index % 2 === 0 ? 'var(--ifm-background-surface-color)' : 'var(--ifm-color-emphasis-100)',
                padding: '16px',
                borderRadius: '6px',
                display: 'grid',
                gridTemplateColumns: '40px 180px 1fr 1fr',
                gap: '16px',
                alignItems: 'center',
                border: '1px solid var(--ifm-color-emphasis-200)'
              }}
            >
              <div style={{ fontSize: '24px', textAlign: 'center' }}>
                {item.icon}
              </div>

              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--ifm-color-primary)' }}>
                {item.feature}
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#3b82f6', marginBottom: '4px' }}>
                  KServe
                </div>
                <div style={{ fontSize: '14px', color: '#374151' }}>
                  {item.kserve}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#8b5cf6', marginBottom: '4px' }}>
                  Seldon Core
                </div>
                <div style={{ fontSize: '14px', color: '#374151' }}>
                  {item.seldon}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KServeVsSeldon;
