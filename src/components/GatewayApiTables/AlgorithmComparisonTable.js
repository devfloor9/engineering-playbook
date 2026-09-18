import React from 'react';
import BaseTable from '../tables/BaseTable';

const data = {
  ko: [
    { algorithm: 'random', affinity: '동일 5-tuple의 일관된 선택을 제공하지 않음', addition: '새 연결은 갱신된 백엔드 집합에서 무작위 선택', removal: '제거된 백엔드는 새 연결 선택에서 제외', cpu: '구성·부하별 측정 필요', recommended: false },
    { algorithm: 'maglev', affinity: '동일 백엔드 집합·설정에서 5-tuple 기반 일관 선택', addition: '일부 매핑 재계산; 고정 10% 비율 없음', removal: '제거된 백엔드 외 일부 매핑도 재계산 가능', cpu: '구성·부하별 측정 필요', recommended: true },
  ],
  en: [
    { algorithm: 'random', affinity: 'No consistent selection for the same 5-tuple', addition: 'New connections select randomly from the updated backend set', removal: 'Removed backends are excluded from new selections', cpu: 'Measure for the configuration and load', recommended: false },
    { algorithm: 'maglev', affinity: 'Consistent 5-tuple selection for the same backend set and configuration', addition: 'Some mappings change; no fixed 10% rate', removal: 'Some mappings beyond the removed backend can also change', cpu: 'Measure for the configuration and load', recommended: true },
  ],
};

export default function AlgorithmComparisonTable({locale = 'ko'}) {
  const ko = locale === 'ko';
  const title = ko ? '로드밸런싱 알고리즘 비교' : 'Load Balancing Algorithm Comparison';
  const description = ko ? 'Cilium의 random vs maglev 알고리즘 특성' : 'Cilium random vs maglev algorithm characteristics';
  const headers = ko
    ? ['알고리즘', '연결 고정성', '백엔드 추가 시', '백엔드 제거 시', 'CPU 오버헤드']
    : ['Algorithm', 'Connection Affinity', 'Backend Addition', 'Backend Removal', 'CPU Overhead'];
  const rows = data[locale].map(row => ({
    id: row.algorithm,
    highlighted: row.recommended,
    cells: [
      <><code>{row.algorithm}</code>{row.recommended && <span> · {ko ? '추천' : 'Recommended'}</span>}</>,
      row.affinity, row.addition, row.removal, row.cpu,
    ],
  }));
  return <BaseTable caption={title} description={description} headers={headers}
    rows={rows} rowHeaderColumn={0} minWidth="48rem" />;
}
