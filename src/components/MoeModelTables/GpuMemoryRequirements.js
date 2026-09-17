import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import DataTableFrame from '../DataTableFrame';
import models from '../../data/moe-memory-models.json';

export default function GpuMemoryRequirements() {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const columns = isKo
    ? ['모델', '총 파라미터 (B)', '활성 파라미터 (B)', '16-bit 가중치 (GB)', '8-bit 가중치 (GB)', '4-bit 가중치 (GB)']
    : ['Model', 'Total parameters (B)', 'Active parameters (B)', '16-bit weights (GB)', '8-bit weights (GB)', '4-bit weights (GB)'];
  const weightSize = (parameters, bytes) => Number((parameters * bytes).toFixed(1)).toLocaleString('en-US');
  return <DataTableFrame title={isKo ? 'MoE 가중치 크기 산술 추정 — 런타임 메모리 제외' : 'MoE weight-size estimates — runtime memory excluded'} minWidth="58rem">
    <table>
      <thead><tr>{columns.map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody>{models.map(model => <tr key={model.model}>
        <th scope="row">{model.model}</th>
        <td>{model.totalBillions}</td><td>{model.activeBillions}</td>
        {[2, 1, 0.5].map(bytes => <td key={bytes}>{weightSize(model.totalBillions, bytes)}</td>)}
      </tr>)}</tbody>
    </table>
  </DataTableFrame>;
}
