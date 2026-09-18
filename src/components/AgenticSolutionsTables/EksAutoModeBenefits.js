import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const EksAutoModeBenefits = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["이점", "설명"] : ["이점", "설명"];
  const data = isKo ? [["**즉시 시작 가능**", "Karpenter 설치/구성 없이 클러스터 생성 즉시 GPU 워크로드 배포"], ["**자동 업그레이드**", "Karpenter, CNI, CSI 등 핵심 컴포넌트 자동 업데이트"], ["**보안 패치 자동화**", "보안 취약점 패치 자동 적용"], ["**커스텀 확장 가능**", "GPU NodePool, EFA NodeClass 등 필요시 커스텀 설정 추가"]] : [["**즉시 시작 가능**", "Karpenter 설치/구성 없이 클러스터 생성 즉시 GPU 워크로드 배포"], ["**자동 업그레이드**", "Karpenter, CNI, CSI 등 핵심 컴포넌트 자동 업데이트"], ["**보안 패치 자동화**", "보안 취약점 패치 자동 적용"], ["**커스텀 확장 가능**", "GPU NodePool, EFA NodeClass 등 필요시 커스텀 설정 추가"]];
  return <ManualTable title={isKo ? 'EKS Auto Mode 이점' : 'EKS Auto Mode Benefits'} headers={headers} rows={data} />;
};
export default EksAutoModeBenefits;
