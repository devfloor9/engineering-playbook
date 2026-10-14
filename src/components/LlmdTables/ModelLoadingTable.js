import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const ModelLoadingTable = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const methods = [{
    method: isKo ? 'HuggingFace Hub (최초)' : 'HuggingFace Hub (initial)',
    expectedTime: isKo ? '가장 느림' : 'Slowest',
    notes: isKo ? '전체 가중치 다운로드 + 로드. 모델 크기와 인터넷 대역폭에 비례' : 'Full weight download + load; scales with model size and internet bandwidth'
  }, {
    method: isKo ? 'S3 캐시 (같은 리전)' : 'S3 Cache (same region)',
    expectedTime: isKo ? '중간' : 'Faster',
    notes: isKo ? '같은 리전 S3에서 로드, 인터넷 다운로드 생략. S3 처리량에 의존' : 'Loads from same-region S3, skipping internet download; depends on S3 throughput'
  }, {
    method: isKo ? '노드 로컬 캐시' : 'Node Local Cache',
    expectedTime: isKo ? '가장 빠름' : 'Fastest',
    notes: isKo ? '동일 노드 재배포 시 가중치가 로컬 디스크에 존재. 로컬 디스크 I/O와 GPU 로드 시간만 소요' : 'Weights already on local disk when redeploying on the same node; only local disk I/O and GPU load remain'
  }];
  return <div style={{
    maxWidth: '800px',
    margin: '20px 0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px'
  }}>
      <div style={{
      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      color: 'white',
      padding: '16px 20px',
      borderRadius: '8px 8px 0 0',
      fontWeight: '600',
      fontSize: '16px'
    }}>
        {isKo ? '모델 로딩 방식별 상대 속도' : 'Relative Speed by Model Loading Method'}
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px'
    }}>
        <table style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}>
          <thead>
            <tr style={{
            background: 'var(--ifm-background-surface-color)'
          }}>
              <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontWeight: '600',
              color: 'var(--ifm-font-color-base)',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              minWidth: '200px'
            }}>
                {isKo ? '로딩 방식' : 'Loading Method'}
              </th>
              <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontWeight: '600',
              color: 'var(--ifm-font-color-base)',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              minWidth: '120px'
            }}>
                {isKo ? '상대 속도' : 'Relative Speed'}
              </th>
              <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontWeight: '600',
              color: 'var(--ifm-font-color-base)',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              minWidth: '250px'
            }}>
                {isKo ? '비고' : 'Notes'}
              </th>
            </tr>
          </thead>
          <tbody>
            {methods.map((method, index) => <tr key={index}>
                <td style={{
              padding: '12px 16px',
              fontWeight: '500',
              borderBottom: index < methods.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
            }}>
                  {method.method}
                </td>
                <td style={{
              padding: '12px 16px',
              color: '#dc2626',
              fontWeight: '600',
              borderBottom: index < methods.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
            }}>
                  {method.expectedTime}
                </td>
                <td style={{
              padding: '12px 16px',
              color: 'var(--ifm-color-emphasis-600)',
              borderBottom: index < methods.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
            }}>
                  {method.notes}
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
};
export default ModelLoadingTable;