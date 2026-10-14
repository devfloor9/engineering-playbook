import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const CheckpointSharding = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const data = [{
    modelSize: '70B',
    shardSize: '10GB',
    estimatedShards: isKo ? '~14 샤드 (BF16 가중치)' : '~14 shards (BF16 weights)',
    saveTime: isKo ? '구성에 따라 다름' : 'Depends on setup',
    color: '#4285f4'
  }, {
    modelSize: '175B',
    shardSize: '10GB',
    estimatedShards: isKo ? '~35 샤드 (BF16 가중치)' : '~35 shards (BF16 weights)',
    saveTime: isKo ? '구성에 따라 다름' : 'Depends on setup',
    color: '#fbbc04'
  }, {
    modelSize: '405B',
    shardSize: '10GB',
    estimatedShards: isKo ? '~81 샤드 (BF16 가중치)' : '~81 shards (BF16 weights)',
    saveTime: isKo ? '구성에 따라 다름' : 'Depends on setup',
    color: '#ea4335'
  }];
  const note = isKo
    ? '예상 샤드 수는 "BF16 가중치만 저장(파라미터수 × 2바이트)"을 10GB 샤드로 나눈 가정값입니다(예: 405B → 810GB / 10GB ≈ 81). 옵티마이저 상태·마스터 가중치를 함께 저장하면 샤드 수는 수 배로 늘어납니다. 저장 시간은 스토리지 대역폭·네트워크·병렬 저장 설정에 좌우되므로 측정 전에는 단정하지 않습니다.'
    : 'Estimated shards assume "BF16 weights only (params × 2 bytes)" divided into 10GB shards (e.g., 405B → 810GB / 10GB ≈ 81). Including optimizer state and master weights multiplies the shard count several-fold. Save time depends on storage bandwidth, network, and parallel-save settings, so it is not asserted without measurement.';
  return <div style={{
    maxWidth: '900px',
    margin: '20px auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '15px'
  }}>
      <div style={{
      background: 'linear-gradient(135deg, #76b900 0%, #5a8a00 100%)',
      color: 'white',
      padding: '16px 20px',
      borderRadius: '8px 8px 0 0',
      fontWeight: '600',
      fontSize: '16px'
    }}>
        {isKo ? '대규모 모델 체크포인트 샤딩 전략' : 'Large Model Checkpoint Sharding Strategy'}
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
        borderCollapse: 'collapse'
      }}>
          <thead>
            <tr style={{
            background: 'var(--ifm-color-emphasis-100)'
          }}>
              <th style={{
              padding: '12px',
              textAlign: 'left',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              fontWeight: '600'
            }}>
                {isKo ? '모델 크기' : 'Model Size'}
              </th>
              <th style={{
              padding: '12px',
              textAlign: 'left',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              fontWeight: '600'
            }}>
                {isKo ? '샤드 크기' : 'Shard Size'}
              </th>
              <th style={{
              padding: '12px',
              textAlign: 'left',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              fontWeight: '600'
            }}>
                {isKo ? '예상 샤드 수' : 'Estimated Shards'}
              </th>
              <th style={{
              padding: '12px',
              textAlign: 'left',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              fontWeight: '600'
            }}>
                {isKo ? '저장 시간' : 'Save Time'}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => <tr key={index} style={{
            background: index % 2 === 0 ? 'transparent' : 'var(--ifm-color-emphasis-50)',
            transition: 'background 0.2s'
          }}>
                <td style={{
              padding: '12px',
              borderBottom: '1px solid var(--ifm-color-emphasis-100)',
              fontWeight: '700',
              color: row.color,
              fontSize: '16px',
              borderLeft: `4px solid ${row.color}`
            }}>
                  {row.modelSize}
                </td>
                <td style={{
              padding: '12px',
              borderBottom: '1px solid var(--ifm-color-emphasis-100)'
            }}>
                  {row.shardSize}
                </td>
                <td style={{
              padding: '12px',
              borderBottom: '1px solid var(--ifm-color-emphasis-100)',
              fontWeight: '600'
            }}>
                  {row.estimatedShards}
                </td>
                <td style={{
              padding: '12px',
              borderBottom: '1px solid var(--ifm-color-emphasis-100)'
            }}>
                  {row.saveTime}
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
      <div style={{
      fontSize: '13px',
      color: 'var(--ifm-color-emphasis-700)',
      marginTop: '10px',
      lineHeight: '1.5'
    }}>
        {note}
      </div>
    </div>;
};
export default CheckpointSharding;