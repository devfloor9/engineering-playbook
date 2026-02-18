import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const PerformanceBenchmarks = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const benchmarks = [
    {
      metric: isKo ? '쿼리 지연 (P99)' : isZh ? '查询延迟 (P99)' : 'Query Latency (P99)',
      target: '< 50ms',
      critical: '> 100ms',
      note: isKo ? '99%의 DNS 쿼리가 50ms 이내 완료' : isZh ? '99% 的 DNS 查询在 50ms 内完成' : '99% of DNS queries complete within 50ms'
    },
    {
      metric: isKo ? '처리량 (QPS/Pod)' : isZh ? '吞吐量 (QPS/Pod)' : 'Throughput (QPS/Pod)',
      target: '> 10K',
      critical: '< 5K',
      note: isKo ? 'Pod당 초당 10,000 쿼리 이상 처리' : isZh ? '每个 Pod 每秒处理超过 10,000 次查询' : 'Process 10,000+ queries per second per Pod'
    },
    {
      metric: isKo ? '캐시 적중률' : isZh ? '缓存命中率' : 'Cache Hit Ratio',
      target: '> 80%',
      critical: '< 50%',
      note: isKo ? 'TTL 30s 기준, 80% 이상 캐시 활용' : isZh ? 'TTL 30s 基准，80% 以上缓存利用' : '80%+ cache utilization with TTL 30s baseline'
    },
    {
      metric: isKo ? '오류율 (SERVFAIL)' : isZh ? '错误率 (SERVFAIL)' : 'Error Rate (SERVFAIL)',
      target: '< 0.1%',
      critical: '> 1%',
      note: isKo ? 'SERVFAIL 응답 비율 0.1% 미만 유지' : isZh ? 'SERVFAIL 响应比例保持在 0.1% 以下' : 'Keep SERVFAIL response ratio under 0.1%'
    },
    {
      metric: isKo ? 'CPU 사용률' : isZh ? 'CPU 使用率' : 'CPU Utilization',
      target: '< 60%',
      critical: '> 80%',
      note: isKo ? 'CPU 제한 도달 시 스로틀링으로 DNS 지연 발생' : isZh ? 'CPU 达到限制时，节流会导致 DNS 延迟' : 'CPU throttling at limit causes DNS latency'
    },
    {
      metric: isKo ? '메모리 사용률' : isZh ? '内存使用率' : 'Memory Utilization',
      target: '< 120Mi',
      critical: '> 150Mi',
      note: isKo ? 'EKS 기본 제한 170Mi. 150Mi 초과 시 경보 설정' : isZh ? 'EKS 默认限制 170Mi。超过 150Mi 时设置告警' : 'EKS default limit 170Mi. Alert above 150Mi'
    }
  ];

  const tuning = [
    {
      param: 'max_concurrent',
      defaultVal: '1000',
      tuned: '2000+',
      note: isKo ? '동시 질의 한계. 메모리 2KB × 동시 질의 수 고려' : isZh ? '并发查询限制。考虑内存 2KB × 并发查询数' : 'Concurrent query limit. Consider memory 2KB × concurrent queries'
    },
    {
      param: 'Replica Count',
      defaultVal: '2',
      tuned: isKo ? '노드 비례 자동' : isZh ? '按节点比例自动' : 'Auto-proportional',
      note: isKo ? 'Cluster Proportional Autoscaler 적용' : isZh ? '应用 Cluster Proportional Autoscaler' : 'Apply Cluster Proportional Autoscaler'
    },
    {
      param: 'lameduck',
      defaultVal: '5s',
      tuned: '30s',
      note: isKo ? '롤링 업데이트 시 DNS 실패 방지' : isZh ? '滚动更新时防止 DNS 故障' : 'Prevent DNS failures during rolling updates'
    }
  ];

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '760px',
      margin: '2rem auto',
      padding: '0 1rem'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '🎯 성능 벤치마크 & 튜닝 가이드' : isZh ? '🎯 性能基准 & 调优指南' : '🎯 Performance Benchmarks & Tuning Guide'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'CoreDNS 핵심 성능 목표치와 튜닝 파라미터' : isZh ? 'CoreDNS 核心性能目标和调优参数' : 'CoreDNS core performance targets and tuning parameters'}
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        overflow: 'hidden'
      }}>
        {/* Benchmarks header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 80px 80px 1fr',
          borderBottom: '2px solid #e5e7eb',
          background: '#f8fafc'
        }}>
          {[
            isKo ? '지표' : isZh ? '指标' : 'Metric',
            isKo ? '목표' : isZh ? '目标' : 'Target',
            isKo ? '임계' : isZh ? '临界' : 'Critical',
            isKo ? '설명' : isZh ? '说明' : 'Note'
          ].map((h, i) => (
            <div key={i} style={{
              padding: '10px 14px',
              fontWeight: '600',
              fontSize: '12px',
              color: '#6b7280',
              textTransform: 'uppercase',
              borderLeft: i > 0 ? '1px solid #e5e7eb' : 'none'
            }}>{h}</div>
          ))}
        </div>

        {/* Benchmark rows */}
        {benchmarks.map((b, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 80px 80px 1fr',
            borderBottom: idx < benchmarks.length - 1 ? '1px solid #f3f4f6' : '1px solid #e5e7eb'
          }}>
            <div style={{ padding: '10px 14px', fontWeight: '600', fontSize: '13px', color: '#1f2937', display: 'flex', alignItems: 'center' }}>
              {b.metric}
            </div>
            <div style={{ padding: '10px 14px', borderLeft: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#059669', fontWeight: '700', fontSize: '13px' }}>{b.target}</span>
            </div>
            <div style={{ padding: '10px 14px', borderLeft: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '12px' }}>{b.critical}</span>
            </div>
            <div style={{ padding: '10px 14px', borderLeft: '1px solid #f3f4f6', fontSize: '12px', color: '#4b5563', display: 'flex', alignItems: 'center' }}>
              {b.note}
            </div>
          </div>
        ))}

        {/* Tuning section */}
        <div style={{
          padding: '10px 20px',
          background: '#f8fafc',
          borderBottom: '1px solid #e5e7eb',
          fontSize: '12px',
          fontWeight: '600',
          color: '#6b7280',
          textTransform: 'uppercase'
        }}>
          {isKo ? '튜닝 파라미터' : isZh ? '调优参数' : 'Tuning Parameters'}
        </div>

        {tuning.map((t, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '140px 80px 100px 1fr',
            borderBottom: idx < tuning.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center' }}>
              <code style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>{t.param}</code>
            </div>
            <div style={{ padding: '10px 14px', borderLeft: '1px solid #f3f4f6', fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {t.defaultVal}
            </div>
            <div style={{ padding: '10px 14px', borderLeft: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#059669', fontWeight: '700', fontSize: '12px' }}>{t.tuned}</span>
            </div>
            <div style={{ padding: '10px 14px', borderLeft: '1px solid #f3f4f6', fontSize: '12px', color: '#4b5563', display: 'flex', alignItems: 'center' }}>
              {t.note}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        background: '#f5f3ff',
        border: '1px solid #ddd6fe',
        borderRadius: '0 0 8px 8px',
        padding: '12px 16px',
        fontSize: '12px',
        color: '#5b21b6',
        lineHeight: '1.6'
      }}>
        💡 <strong>{isKo ? '벤치마크 도구:' : isZh ? '基准测试工具:' : 'Benchmark Tool:'}</strong>{' '}
        <code style={{ background: '#ede9fe', padding: '1px 4px', borderRadius: '3px', fontSize: '11px' }}>dnsperf -s {'<COREDNS_IP>'} -d queries.txt -c 10 -T 10</code>
        {isKo ? ' 으로 CoreDNS QPS 및 레이턴시를 측정할 수 있습니다.' : isZh ? ' 测量 CoreDNS QPS 和延迟。' : ' to measure CoreDNS QPS and latency.'}
      </div>
    </div>
  );
};

export default PerformanceBenchmarks;
