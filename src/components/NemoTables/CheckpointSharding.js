import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const CheckpointSharding = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const data = [
    {
      modelSize: '70B',
      shardSize: '10GB',
      estimatedShards: isKo ? '~40 샤드' : isZh ? '~40 分片' : '~40 shards',
      saveTime: isKo ? '5-10분' : isZh ? '5-10分钟' : '5-10 min',
      color: '#4285f4'
    },
    {
      modelSize: '175B',
      shardSize: '10GB',
      estimatedShards: isKo ? '~100 샤드' : isZh ? '~100 分片' : '~100 shards',
      saveTime: isKo ? '15-20분' : isZh ? '15-20分钟' : '15-20 min',
      color: '#fbbc04'
    },
    {
      modelSize: '405B',
      shardSize: '10GB',
      estimatedShards: isKo ? '~230 샤드' : isZh ? '~230 分片' : '~230 shards',
      saveTime: isKo ? '30-40분' : isZh ? '30-40分钟' : '30-40 min',
      color: '#ea4335'
    }
  ];

  return (
    <div style={{
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
        {isKo ? '대규모 모델 체크포인트 샤딩 전략' : isZh ? '大规模模型检查点分片策略' : 'Large Model Checkpoint Sharding Strategy'}
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--ifm-color-emphasis-100)' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? '모델 크기' : isZh ? '模型大小' : 'Model Size'}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? '샤드 크기' : isZh ? '分片大小' : 'Shard Size'}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? '예상 샤드 수' : isZh ? '预计分片数' : 'Estimated Shards'}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? '저장 시간' : isZh ? '保存时间' : 'Save Time'}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} style={{
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
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)' }}>
                  {row.shardSize}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)', fontWeight: '600' }}>
                  {row.estimatedShards}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)' }}>
                  {row.saveTime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CheckpointSharding;
