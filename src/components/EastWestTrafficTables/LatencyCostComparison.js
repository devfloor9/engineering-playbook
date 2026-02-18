import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const LatencyCostComparison = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const options = [
    {
      name: 'ClusterIP',
      latency: isKo ? 'kube-proxy NAT 처리 (µs~ms). 직접 연결 대비 미세한 오버헤드' : isZh ? 'kube-proxy NAT 处理（µs~ms）。相比直连有微小开销' : 'kube-proxy NAT (µs~ms). Minimal overhead vs direct',
      cost: isKo ? '별도 비용 없음. Cross-AZ 시 $0.01/GB' : isZh ? '无额外费用。Cross-AZ 时 $0.01/GB' : 'No extra cost. $0.01/GB for cross-AZ',
      latencyScore: 5,
      costScore: 5
    },
    {
      name: 'Headless',
      latency: isKo ? '프록시 미경유, 추가 지연 거의 0. DNS 조회에만 시간 소요' : isZh ? '不经代理，几乎无额外延迟。仅 DNS 查询耗时' : 'No proxy, near-zero added latency. Only DNS lookup time',
      cost: isKo ? '별도 비용 없음. Cross-AZ 비용 동일' : isZh ? '无额外费用。Cross-AZ 成本相同' : 'No extra cost. Same cross-AZ cost',
      latencyScore: 5,
      costScore: 5
    },
    {
      name: isKo ? 'Internal NLB (Instance)' : 'Internal NLB (Instance)',
      latency: isKo ? '수ms + NodePort 1홉 추가 + kube-proxy 추가 홉 가능' : isZh ? '数ms + NodePort 1 跳 + 可能额外 kube-proxy 跳' : 'Few ms + NodePort hop + possible kube-proxy hop',
      cost: isKo ? 'NLB 시간당 + 데이터 GB당 + cross-AZ 비용 증가' : isZh ? 'NLB 每小时 + 数据 GB + cross-AZ 成本增加' : 'NLB hourly + data GB + increased cross-AZ cost',
      latencyScore: 3,
      costScore: 2
    },
    {
      name: isKo ? 'Internal NLB (IP)' : 'Internal NLB (IP)',
      latency: isKo ? '수ms. Pod로 직접 연결되어 NodePort 홉 없음' : isZh ? '数ms。直连 Pod，无 NodePort 跳转' : 'Few ms. Direct to Pod, no NodePort hop',
      cost: isKo ? 'NLB 비용 발생, 교차 AZ 트래픽 회피로 비용 절감' : isZh ? 'NLB 费用，通过避免跨 AZ 流量节省成本' : 'NLB cost, savings from avoiding cross-AZ traffic',
      latencyScore: 4,
      costScore: 3
    },
    {
      name: 'Internal ALB',
      latency: isKo ? '수~수십ms (L7 규칙 처리, 요청 크기/규칙 수에 비례)' : isZh ? '数~数十ms（L7 规则处理，与请求大小/规则数成正比）' : 'ms to tens of ms (L7 rule processing, proportional to request size/rules)',
      cost: isKo ? 'ALB 시간당($0.0225/h) + LCU 비용. Cross-Zone 무료' : isZh ? 'ALB 每小时（$0.0225/h）+ LCU 费用。Cross-Zone 免费' : 'ALB hourly ($0.0225/h) + LCU. Free cross-zone',
      latencyScore: 2,
      costScore: 2
    },
    {
      name: 'Istio Sidecar',
      latency: isKo ? '~5ms 증가 (클라이언트+서버 2회 프록시)' : isZh ? '~5ms 增加（客户端+服务端 2 次代理）' : '~5ms added (client+server 2x proxy)',
      cost: isKo ? '오픈소스, 프록시당 0.2 vCPU/60MB per 1000rps' : isZh ? '开源，每代理 0.2 vCPU/60MB per 1000rps' : 'Open source, 0.2 vCPU/60MB per proxy per 1000rps',
      latencyScore: 3,
      costScore: 3
    },
    {
      name: 'Cilium ClusterMesh',
      latency: isKo ? 'Pod→Pod 직접. VXLAN 캡슐화 오버헤드 수십µs' : isZh ? 'Pod→Pod 直连。VXLAN 封装开销数十µs' : 'Pod→Pod direct. VXLAN encap overhead tens of µs',
      cost: isKo ? 'AWS 서비스 비용 없음. 데이터 전송 비용만' : isZh ? '无 AWS 服务费用。仅数据传输费' : 'No AWS service cost. Data transfer only',
      latencyScore: 5,
      costScore: 5
    },
    {
      name: 'VPC Lattice',
      latency: isKo ? 'Managed proxy 경유, HTTP 요청당 수ms' : isZh ? '经托管代理，每 HTTP 请求数ms' : 'Managed proxy, few ms per HTTP request',
      cost: '$0.025/h + $0.025/GB + $0.1/1M req',
      latencyScore: 3,
      costScore: 1
    }
  ];

  const renderScore = (score) => {
    const dots = [];
    for (let i = 0; i < 5; i++) {
      dots.push(
        <span key={i} style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: i < score ? '#059669' : '#e5e7eb',
          marginRight: '2px'
        }} />
      );
    }
    return <span style={{ display: 'inline-flex', alignItems: 'center' }}>{dots}</span>;
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '760px',
      margin: '2rem auto',
      padding: '0 1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #581c87 0%, #7e22ce 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '⚡ 옵션별 지연 및 비용 비교' : isZh ? '⚡ 各选项延迟与成本对比' : '⚡ Latency & Cost Comparison by Option'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'East-West 트래픽 경로별 성능·비용 정량 비교' : isZh ? 'East-West 流量路径的性能·成本定量对比' : 'Quantitative performance & cost comparison by traffic path'}
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr 60px 60px',
          borderBottom: '2px solid #e5e7eb',
          background: '#f8fafc'
        }}>
          {[
            isKo ? '옵션' : isZh ? '选项' : 'Option',
            isKo ? '지연 특성 / 비용 구조' : isZh ? '延迟特性 / 成本结构' : 'Latency / Cost',
            isKo ? '지연' : isZh ? '延迟' : 'Latency',
            isKo ? '비용' : isZh ? '成本' : 'Cost'
          ].map((h, i) => (
            <div key={i} style={{
              padding: '10px 12px',
              fontWeight: '600',
              fontSize: '11px',
              color: '#6b7280',
              textTransform: 'uppercase',
              borderLeft: i > 0 ? '1px solid #e5e7eb' : 'none'
            }}>{h}</div>
          ))}
        </div>

        {options.map((opt, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr 60px 60px',
            borderBottom: idx < options.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '10px 12px',
              fontWeight: '600',
              fontSize: '13px',
              color: '#1f2937',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center'
            }}>
              {opt.name}
            </div>
            <div style={{ padding: '10px 12px', borderLeft: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '2px' }}>{opt.latency}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{opt.cost}</div>
            </div>
            <div style={{
              padding: '10px 12px',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {renderScore(opt.latencyScore)}
            </div>
            <div style={{
              padding: '10px 12px',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {renderScore(opt.costScore)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LatencyCostComparison;
