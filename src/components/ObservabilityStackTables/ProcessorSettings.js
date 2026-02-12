import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ProcessorSettings = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const processors = [
    {
      processor: 'memory_limiter',
      role: isKo ? 'OOM 방지' : isZh ? '防止 OOM' : 'Prevent OOM',
      settings: 'limit_mib: 512, spike_limit: 128'
    },
    {
      processor: 'batch',
      role: isKo ? '네트워크 효율화' : isZh ? '网络效率优化' : 'Network efficiency',
      settings: 'timeout: 10s, batch_size: 1024'
    },
    {
      processor: 'filter',
      role: isKo ? '불필요 메트릭 제거' : isZh ? '移除不必要的指标' : 'Remove unnecessary metrics',
      settings: isKo ? 'go_*, process_* 제외' : isZh ? '排除 go_*, process_*' : 'Exclude go_*, process_*'
    },
    {
      processor: 'resource',
      role: isKo ? '메타데이터 추가' : isZh ? '添加元数据' : 'Add metadata',
      settings: isKo ? 'cluster.name, region 부착' : isZh ? '附加 cluster.name, region' : 'Attach cluster.name, region'
    },
    {
      processor: 'resourcedetection',
      role: isKo ? '환경 자동 감지' : isZh ? '自动检测环境' : 'Auto-detect environment',
      settings: isKo ? 'EKS, EC2 감지기 활성화' : isZh ? '启用 EKS, EC2 检测器' : 'Enable EKS, EC2 detectors'
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
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '핵심 프로세서 설정' : isZh ? '核心处理器配置' : 'Core Processor Settings'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'ADOT Collector 파이프라인 최적화' : isZh ? 'ADOT Collector 管道优化' : 'ADOT Collector Pipeline Optimization'}
        </div>
      </div>

      {/* Table */}
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
          gridTemplateColumns: '180px 150px 1fr',
          borderBottom: '2px solid #e5e7eb',
          background: '#f8fafc'
        }}>
          <div style={{
            padding: '12px 14px',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '프로세서' : isZh ? '处理器' : 'Processor'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '역할' : isZh ? '作用' : 'Role'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '권장 설정' : isZh ? '推荐配置' : 'Recommended Settings'}
          </div>
        </div>

        {/* Data Rows */}
        {processors.map((item, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '180px 150px 1fr',
            borderBottom: idx < processors.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '14px',
              background: '#f8fafc',
              fontFamily: 'Monaco, Consolas, monospace',
              fontSize: '13px',
              fontWeight: '700',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.processor}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '13px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.role}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '13px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.settings}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessorSettings;
