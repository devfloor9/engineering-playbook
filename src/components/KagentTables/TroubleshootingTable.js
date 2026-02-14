import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const TroubleshootingTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const issues = [
    {
      id: 'crashloop',
      issue: isKo ? 'Pod CrashLoopBackOff' : isZh ? 'Pod CrashLoopBackOff' : 'Pod CrashLoopBackOff',
      cause: isKo ? 'API 키 오류, 메모리 부족' : isZh ? 'API 密钥错误，内存不足' : 'API key error, insufficient memory',
      solution: isKo ? '시크릿 확인, 리소스 증가' : isZh ? '验证密钥，增加资源' : 'Verify secrets, increase resources',
      severity: 'high'
    },
    {
      id: 'latency',
      issue: isKo ? '높은 지연 시간' : isZh ? '高延迟' : 'High latency',
      cause: isKo ? '모델 응답 지연, 네트워크 문제' : isZh ? '模型响应延迟，网络问题' : 'Model response delay, network issues',
      solution: isKo ? '타임아웃 조정, 모델 변경' : isZh ? '调整超时，更换模型' : 'Adjust timeout, change model',
      severity: 'medium'
    },
    {
      id: 'tool-failure',
      issue: isKo ? 'Tool 실행 실패' : isZh ? '工具执行失败' : 'Tool execution failure',
      cause: isKo ? '엔드포인트 오류, 인증 실패' : isZh ? '端点错误，认证失败' : 'Endpoint error, auth failure',
      solution: isKo ? 'Tool 설정 확인, 시크릿 갱신' : isZh ? '验证工具配置，刷新密钥' : 'Verify tool config, refresh secret',
      severity: 'high'
    },
    {
      id: 'scaling',
      issue: isKo ? '스케일링 미작동' : isZh ? '扩展不工作' : 'Scaling not working',
      cause: isKo ? '메트릭 수집 실패, HPA 설정 오류' : isZh ? '指标收集失败，HPA 配置错误' : 'Metric collection failed, HPA config error',
      solution: isKo ? 'Prometheus 연결 확인, HPA 검증' : isZh ? '检查 Prometheus 连接，验证 HPA' : 'Check Prometheus connection, validate HPA',
      severity: 'medium'
    }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return '#dc2626';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getSeverityLabel = (severity) => {
    if (severity === 'high') return isKo ? '높음' : isZh ? '高' : 'High';
    if (severity === 'medium') return isKo ? '중간' : isZh ? '中' : 'Medium';
    if (severity === 'low') return isKo ? '낮음' : isZh ? '低' : 'Low';
    return severity;
  };

  return (
    <div style={{
      maxWidth: '100%',
      margin: '20px 0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '15px'
    }}>
      <div style={{
        overflowX: 'auto',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderRadius: '8px'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: 'var(--ifm-background-surface-color)'
        }}>
          <thead>
            <tr style={{ background: 'var(--ifm-color-emphasis-100)' }}>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                borderBottom: '2px solid var(--ifm-color-emphasis-300)',
                width: '20%'
              }}>
                {isKo ? '문제' : isZh ? '问题' : 'Issue'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                borderBottom: '2px solid var(--ifm-color-emphasis-300)',
                width: '30%'
              }}>
                {isKo ? '원인' : isZh ? '原因' : 'Cause'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                borderBottom: '2px solid var(--ifm-color-emphasis-300)',
                width: '35%'
              }}>
                {isKo ? '해결 방법' : isZh ? '解决方案' : 'Solution'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontWeight: '600',
                borderBottom: '2px solid var(--ifm-color-emphasis-300)',
                width: '15%'
              }}>
                {isKo ? '심각도' : isZh ? '严重性' : 'Severity'}
              </th>
            </tr>
          </thead>
          <tbody>
            {issues.map((item, index) => (
              <tr key={item.id} style={{
                background: index % 2 === 0 ? 'var(--ifm-background-surface-color)' : 'var(--ifm-color-emphasis-50)'
              }}>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--ifm-color-emphasis-200)',
                  fontWeight: '600'
                }}>
                  {item.issue}
                </td>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--ifm-color-emphasis-200)'
                }}>
                  {item.cause}
                </td>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--ifm-color-emphasis-200)'
                }}>
                  {item.solution}
                </td>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--ifm-color-emphasis-200)',
                  textAlign: 'center'
                }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'white',
                    background: getSeverityColor(item.severity),
                    display: 'inline-block'
                  }}>
                    {getSeverityLabel(item.severity)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TroubleshootingTable;
