import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const SpotInstancePricingInference = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["인스턴스 타입", "GPU", "GPU 메모리", "On-Demand", "Spot (평균)", "절감률", "적합 모델 크기"] : ["Component", "Purpose", "AWS Integration"];
  const data = isKo ? [["g5.xlarge", "1x A10G", "24GB", "$1.006", "$0.302", "70%", "7B 이하"], ["g5.2xlarge", "1x A10G", "24GB", "$1.212", "$0.364", "70%", "7B-13B"], ["g5.12xlarge", "4x A10G", "96GB", "$5.672", "$1.702", "70%", "13B-30B"], ["g5.48xlarge", "8x A10G", "192GB", "$16.288", "$4.886", "70%", "30B-70B"], ["p4d.24xlarge", "8x A100 40GB", "320GB", "$32.77", "$9.831", "70%", "70B+"], ["p5.48xlarge", "8x H100 80GB", "640GB", "$98.32", "$29.496", "70%", "100B+ MoE"]] : [["**DCGM-Exporter**", "Collect GPU metrics", "CloudWatch Container Insights"], ["**Karpenter GPU NodePool**", "Provision GPU nodes", "EC2 Spot API, CloudWatch metrics"], ["**CloudWatch Dashboard**", "Visualize GPU health", "Native AWS service"], ["**CloudWatch Alarms**", "Alert on GPU issues", "SNS notifications"], ["**IAM Roles (IRSA)**", "Secure S3 model access", "Pod-level permissions"]];
  return <ManualTable title={isKo ? 'Spot 인스턴스 가격 (추론용)' : 'Spot Instance Pricing (Inference)'} headers={headers} rows={data} numericColumns={isKo ? [2, 3, 4, 5] : []} />;
};
export default SpotInstancePricingInference;
