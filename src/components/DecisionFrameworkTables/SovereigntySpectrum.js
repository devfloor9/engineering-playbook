import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const SovereigntySpectrum = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const data = [
    {
      level: isKo ? 'Public' : 'Public',
      control: isKo ? '낮음' : isZh ? '低' : 'Low',
      ops: isKo ? '최소 (완전 매니지드)' : isZh ? '最小（完全托管）' : 'Minimal (fully managed)',
      workload: isKo ? '내부 생산성, 일반 SaaS' : isZh ? '内部生产力、通用SaaS' : 'Internal productivity, general SaaS',
      color: '#e1f5ff'
    },
    {
      level: isKo ? 'In-country' : 'In-country',
      control: isKo ? '중간' : isZh ? '中' : 'Medium',
      ops: isKo ? '낮음 (Geo CRIS + SCP)' : isZh ? '低（Geo CRIS + SCP）' : 'Low (Geo CRIS + SCP)',
      workload: isKo ? '국내 금융, 공공 클라우드' : isZh ? '国内金融、公共云' : 'Domestic finance, public cloud',
      color: '#fff4e1'
    },
    {
      level: isKo ? 'Hybrid' : 'Hybrid',
      control: isKo ? '높음' : isZh ? '高' : 'High',
      ops: isKo ? '중간 (Hybrid Nodes 운영)' : isZh ? '中（Hybrid Nodes运营）' : 'Medium (Hybrid Nodes ops)',
      workload: isKo ? '제조, 자율주행 (데이터 중력)' : isZh ? '制造、自动驾驶（数据重力）' : 'Manufacturing, autonomous driving (data gravity)',
      color: '#ede9fe'
    },
    {
      level: isKo ? 'Air-gapped' : 'Air-gapped',
      control: isKo ? '최대' : isZh ? '最大' : 'Maximum',
      ops: isKo ? '높음 (온프레미스 전담)' : isZh ? '高（本地专属）' : 'High (on-prem dedicated)',
      workload: isKo ? '국방, 기밀 연구' : isZh ? '国防、机密研究' : 'Defense, classified research',
      color: '#e2e8f0'
    }
  ];

  return (
    <div style={{
      maxWidth: '900px',
      margin: '20px auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '15px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '데이터 주권 스펙트럼: 통제력 vs 운영 부담' : isZh ? '数据主权谱系：控制力 vs 运营负担' : 'Data Sovereignty Spectrum: Control vs Ops Burden'}
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--ifm-color-emphasis-100)' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? '주권 수준' : isZh ? '主权级别' : 'Sovereignty Level'}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? '통제력' : isZh ? '控制力' : 'Control'}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? '운영 부담' : isZh ? '运营负担' : 'Ops Burden'}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? '대표 워크로드' : isZh ? '代表性工作负载' : 'Representative Workload'}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} style={{ background: row.color }}>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)', fontWeight: '600', color: '#1a202c' }}>
                  {row.level}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)', color: '#2d3748' }}>
                  {row.control}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)', color: '#2d3748' }}>
                  {row.ops}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)', color: '#2d3748' }}>
                  {row.workload}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SovereigntySpectrum;
