import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import DataTableFrame from '../DataTableFrame';
const GpuMemoryRequirements = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const models = [{
    model: 'Mixtral 8x7B',
    totalParams: '46.7B',
    activeParams: '12.9B',
    fp16Memory: '~94GB',
    int8Memory: '~47GB',
    recommendedGpu: '2x A100 80GB',
    color: '#3b82f6'
  }, {
    model: 'Mixtral 8x22B',
    totalParams: '141B',
    activeParams: '39B',
    fp16Memory: '~282GB',
    int8Memory: '~141GB',
    recommendedGpu: '4x H100 80GB',
    color: '#8b5cf6'
  }, {
    model: 'DeepSeek-V3',
    totalParams: '671B',
    activeParams: '37B',
    fp16Memory: '~800GB*',
    int8Memory: '~400GB*',
    recommendedGpu: '8x H100 80GB',
    color: '#10b981'
  }, {
    model: 'DeepSeek-MoE 16B',
    totalParams: '16.4B',
    activeParams: '2.8B',
    fp16Memory: '~33GB',
    int8Memory: '~17GB',
    recommendedGpu: '1x A100 40GB',
    color: '#f59e0b'
  }, {
    model: 'Qwen2.5-MoE-A14B',
    totalParams: '~50B',
    activeParams: '14B',
    fp16Memory: '~100GB',
    int8Memory: '~50GB',
    recommendedGpu: '2x A100 80GB',
    color: '#ec4899'
  }, {
    model: 'Qwen1.5-MoE-A2.7B',
    totalParams: '14.3B',
    activeParams: '2.7B',
    fp16Memory: '~29GB',
    int8Memory: '~15GB',
    recommendedGpu: '1x A100 40GB',
    color: '#06b6d4'
  }, {
    model: 'DBRX',
    totalParams: '132B',
    activeParams: '36B',
    fp16Memory: '~264GB',
    int8Memory: '~132GB',
    recommendedGpu: '4x H100 80GB',
    color: '#84cc16'
  }, {
    model: 'GLM-5',
    totalParams: '744B',
    activeParams: '40B',
    fp16Memory: '~1.5TB',
    int8Memory: '~744GB',
    recommendedGpu: '2x p5.48xlarge (PP=2)',
    color: '#ef4444'
  }, {
    model: 'Kimi K2.5',
    totalParams: '~1T',
    activeParams: '32B',
    fp16Memory: '~2TB',
    int8Memory: '~500GB',
    recommendedGpu: '1x p5.48xlarge (INT4)',
    color: '#6366f1'
  }];
  const columns = isKo
    ? ['모델', '총 파라미터', '활성 파라미터', 'FP16 메모리', 'INT8 메모리', '권장 GPU']
    : ['Model', 'Total parameters', 'Active parameters', 'FP16 memory', 'INT8 memory', 'Recommended GPU'];
  return (
    <DataTableFrame title={isKo ? 'MoE 모델 GPU 메모리 요구사항' : 'MoE model GPU memory requirements'} minWidth="58rem">
      <table>
        <thead><tr>{columns.map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{models.map(model => (
          <tr key={model.model}>
            <th scope="row">{model.model}</th>
            <td>{model.totalParams}</td><td>{model.activeParams}</td>
            <td>{model.fp16Memory}</td><td>{model.int8Memory}</td><td>{model.recommendedGpu}</td>
          </tr>
        ))}</tbody>
      </table>
    </DataTableFrame>
  );
};
export default GpuMemoryRequirements;
