import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const TroubleshootingTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const issues = [
    {
      symptom: isKo ? 'GPU 노드가 프로비저닝되지 않음' : 'GPU node not provisioning',
      cause: isKo ? 'Service Quotas 부족' : 'Insufficient Service Quotas',
      solution: isKo ? 'AWS Console에서 P instance 쿼터 확인 및 증가 요청' : 'Check and request increase for P instance quota in AWS Console'
    },
    {
      symptom: isKo ? 'Pod가 Pending 상태' : 'Pod stuck in Pending state',
      cause: isKo ? 'NodePool 설정 오류 또는 GPU 부족' : 'NodePool configuration error or insufficient GPUs',
      solution: isKo ? '`kubectl describe pod`로 이벤트 확인, NodePool의 instance-family 확인' : 'Check events with `kubectl describe pod`, verify instance-family in NodePool'
    },
    {
      symptom: 'CUDA OOM (Out of Memory)',
      cause: isKo ? 'GPU 메모리 부족' : 'Insufficient GPU memory',
      solution: isKo ? 'TP 값 증가 또는 `gpu-memory-utilization` 값 낮추기 (0.85)' : 'Increase TP value or lower `gpu-memory-utilization` (0.85)'
    },
    {
      symptom: isKo ? '모델 로딩 타임아웃' : 'Model loading timeout',
      cause: isKo ? 'HuggingFace 다운로드 느림' : 'Slow HuggingFace download',
      solution: isKo ? 'S3 모델 캐싱 활성화, `initialDelaySeconds` 증가' : 'Enable S3 model caching, increase `initialDelaySeconds`'
    },
    {
      symptom: isKo ? 'Gateway 라우팅 실패' : 'Gateway routing failure',
      cause: isKo ? 'CRD 미설치' : 'CRDs not installed',
      solution: isKo ? 'Gateway API CRD 및 Inference Extension CRD 설치 확인' : 'Verify Gateway API CRD and Inference Extension CRD installation'
    },
    {
      symptom: isKo ? 'HuggingFace 토큰 오류' : 'HuggingFace token error',
      cause: isKo ? 'Secret 미생성 또는 권한 부족' : 'Secret not created or insufficient permissions',
      solution: isKo ? '`kubectl get secret -n llm-d` 확인, HF 토큰 권한 확인' : 'Check `kubectl get secret -n llm-d`, verify HF token permissions'
    },
    {
      symptom: isKo ? 'NCCL 통신 오류' : 'NCCL communication error',
      cause: isKo ? 'GPU 간 통신 문제' : 'Inter-GPU communication issue',
      solution: isKo ? '`NCCL_DEBUG=INFO` 환경 변수 추가, EFA 지원 확인' : 'Add `NCCL_DEBUG=INFO` environment variable, verify EFA support'
    },
    {
      symptom: isKo ? 'InferencePool이 Ready가 아님' : 'InferencePool not Ready',
      cause: isKo ? 'vLLM Pod 미준비' : 'vLLM Pods not ready',
      solution: isKo ? 'Pod 상태 확인, 모델 로딩 완료 대기' : 'Check Pod status, wait for model loading to complete'
    }
  ];

  return (
    <div style={{
      maxWidth: '100%',
      margin: '20px 0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      overflowX: 'auto'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '일반적인 문제와 해결 방법' : 'Common Issues and Solutions'}
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '200px'
              }}>
                {isKo ? '증상' : 'Symptom'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '160px'
              }}>
                {isKo ? '원인' : 'Cause'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '300px'
              }}>
                {isKo ? '해결 방법' : 'Solution'}
              </th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue, index) => (
              <tr key={index}>
                <td style={{
                  padding: '12px 16px',
                  fontWeight: '500',
                  color: '#dc2626',
                  borderBottom: index < issues.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {issue.symptom}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#6b7280',
                  borderBottom: index < issues.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {issue.cause}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#059669',
                  fontWeight: '500',
                  borderBottom: index < issues.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {issue.solution}
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
