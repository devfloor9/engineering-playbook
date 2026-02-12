import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const CostStructure = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const costItems = [
    {
      name: isKo ? 'AMP 수집 비용' : isZh ? 'AMP 采集成本' : 'AMP Ingestion Cost',
      color: '#2563eb',
      description: isKo ? '메트릭 샘플 수 기반' : isZh ? '基于指标样本数' : 'Based on metric sample count',
      optimization: isKo ? '불필요한 메트릭 필터링, 수집 주기 조정' : isZh ? '过滤不必要的指标、调整采集频率' : 'Filter unnecessary metrics, adjust collection frequency'
    },
    {
      name: isKo ? 'AMG 사용자 비용' : isZh ? 'AMG 用户成本' : 'AMG User Cost',
      color: '#7c3aed',
      description: isKo ? '활성 사용자 수 기반' : isZh ? '基于活跃用户数' : 'Based on active user count',
      optimization: isKo ? 'SSO 통합, 뷰어/에디터 역할 분리' : isZh ? 'SSO 集成、查看者/编辑者角色分离' : 'SSO integration, viewer/editor role separation'
    },
    {
      name: 'DevOps Guru',
      color: '#059669',
      description: isKo ? '분석 리소스 수 기반' : isZh ? '基于分析资源数' : 'Based on analyzed resource count',
      optimization: isKo ? '핵심 리소스 그룹만 활성화' : isZh ? '仅启用核心资源组' : 'Enable only core resource groups'
    },
    {
      name: 'CloudWatch',
      color: '#d97706',
      description: isKo ? '로그/메트릭 볼륨 기반' : isZh ? '基于日志/指标量' : 'Based on log/metric volume',
      optimization: isKo ? '로그 필터링, 메트릭 해상도 조정' : isZh ? '过滤日志、调整指标分辨率' : 'Filter logs, adjust metric resolution'
    }
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
        background: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? 'AIOps 비용 구조 고려사항' : isZh ? 'AIOps 成本结构考虑因素' : 'AIOps Cost Structure Considerations'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '주요 비용 항목과 최적화 방법' : isZh ? '主要成本项目与优化方法' : 'Key cost items & optimization methods'}
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 140px 1fr',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '비용 항목' : isZh ? '成本项目' : 'Cost Item'}
          </div>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '설명' : isZh ? '说明' : 'Description'}
          </div>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '최적화 방법' : isZh ? '优化方法' : 'Optimization Method'}
          </div>
        </div>

        {costItems.map((item, idx) => (
          <div key={item.name} style={{
            display: 'grid',
            gridTemplateColumns: '140px 140px 1fr',
            borderBottom: idx < costItems.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '12px 14px',
              background: `${item.color}08`,
              fontSize: '13px',
              fontWeight: '700',
              color: item.color,
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.name}
            </div>
            <div style={{
              padding: '12px 14px',
              fontSize: '12px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.description}
            </div>
            <div style={{
              padding: '12px 14px',
              fontSize: '12px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.optimization}
            </div>
          </div>
        ))}

        <div style={{
          background: '#fffbeb',
          borderTop: '1px solid #fde68a',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#92400e'
        }}>
          <strong>{isKo ? '비용 최적화 전략:' : isZh ? '成本优化策略：' : 'Cost Optimization Strategy:'}</strong> {isKo
            ? '초기에는 전체 활성화로 가치를 검증한 후, 데이터 기반으로 불필요한 메트릭과 로그를 필터링하여 비용을 점진적으로 최적화하세요. AWS Cost Explorer와 CloudWatch Contributor Insights로 비용 구조를 분석할 수 있습니다.'
            : isZh ? '初期通过全面启用验证价值，然后基于数据过滤不必要的指标和日志，逐步优化成本。可使用 AWS Cost Explorer 和 CloudWatch Contributor Insights 分析成本结构。'
            : 'Initially validate value with full activation, then gradually optimize costs by filtering unnecessary metrics and logs based on data. Analyze cost structure using AWS Cost Explorer and CloudWatch Contributor Insights.'}
        </div>
      </div>
    </div>
  );
};

export default CostStructure;
