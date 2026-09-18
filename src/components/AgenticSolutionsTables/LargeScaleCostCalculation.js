import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const LargeScaleCostCalculation = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["구성", "월간 비용", "연간 비용"] : ["Configuration", "Monthly Cost", "Savings"];
  const data = isKo ? [["On-Demand", "$189,619", "$2,275,430"], ["Savings Plans 1년 (35% 절감)", "$123,252", "$1,479,030"], ["**절감액**", "**$66,367**", "**$796,400**"]] : [["**Baseline (On-Demand g5.2xlarge)**", "$12,100", "-"], ["**With Spot (70% coverage)**", "$4,235", "65%"], ["**+ Consolidation (30% idle reduction)**", "$2,965", "75%"], ["**+ Right-sizing (20% better packing)**", "$2,372", "80%"]];
  return <ManualTable title={isKo ? '대규모 비용 계산 (p5.48xlarge)' : 'Large Scale Cost Calculation (p5.48xlarge)'} headers={headers} rows={data} numericColumns={[1, 2]} />;
};
export default LargeScaleCostCalculation;
