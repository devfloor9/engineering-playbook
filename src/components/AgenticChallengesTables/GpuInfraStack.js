import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const GpuInfraStack = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const components = isKo ? [{
    name: 'DRA (Dynamic Resource Allocation)',
    version: 'v1beta1 (K8s 1.32+)',
    role: 'GPU 리소스 동적 할당, 네트워크 인터페이스 할당 (K8s 1.33+)',
    docs: 'GPU 리소스 관리'
  }, {
    name: 'DCGM (Data Center GPU Manager)',
    version: '3.3+',
    role: 'GPU 메트릭 수집, H100/H200 지원',
    docs: 'GPU 리소스 관리'
  }, {
    name: 'NCCL (NVIDIA Collective Communication Library)',
    version: 'latest',
    role: '멀티 GPU 통신 최적화',
    docs: 'NeMo 프레임워크'
  }, {
    name: 'Karpenter',
    version: 'v1.0+ (GA)',
    role: 'GPU 노드 자동 프로비저닝',
    docs: 'GPU 리소스 관리'
  }, {
    name: 'GPU Operator',
    version: 'v24.x',
    role: 'CUDA 12.x 지원, 드라이버 자동 관리',
    docs: 'GPU 리소스 관리'
  }] : [{
    name: 'DRA (Dynamic Resource Allocation)',
    version: 'v1beta1 (K8s 1.32+)',
    role: 'Dynamic GPU resource allocation, network interface allocation (K8s 1.33+)',
    docs: 'GPU Resource Management'
  }, {
    name: 'DCGM (Data Center GPU Manager)',
    version: '3.3+',
    role: 'GPU metrics collection, H100/H200 support',
    docs: 'GPU Resource Management'
  }, {
    name: 'NCCL (NVIDIA Collective Communication Library)',
    version: 'latest',
    role: 'Multi-GPU communication optimization',
    docs: 'NeMo Framework'
  }, {
    name: 'Karpenter',
    version: 'v1.0+ (GA)',
    role: 'GPU node automatic provisioning',
    docs: 'GPU Resource Management'
  }, {
    name: 'GPU Operator',
    version: 'v24.x',
    role: 'CUDA 12.x support, driver auto management',
    docs: 'GPU Resource Management'
  }];
  return <ManualTable title={isKo ? "GPU 인프라 스택" : "GPU Infrastructure Stack"} icon="cpu" description={isKo ? 'GPU 리소스 관리 및 최적화 컴포넌트' : 'GPU resource management and optimization components'} headers={[isKo ? "컴포넌트" : "Component", isKo ? "버전" : "Version", isKo ? "역할" : "Role", isKo ? "관련 문서" : "Related Documentation"]} rows={components.map(row => [row.name, row.version, row.role, row.docs])} />;
};
export default GpuInfraStack;
