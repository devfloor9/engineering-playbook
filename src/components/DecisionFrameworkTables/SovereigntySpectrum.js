import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const SovereigntySpectrum = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const data = [{
    level: isKo ? 'Public' : 'Public',
    control: isKo ? '낮음' : 'Low',
    ops: isKo ? '최소 (완전 매니지드)' : 'Minimal (fully managed)',
    workload: isKo ? '내부 생산성, 일반 SaaS' : 'Internal productivity, general SaaS'
  }, {
    level: isKo ? 'In-country' : 'In-country',
    control: isKo ? '중간' : 'Medium',
    ops: isKo ? '낮음 (Geo CRIS + SCP)' : 'Low (Geo CRIS + SCP)',
    workload: isKo ? '국내 금융, 공공 클라우드' : 'Domestic finance, public cloud'
  }, {
    level: isKo ? 'Hybrid' : 'Hybrid',
    control: isKo ? '높음' : 'High',
    ops: isKo ? '중간 (Hybrid Nodes 운영)' : 'Medium (Hybrid Nodes ops)',
    workload: isKo ? '제조, 자율주행 (데이터 중력)' : 'Manufacturing, autonomous driving (data gravity)'
  }, {
    level: isKo ? 'Air-gapped' : 'Air-gapped',
    control: isKo ? '최대' : 'Maximum',
    ops: isKo ? '높음 (온프레미스 전담)' : 'High (on-prem dedicated)',
    workload: isKo ? '국방, 기밀 연구' : 'Defense, classified research'
  }];
  return <ManualTable title={isKo ? '데이터 주권 스펙트럼: 통제력 vs 운영 부담' : 'Data Sovereignty Spectrum: Control vs Ops Burden'} headers={[isKo ? '주권 수준' : 'Sovereignty Level', isKo ? '통제력' : 'Control', isKo ? '운영 부담' : 'Ops Burden', isKo ? '대표 워크로드' : 'Representative Workload']} rows={data.map(row => [row.level, row.control, row.ops, row.workload])} />;
};
export default SovereigntySpectrum;
