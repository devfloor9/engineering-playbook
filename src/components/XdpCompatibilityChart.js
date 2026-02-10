import React from 'react';
import { useColorMode } from '@docusaurus/theme-common';

const i18n = {
  en: {
    sectionPrerequisites: 'Prerequisites',
    sectionNicDriver: 'NIC Driver Compatibility',
    sectionAwsEc2: 'AWS EC2 XDP Support',
    sectionOptimizations: 'Achievable Without XDP',

    // Prerequisites
    requirement: 'Requirement',
    condition: 'Condition',
    notes: 'Notes',
    linuxKernel: 'Linux Kernel',
    nicDriver: 'NIC Driver',
    ciliumConfig: 'Cilium Config',
    interface: 'Interface',
    xdpNativeCapable: 'XDP Native-capable',
    kubeProxyReplacement: 'kube-proxy replacement required',
    physicalNic: 'Physical NIC',
    noBondVlan: 'No bond/VLAN',
    bpfLinkSupport: 'bpf_link support >= 5.7',

    // NIC Driver
    driver: 'Driver',
    xdpNative: 'XDP Native',
    minKernel: 'Min Kernel',
    environment: 'Environment',
    fullSupport: 'Full',
    supported: 'Supported',
    limitedSupport: 'Limited',
    genericOnly: 'Generic only',
    bareMetal: 'Bare Metal',
    awsEc2: 'AWS EC2',
    kvmQemu: 'KVM/QEMU',
    bestRecommended: 'Best, recommended',
    stable: 'Stable',
    seeAwsBelow: 'See AWS below',
    noNative: 'No native',

    // AWS EC2
    instanceType: 'Instance Type',
    reason: 'Reason',
    directHardwareAccess: 'Direct hardware access',
    enaLacksBpfLink: 'ENA lacks bpf_link',
    srdProtocol: 'SRD protocol, unrelated to XDP',
    sameEnaConstraint: 'Same ENA constraint',

    // Optimizations
    tuningItem: 'Tuning Item',
    effect: 'Effect',
    socketLevelLb: 'Socket-level LB',
    socketLbEffect: 'Direct connection at connect(), no per-packet NAT',
    bpfHostRouting: 'BPF Host Routing',
    hostRoutingEffect: 'Complete host iptables bypass',
    bpfMasquerade: 'BPF Masquerade',
    bpfMasqEffect: 'iptables MASQUERADE → eBPF',
    bandwidthManager: 'Bandwidth Manager + BBR',
    bandwidthEffect: 'EDT rate limiting + BBR',
    nativeRouting: 'Native Routing (ENI)',
    nativeRoutingEffect: 'VXLAN encap removed',
    highlightBox: '36% RTT improvement achieved without XDP or DSR'
  },
  ko: {
    sectionPrerequisites: '필수 요구사항',
    sectionNicDriver: 'NIC 드라이버 XDP 호환성',
    sectionAwsEc2: 'AWS EC2 인스턴스별 XDP 지원',
    sectionOptimizations: 'XDP 없이 달성 가능한 최적화',

    // Prerequisites
    requirement: '요구사항',
    condition: '조건',
    notes: '비고',
    linuxKernel: 'Linux 커널',
    nicDriver: 'NIC 드라이버',
    ciliumConfig: 'Cilium 설정',
    interface: '인터페이스',
    xdpNativeCapable: 'XDP Native 지원',
    kubeProxyReplacement: 'kube-proxy 대체 필수',
    physicalNic: '물리 NIC',
    noBondVlan: 'bond/VLAN 미지원',
    bpfLinkSupport: 'bpf_link 지원 >= 5.7',

    // NIC Driver
    driver: '드라이버',
    xdpNative: 'XDP Native',
    minKernel: '최소 커널',
    environment: '환경',
    fullSupport: '완전 지원',
    supported: '지원',
    limitedSupport: '제한적',
    genericOnly: 'Generic만',
    bareMetal: 'Bare Metal',
    awsEc2: 'AWS EC2',
    kvmQemu: 'KVM/QEMU',
    bestRecommended: '최적, 권장',
    stable: '안정적',
    seeAwsBelow: '아래 AWS 참조',
    noNative: 'Native 미지원',

    // AWS EC2
    instanceType: '인스턴스 유형',
    reason: '이유',
    directHardwareAccess: '하드웨어 직접 접근',
    enaLacksBpfLink: 'bpf_link 미구현',
    srdProtocol: 'SRD 프로토콜, XDP와 무관',
    sameEnaConstraint: '동일 ENA 제약',

    // Optimizations
    tuningItem: '튜닝 항목',
    effect: '효과',
    socketLevelLb: 'Socket-level LB',
    socketLbEffect: 'connect() 시점 직접 연결, per-packet NAT 없음',
    bpfHostRouting: 'BPF Host Routing',
    hostRoutingEffect: '호스트 iptables 완전 우회',
    bpfMasquerade: 'BPF Masquerade',
    bpfMasqEffect: 'iptables MASQUERADE → eBPF',
    bandwidthManager: 'Bandwidth Manager + BBR',
    bandwidthEffect: 'EDT 기반 rate limiting + BBR',
    nativeRouting: 'Native Routing (ENI)',
    nativeRoutingEffect: 'VXLAN 캡슐화 제거',
    highlightBox: 'XDP와 DSR 없이 RTT 36% 개선 달성'
  }
};

