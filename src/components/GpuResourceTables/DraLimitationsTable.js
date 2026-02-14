import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const DraLimitationsTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const limitations = [
    {
      limitation: isKo ? '정적 할당' : isZh ? '静态分配' : 'Static Allocation',
      description: isKo ? '노드 시작 시 리소스 수량 고정' : isZh ? '节点启动时固定资源数量' : 'Resource quantities fixed at node startup',
      impact: isKo ? 'GPU 부분 할당 불가능, 낮은 활용률' : isZh ? '无法部分分配 GPU，利用率低' : 'Cannot allocate partial GPU, low utilization'
    },
    {
      limitation: isKo ? '세분화 불가' : isZh ? '无法细粒度控制' : 'No Fine-Grained Control',
      description: isKo ? 'GPU 전체를 Pod에만 할당 가능' : isZh ? '只能将整个 GPU 分配给 Pod' : 'Can only allocate entire GPU to Pod',
      impact: isKo ? 'GPU 파티셔닝 미지원 (MIG 사용 불가)' : isZh ? '不支持 GPU 分区（无法使用 MIG）' : 'No GPU partitioning support (MIG unavailable)'
    },
    {
      limitation: isKo ? '우선순위 미지원' : isZh ? '不支持优先级' : 'No Priority Support',
      description: isKo ? '선착순 할당만 가능' : isZh ? '只能先到先得分配' : 'Only first-come-first-served allocation',
      impact: isKo ? 'QoS 클래스 미적용, 공정한 리소스 배분 어려움' : isZh ? 'QoS 类不适用，难以公平分配资源' : 'QoS classes not applied, difficult to ensure fair resource distribution'
    },
    {
      limitation: isKo ? '다이나믹 요구사항 미대응' : isZh ? '无法响应动态需求' : 'No Dynamic Requirements',
      description: isKo ? '런타임 리소스 변경 불가' : isZh ? '无法在运行时更改资源' : 'Cannot change resources at runtime',
      impact: isKo ? '초기 요청 값 고정, 스케일링 어려움' : isZh ? '初始请求值固定，难以扩展' : 'Initial request values fixed, difficult to scale'
    },
    {
      limitation: isKo ? '멀티 리소스 조정 불가' : isZh ? '无法协调多资源' : 'No Multi-Resource Coordination',
      description: isKo ? '여러 리소스 타입 조율 불가' : isZh ? '无法协调多种资源类型' : 'Cannot coordinate multiple resource types',
      impact: isKo ? 'Pod이 GPU 1개만 받았는데 메모리 부족 상황' : isZh ? 'Pod 只收到 1 个 GPU 但内存不足的情况' : 'Pod receives 1 GPU but insufficient memory scenario'
    }
  ];

  return (
    <div style={{
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
        <div style={{ fontSize: '18px', fontWeight: '600' }}>
          {isKo ? '⚠️ Device Plugin 모델의 근본적 한계' : isZh ? '⚠️ Device Plugin 模型的根本限制' : '⚠️ Fundamental Limitations of Device Plugin Model'}
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
                {isKo ? '한계점' : isZh ? '限制' : 'Limitation'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: 'var(--ifm-font-color-base)',
                width: '35%'
              }}>
                {isKo ? '설명' : isZh ? '说明' : 'Description'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: 'var(--ifm-font-color-base)',
                width: '45%'
              }}>
                {isKo ? '영향' : isZh ? '影响' : 'Impact'}
              </th>
            </tr>
          </thead>
          <tbody>
            {limitations.map((item, index) => (
              <tr
                key={index}
                style={{
                  borderBottom: index < limitations.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
                  background: index % 2 === 0 ? 'transparent' : 'var(--ifm-color-emphasis-50)'
                }}
              >
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DraLimitationsTable;
