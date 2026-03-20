import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const SectionHeader = ({ children, color }) => (
  <div style={{
    background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
    color: 'white',
    padding: '12px 20px',
    fontWeight: '600',
    fontSize: '15px',
    marginTop: '16px',
    borderRadius: '8px 8px 0 0',
  }}>
    {children}
  </div>
);

const Table = ({ headers, data }) => (
  <div style={{
    background: 'var(--ifm-background-surface-color)',
    border: '1px solid var(--ifm-color-emphasis-200)',
    borderTop: 'none',
    borderRadius: '0 0 8px 8px',
    overflowX: 'auto',
    marginBottom: '8px',
  }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
      <thead>
        <tr style={{
          background: 'var(--ifm-color-emphasis-100)',
          borderBottom: '2px solid var(--ifm-color-emphasis-300)',
        }}>
          {headers.map((h, i) => (
            <th key={i} style={{
              padding: '12px 16px', textAlign: 'left', fontWeight: '600',
              color: 'var(--ifm-font-color-base)', whiteSpace: 'nowrap',
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, ri) => (
          <tr key={ri} style={{ borderBottom: '1px solid var(--ifm-color-emphasis-200)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--ifm-color-emphasis-100)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            {row.map((cell, ci) => (
              <td key={ci} style={{
                padding: '12px 16px', color: 'var(--ifm-font-color-base)', verticalAlign: 'top',
              }}>
                {typeof cell === 'string' && cell.startsWith('**') && cell.endsWith('**')
                  ? <strong>{cell.slice(2, -2)}</strong>
                  : cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const EksClusterConfiguration = () => {
  const { i18n } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const controlPlaneHeaders = isKo
    ? ['항목', 'Standard (기본)', 'Provisioned Control Plane (PCP)']
    : ['Feature', 'Standard (Default)', 'Provisioned Control Plane (PCP)'];

  const controlPlaneData = isKo
    ? [
        ['**스케일링**', '동적 오토스케일링 (AWS 관리)', '고정 티어 (사전 프로비저닝)'],
        ['**API 동시성 (seats)**', '1,200 ~ 1,700 (동적)', 'XL: 1,700 / 2XL: 3,400 / 4XL: 6,800 / 8XL: 13,600'],
        ['**Pod 스케줄링 속도**', '50 ~ 100 pods/sec', 'XL: 100 / 2XL: 200 / 4XL~8XL: 400 pods/sec'],
        ['**Controller Manager**', '20 ~ 100 work/sec', 'XL: 100 / 2XL: 200 / 4XL~8XL: 400 work/sec'],
        ['**etcd DB 크기**', '10 GB', '20 GB'],
        ['**SLA**', '99.95%', '99.99%'],
        ['**비용**', '$0.10/hr ($73/월)', 'XL: $1.75 / 2XL: $3.50 / 4XL: $7.00 / 8XL: $14.00/hr'],
        ['**Tier 선택 기준**', '-', 'API Inflight Seats + Pod Scheduling Rate + etcd DB Size (노드 수 아님)'],
      ]
    : [
        ['**Scaling**', 'Dynamic auto-scaling (AWS managed)', 'Fixed tier (pre-provisioned)'],
        ['**API Concurrency (seats)**', '1,200–1,700 (dynamic)', 'XL: 1,700 / 2XL: 3,400 / 4XL: 6,800 / 8XL: 13,600'],
        ['**Pod Scheduling Rate**', '50–100 pods/sec', 'XL: 100 / 2XL: 200 / 4XL–8XL: 400 pods/sec'],
        ['**Controller Manager**', '20–100 work/sec', 'XL: 100 / 2XL: 200 / 4XL–8XL: 400 work/sec'],
        ['**etcd DB Size**', '10 GB', '20 GB'],
        ['**SLA**', '99.95%', '99.99%'],
        ['**Cost**', '$0.10/hr ($73/mo)', 'XL: $1.75 / 2XL: $3.50 / 4XL: $7.00 / 8XL: $14.00/hr'],
        ['**Tier Selection Criteria**', '-', 'API Inflight Seats + Pod Scheduling Rate + etcd DB Size (NOT node count)'],
      ];

  const dataPlaneHeaders = isKo
    ? ['항목', 'Managed Node Groups', 'Karpenter', 'EKS Auto Mode']
    : ['Feature', 'Managed Node Groups', 'Karpenter', 'EKS Auto Mode'];

  const dataPlaneData = isKo
    ? [
        ['**노드 프로비저닝**', '수동 (ASG 기반)', '자동 (Pod 요구사항 기반)', 'AWS 완전 자동'],
        ['**GPU 최적화**', '인스턴스 타입 수동 지정', '자동 GPU 선택 + 통합', '자동 + 기본 NodeClass 제공'],
        ['**스케일링 속도**', '느림 (ASG → EC2)', '빠름 (직접 EC2 API)', '빠름 (내장 Karpenter)'],
        ['**Add-on 관리**', '수동 (CNI, CSI 등)', '수동', '✅ 자동 (CNI, CSI, CoreDNS)'],
        ['**보안 패치**', '수동 AMI 업데이트', '수동', '✅ 자동 적용'],
        ['**비용 최적화**', '제한적', 'Consolidation + Spot', 'Consolidation + 7.5% 할증'],
        ['**운영 부담**', '높음', '중간', '낮음'],
      ]
    : [
        ['**Node Provisioning**', 'Manual (ASG-based)', 'Automatic (Pod-driven)', 'Fully automatic (AWS managed)'],
        ['**GPU Optimization**', 'Manual instance selection', 'Auto GPU selection', 'Auto + default NodeClass'],
        ['**Scaling Speed**', 'Slow (ASG → EC2)', 'Fast (direct EC2 API)', 'Fast (built-in Karpenter)'],
        ['**Add-on Mgmt**', 'Manual (CNI, CSI, etc.)', 'Manual', '✅ Automatic'],
        ['**Security Patches**', 'Manual AMI update', 'Manual', '✅ Automatic'],
        ['**Cost Optimization**', 'Limited', 'Consolidation + Spot', 'Consolidation + 7.5% surcharge'],
        ['**Operational Burden**', 'High', 'Medium', 'Low'],
      ];

  const comboHeaders = isKo
    ? ['조합', '컨트롤 플레인', '데이터 플레인', '적합한 시나리오']
    : ['Combination', 'Control Plane', 'Data Plane', 'Best For'];

  const comboData = isKo
    ? [
        ['일반 AI 서비스', 'Standard', 'Auto Mode', '소~중규모 추론 서비스, 운영 최소화'],
        ['GPU 최적화 플랫폼', 'Standard', 'Karpenter', '멀티 GPU, Spot 활용, 비용 최적화'],
        ['**대규모 AI 플랫폼**', '**PCP (tier-xl+)**', '**Auto Mode**', '**API 성능 보장 (1,700+ seats) + 운영 자동화**'],
        ['초대규모 학습 클러스터', 'PCP (tier-4xl+)', 'Karpenter', 'API 동시성 6,800+, GPU 세밀 제어 필요'],
      ]
    : [
        ['General AI Service', 'Standard', 'Auto Mode', 'Small-mid inference, minimal ops'],
        ['GPU-Optimized Platform', 'Standard', 'Karpenter', 'Multi-GPU, Spot, cost optimization'],
        ['**Large AI Platform**', '**PCP (tier-xl+)**', '**Auto Mode**', '**API perf guaranteed (1,700+ seats) + auto ops**'],
        ['Ultra-Scale Training', 'PCP (tier-4xl+)', 'Karpenter', 'API concurrency 6,800+, fine GPU control'],
      ];

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '20px auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <SectionHeader color="#232f3e">
        {isKo ? '⬆️ 컨트롤 플레인: Standard vs Provisioned (PCP)' : '⬆️ Control Plane: Standard vs Provisioned (PCP)'}
      </SectionHeader>
      <Table headers={controlPlaneHeaders} data={controlPlaneData} />

      <SectionHeader color="#ff9900">
        {isKo ? '⬇️ 데이터 플레인: MNG vs Karpenter vs Auto Mode' : '⬇️ Data Plane: MNG vs Karpenter vs Auto Mode'}
      </SectionHeader>
      <Table headers={dataPlaneHeaders} data={dataPlaneData} />

      <SectionHeader color="#527fff">
        {isKo ? '🔗 권장 조합 매트릭스' : '🔗 Recommended Combination Matrix'}
      </SectionHeader>
      <Table headers={comboHeaders} data={comboData} />
    </div>
  );
};

export default EksClusterConfiguration;