export default function XdpCompatibilityChart({ locale = 'en' }) {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const t = i18n[locale] || i18n.en;

  const containerStyle = {
    width: '100%',
    padding: '20px 0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    lineHeight: '1.6'
  };

  const sectionStyle = {
    marginBottom: '24px',
    borderBottom: '1px solid ' + (isDark ? '#334155' : '#e5e7eb'),
    paddingBottom: '16px'
  };

  const lastSectionStyle = {
    marginBottom: '20px'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '12px',
    backgroundColor: isDark ? '#1e293b' : '#ffffff'
  };

  const thStyle = {
    backgroundColor: isDark ? '#0f172a' : '#f5f5f5',
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    borderBottom: isDark ? '2px solid #334155' : '2px solid #e0e0e0',
    color: isDark ? '#cbd5e1' : '#333'
  };

  const tdStyle = {
    padding: '12px',
    borderBottom: isDark ? '1px solid #334155' : '1px solid #e0e0e0',
    verticalAlign: 'top',
    color: isDark ? '#e2e8f0' : 'inherit'
  };

  const pillStyle = (color) => ({
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: color
  });

  const highlightBoxStyle = {
    backgroundColor: isDark ? 'rgba(0, 120, 212, 0.15)' : '#e8f4f8',
    border: isDark ? '2px solid #3b82f6' : '2px solid #0078d4',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '20px',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '15px',
    color: isDark ? '#60a5fa' : '#0078d4'
  };

  return (
    <div style={containerStyle}>
      {/* Section 1: Prerequisites */}
      <div style={sectionStyle}>
        <div style={{overflowX: 'auto'}}>
          <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>{t.requirement}</th>
              <th style={thStyle}>{t.condition}</th>
              <th style={thStyle}>{t.notes}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>{t.linuxKernel}</td>
              <td style={tdStyle}>&gt;= 5.10</td>
              <td style={tdStyle}>{t.bpfLinkSupport}</td>
            </tr>
            <tr>
              <td style={tdStyle}>{t.nicDriver}</td>
              <td style={tdStyle}>{t.xdpNativeCapable}</td>
              <td style={tdStyle}>See compatibility below</td>
            </tr>
            <tr>
              <td style={tdStyle}>{t.ciliumConfig}</td>
              <td style={tdStyle}>kubeProxyReplacement=true</td>
              <td style={tdStyle}>{t.kubeProxyReplacement}</td>
            </tr>
            <tr>
              <td style={tdStyle}>{t.interface}</td>
              <td style={tdStyle}>{t.physicalNic}</td>
              <td style={tdStyle}>{t.noBondVlan}</td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      {/* Section 2: NIC Driver Compatibility */}
      <div style={sectionStyle}>
        <div style={{overflowX: 'auto'}}>
          <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>{t.driver}</th>
              <th style={thStyle}>{t.xdpNative}</th>
              <th style={thStyle}>{t.minKernel}</th>
              <th style={thStyle}>{t.environment}</th>
              <th style={thStyle}>{t.notes}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>mlx5 (Mellanox ConnectX-4/5/6)</td>
              <td style={tdStyle}>
                <span style={pillStyle('#28a745')}>✅ {t.fullSupport}</span>
              </td>
              <td style={tdStyle}>&gt;= 4.9</td>
              <td style={tdStyle}>{t.bareMetal}</td>
              <td style={tdStyle}>{t.bestRecommended}</td>
            </tr>
            <tr>
              <td style={tdStyle}>i40e (Intel XL710)</td>
              <td style={tdStyle}>
                <span style={pillStyle('#28a745')}>✅ {t.fullSupport}</span>
              </td>
              <td style={tdStyle}>&gt;= 4.12</td>
              <td style={tdStyle}>{t.bareMetal}</td>
              <td style={tdStyle}>{t.stable}</td>
            </tr>
            <tr>
              <td style={tdStyle}>ixgbe (Intel 82599)</td>
              <td style={tdStyle}>
                <span style={pillStyle('#28a745')}>✅ {t.fullSupport}</span>
              </td>
              <td style={tdStyle}>&gt;= 4.12</td>
              <td style={tdStyle}>{t.bareMetal}</td>
              <td style={tdStyle}>10GbE</td>
            </tr>
            <tr>
              <td style={tdStyle}>bnxt_en (Broadcom)</td>
              <td style={tdStyle}>
                <span style={pillStyle('#28a745')}>✅ {t.supported}</span>
              </td>
              <td style={tdStyle}>&gt;= 4.11</td>
              <td style={tdStyle}>{t.bareMetal}</td>
              <td style={tdStyle}>-</td>
            </tr>
            <tr>
              <td style={tdStyle}>ena (AWS ENA)</td>
              <td style={tdStyle}>
                <span style={pillStyle('#ffc107')}>⚠️ {t.limitedSupport}</span>
              </td>
              <td style={tdStyle}>&gt;= 5.6</td>
              <td style={tdStyle}>{t.awsEc2}</td>
              <td style={tdStyle}>{t.seeAwsBelow}</td>
            </tr>
            <tr>
              <td style={tdStyle}>virtio-net</td>
              <td style={tdStyle}>
                <span style={pillStyle('#ffc107')}>⚠️ {t.genericOnly}</span>
              </td>
              <td style={tdStyle}>&gt;= 4.10</td>
              <td style={tdStyle}>{t.kvmQemu}</td>
              <td style={tdStyle}>{t.noNative}</td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      {/* Section 3: AWS EC2 Support */}
      <div style={sectionStyle}>
        <div style={{overflowX: 'auto'}}>
          <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>{t.instanceType}</th>
              <th style={thStyle}>{t.xdpNative}</th>
              <th style={thStyle}>{t.reason}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>Bare Metal (c5.metal, m6i.metal...)</td>
              <td style={tdStyle}>
                <span style={pillStyle('#28a745')}>✅ {t.supported}</span>
              </td>
              <td style={tdStyle}>{t.directHardwareAccess}</td>
            </tr>
            <tr>
              <td style={tdStyle}>Virtualized (m6i.xlarge, c6i...)</td>
              <td style={tdStyle}>
                <span style={pillStyle('#dc3545')}>❌ Unsupported</span>
              </td>
              <td style={tdStyle}>{t.enaLacksBpfLink}</td>
            </tr>
            <tr>
              <td style={tdStyle}>ENA Express (c6in, m6in...)</td>
              <td style={tdStyle}>
                <span style={pillStyle('#dc3545')}>❌ Unsupported</span>
              </td>
              <td style={tdStyle}>{t.srdProtocol}</td>
            </tr>
            <tr>
              <td style={tdStyle}>Graviton (m7g, c7g...)</td>
              <td style={tdStyle}>
                <span style={pillStyle('#dc3545')}>❌ Unsupported</span>
              </td>
              <td style={tdStyle}>{t.sameEnaConstraint}</td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      {/* Section 4: Optimizations Without XDP */}
      <div style={lastSectionStyle}>
        <div style={{overflowX: 'auto'}}>
          <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>{t.tuningItem}</th>
              <th style={thStyle}>{t.effect}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>{t.socketLevelLb}</td>
              <td style={tdStyle}>{t.socketLbEffect}</td>
            </tr>
            <tr>
              <td style={tdStyle}>{t.bpfHostRouting}</td>
              <td style={tdStyle}>{t.hostRoutingEffect}</td>
            </tr>
            <tr>
              <td style={tdStyle}>{t.bpfMasquerade}</td>
              <td style={tdStyle}>{t.bpfMasqEffect}</td>
            </tr>
            <tr>
              <td style={tdStyle}>{t.bandwidthManager}</td>
              <td style={tdStyle}>{t.bandwidthEffect}</td>
            </tr>
            <tr>
              <td style={tdStyle}>{t.nativeRouting}</td>
              <td style={tdStyle}>{t.nativeRoutingEffect}</td>
            </tr>
          </tbody>
        </table>
        </div>

        <div style={highlightBoxStyle}>
          {t.highlightBox}
        </div>
      </div>
    </div>
  );
}
