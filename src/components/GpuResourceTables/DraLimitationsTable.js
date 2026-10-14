import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const DraLimitationsTable = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const limitations = [{
    limitation: isKo ? '정적 등록' : 'Static Registration',
    description: isKo ? '리소스 종류·수량이 노드 시작 시 고정' : 'Resource kinds and counts fixed at node startup',
    impact: isKo ? '공유 모드(MIG·Time-Slicing·MPS)도 사전 구성해야 하며, Pod가 런타임에 레이아웃을 바꿀 수 없음' : 'Sharing modes (MIG, Time-Slicing, MPS) must be preconfigured; a Pod cannot change the layout at runtime'
  }, {
    limitation: isKo ? '속성 기반 선택 불가' : 'No Attribute-Based Selection',
    description: isKo ? '고정된 리소스 이름(nvidia.com/gpu 등)으로만 요청' : 'Requests only fixed resource names (e.g. nvidia.com/gpu)',
    impact: isKo ? 'GPU 모델이나 MIG 프로필을 조건으로 고를 수 없음 (예: "20GB 이상 MIG")' : 'Cannot select by GPU model or MIG profile as a condition (e.g. "a MIG profile with ≥20GB")'
  }, {
    limitation: isKo ? '선착순 할당' : 'First-Come-First-Served Allocation',
    description: isKo ? 'kubelet이 요청 순서대로 디바이스를 넘겨줌' : 'kubelet hands out devices in request order',
    impact: isKo ? '우선순위·선점은 Pod Priority/Preemption 등 스케줄러 기능으로 별도 구성해야 함 (Device Plugin 자체는 공정성을 보장하지 않음)' : 'Priority/preemption must be arranged via scheduler features (Pod Priority/Preemption); the Device Plugin itself does not provide fairness'
  }, {
    limitation: isKo ? '런타임 요구사항 변경 불가' : 'No Runtime Requirement Changes',
    description: isKo ? '초기 요청 값이 Pod 수명 동안 고정' : 'Initial request values are fixed for the Pod lifetime',
    impact: isKo ? '수요 변화에 따라 할당을 재협상할 수 없음' : 'Allocation cannot be renegotiated as demand changes'
  }, {
    limitation: isKo ? '디바이스 간 조율 부재' : 'No Cross-Device Coordination',
    description: isKo ? '여러 디바이스 타입 요청을 스케줄링 시점에 함께 매칭하지 못함' : 'Cannot jointly match requests for multiple device types at schedule time',
    impact: isKo ? '예: GPU와 특정 NIC를 같은 토폴로지로 묶어 선택하는 요구를 한 번에 표현할 수 없음 (CPU·메모리 등 코어 리소스 적합성은 kube-scheduler가 별도로 처리)' : 'E.g. cannot express "a GPU and a specific NIC on the same topology" as one request (core resources like CPU/memory fit are handled separately by kube-scheduler)'
  }];
  return <div style={{
    maxWidth: '1000px',
    margin: '20px auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  }}>
      <div style={{
      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      color: 'white',
      padding: '16px 20px',
      borderRadius: '8px 8px 0 0'
    }}>
        <div style={{
        fontSize: '18px',
        fontWeight: '600'
      }}>
          {isKo ? '⚠️ Device Plugin 모델의 근본적 한계' : '⚠️ Fundamental Limitations of Device Plugin Model'}
        </div>
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px',
      overflow: 'hidden'
    }}>
        <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px'
      }}>
          <thead>
            <tr style={{
            background: 'var(--ifm-color-emphasis-100)',
            borderBottom: '2px solid var(--ifm-color-emphasis-300)'
          }}>
              <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontWeight: '600',
              color: 'var(--ifm-font-color-base)',
              width: '20%'
            }}>
                {isKo ? '한계점' : 'Limitation'}
              </th>
              <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontWeight: '600',
              color: 'var(--ifm-font-color-base)',
              width: '35%'
            }}>
                {isKo ? '설명' : 'Description'}
              </th>
              <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontWeight: '600',
              color: 'var(--ifm-font-color-base)',
              width: '45%'
            }}>
                {isKo ? '영향' : 'Impact'}
              </th>
            </tr>
          </thead>
          <tbody>
            {limitations.map((item, index) => <tr key={index} style={{
            borderBottom: index < limitations.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
            background: index % 2 === 0 ? 'transparent' : 'var(--ifm-color-emphasis-50)'
          }}>
                <td style={{
              padding: '12px 16px',
              color: '#dc2626',
              fontWeight: '600'
            }}>
                  {item.limitation}
                </td>
                <td style={{
              padding: '12px 16px',
              color: 'var(--ifm-font-color-base)'
            }}>
                  {item.description}
                </td>
                <td style={{
              padding: '12px 16px',
              color: 'var(--ifm-font-color-base)'
            }}>
                  {item.impact}
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
};
export default DraLimitationsTable;