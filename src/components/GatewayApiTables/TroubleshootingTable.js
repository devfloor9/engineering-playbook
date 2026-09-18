import React from 'react';
import BaseTable from '../tables/BaseTable';

const data = {
  ko: [
    { symptom: 'HTTPRoute Accepted=False', cause: '선택한 Gateway/리스너가 Route 연결을 수락하지 않음', solution: '1. parentRefs와 리스너 확인 2. hostname 교집합 확인 3. allowedRoutes 네임스페이스 정책 확인' },
    { symptom: 'HTTPRoute ResolvedRefs=False', cause: '해당 부모에 대한 백엔드 참조를 해석할 수 없음', solution: '1. Service 이름·포트·kind 확인 2. 다른 네임스페이스 참조의 ReferenceGrant 확인 3. 조건의 reason/message 확인' },
    { symptom: 'Gateway Programmed=False', cause: 'Gateway 데이터플레인 구성이 준비되지 않음', solution: '1. Gateway 및 리스너 조건 확인 2. 컨트롤러 로그와 LoadBalancer 상태 확인 3. TLS 리스너의 ResolvedRefs와 인증서 Secret 확인' },
    { symptom: '503 Service Unavailable', cause: '백엔드 엔드포인트 없음', solution: '1. Service의 Endpoints 확인 2. Pod selector 일치 여부 확인 3. Pod 상태 확인 (Ready)' },
    { symptom: 'TLS 인증서 오류', cause: 'Secret이 올바르지 않음', solution: '1. Secret 타입 kubernetes.io/tls 확인 2. tls.crt, tls.key 존재 확인 3. 인증서 유효기간 확인' },
    { symptom: '404 Not Found', cause: '경로 매칭 실패', solution: '1. PathPrefix vs Exact 타입 확인 2. 대소문자 구분 여부 확인 3. URL 인코딩 확인' },
    { symptom: 'Gateway 주소 없음', cause: 'LoadBalancer 생성 실패', solution: '1. 클라우드 제공자 쿼터 확인 2. 서브넷 IP 고갈 여부 확인 3. 어노테이션 오타 확인' },
  ],
  en: [
    { symptom: 'HTTPRoute Accepted=False', cause: 'The selected Gateway/listener has not accepted the Route attachment', solution: '1. Check parentRefs and listener 2. Check hostname intersection 3. Check allowedRoutes namespace policy' },
    { symptom: 'HTTPRoute ResolvedRefs=False', cause: 'Backend references cannot be resolved for this parent', solution: '1. Check Service name, port, and kind 2. Check ReferenceGrant for cross-namespace references 3. Inspect condition reason/message' },
    { symptom: 'Gateway Programmed=False', cause: 'Gateway dataplane configuration is not ready', solution: '1. Check Gateway and listener conditions 2. Check controller logs and LoadBalancer status 3. Check TLS listener ResolvedRefs and certificate Secret' },
    { symptom: '503 Service Unavailable', cause: 'No backend endpoints', solution: '1. Check Service Endpoints 2. Verify Pod selector match 3. Check Pod status (Ready)' },
    { symptom: 'TLS Certificate Error', cause: 'Invalid Secret', solution: '1. Verify Secret type kubernetes.io/tls 2. Check tls.crt, tls.key exist 3. Verify certificate validity' },
    { symptom: '404 Not Found', cause: 'Route matching failure', solution: '1. Check PathPrefix vs Exact type 2. Check case sensitivity 3. Check URL encoding' },
    { symptom: 'No Gateway Address', cause: 'LoadBalancer creation failed', solution: '1. Check cloud provider quota 2. Check subnet IP exhaustion 3. Check annotation typos' },
  ],
};

export default function TroubleshootingTable({locale = 'ko'}) {
  const ko = locale === 'ko';
  const title = ko ? 'Gateway API 트러블슈팅 가이드' : 'Gateway API Troubleshooting Guide';
  const description = ko ? '일반적인 문제와 해결 방법' : 'Common issues and solutions';
  const headers = ko ? ['증상', '원인', '해결'] : ['Symptom', 'Cause', 'Resolution'];
  const rows = data[locale].map(row => ({
    id: row.symptom,
    cells: [row.symptom, row.cause, row.solution],
  }));
  return <BaseTable caption={title} description={description} headers={headers}
    rows={rows} rowHeaderColumn={0} minWidth="48rem" />;
}
