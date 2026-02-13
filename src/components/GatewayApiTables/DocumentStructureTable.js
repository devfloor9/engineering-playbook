import React from 'react';

const sections = {
  ko: [
    { section: '1. 개요', content: '문서 구조, 대상 독자', order: '필수', color: '#e53935' },
    { section: '2. NGINX Ingress Retirement', content: 'EOL 타임라인, 보안 위험', order: '필수', color: '#e53935' },
    { section: '3. Gateway API 아키텍처', content: '3-Tier 모델, 역할 분리, GA 현황', order: '필수', color: '#e53935' },
    { section: '4. GAMMA Initiative', content: '서비스 메시 통합, East-West 관리', order: '권장', color: '#fb8c00' },
    { section: '5. 솔루션 비교', content: '5개 구현체 기능/성능/비용 비교', order: '필수', color: '#e53935' },
    { section: '6. NGINX 기능별 대안', content: '8가지 기능 매핑, 코드 예시', order: '선택', color: '#43a047' },
    { section: '7. Cilium ENI + Gateway API', content: '설치, 구성, 성능 최적화', order: '선택', color: '#43a047' },
    { section: '8. 마이그레이션 실행', content: '5-Phase 전략, 체크리스트', order: '실행 시', color: '#1e88e5' },
    { section: '9. 벤치마크 계획', content: '테스트 설계, 측정 지표', order: '계획 시', color: '#8e24aa' },
    { section: '10. 결론', content: '로드맵, 권장사항', order: '필수', color: '#e53935' },
  ],
  en: [
    { section: '1. Overview', content: 'Document structure, target audience', order: 'Required', color: '#e53935' },
    { section: '2. NGINX Ingress Retirement', content: 'EOL timeline, security risks', order: 'Required', color: '#e53935' },
    { section: '3. Gateway API Architecture', content: '3-Tier model, role separation, GA status', order: 'Required', color: '#e53935' },
    { section: '4. GAMMA Initiative', content: 'Service mesh integration, East-West management', order: 'Recommended', color: '#fb8c00' },
    { section: '5. Solution Comparison', content: '5 implementations: features/performance/cost', order: 'Required', color: '#e53935' },
    { section: '6. NGINX Feature Alternatives', content: '8 feature mappings, code examples', order: 'Optional', color: '#43a047' },
    { section: '7. Cilium ENI + Gateway API', content: 'Installation, configuration, performance tuning', order: 'Optional', color: '#43a047' },
    { section: '8. Migration Execution', content: '5-Phase strategy, checklists', order: 'When executing', color: '#1e88e5' },
    { section: '9. Benchmark Planning', content: 'Test design, measurement metrics', order: 'When planning', color: '#8e24aa' },
    { section: '10. Conclusion', content: 'Roadmap, recommendations', order: 'Required', color: '#e53935' },
  ],
};

export default function DocumentStructureTable({ locale = 'ko' }) {
  const data = sections[locale] || sections.ko;
  const title = locale === 'ko' ? '📚 문서 구조 및 읽는 순서' : '📚 Document Structure & Reading Order';
  const subtitle = locale === 'ko' ? '섹션별 내용 및 권장 독서 순서' : 'Section-wise content and recommended reading order';

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {data.map((item) => (
          <div key={item.section} style={{ border: `1.5px solid ${item.color}30`, borderLeft: `4px solid ${item.color}`, borderRadius: 8, padding: '0.7rem 1rem', background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1f2937' }}>{item.section}</span>
              <span style={{ marginLeft: 'auto', background: item.color, color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>{item.order}</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#6b7280' }}>{item.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
