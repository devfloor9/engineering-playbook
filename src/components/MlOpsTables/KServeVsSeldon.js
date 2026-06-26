import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const KServeVsSeldon = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const comparisons = [{
    feature: isKo ? '배포 방식' : 'Deployment Method',
    argocd: isKo ? 'Git 저장소 기반 선언적 배포' : 'Git repo-based declarative deployment',
    flux: isKo ? 'Git 저장소 기반 선언적 배포' : 'Git repo-based declarative deployment',
    kubectl: isKo ? '명령형/수동 적용' : 'Imperative/manual apply',
    icon: '🚀'
  }, {
    feature: isKo ? '동기화 방식' : 'Sync Method',
    argocd: isKo ? 'Pull 기반 + 자동 Sync' : 'Pull-based + Auto Sync',
    flux: isKo ? 'Pull 기반 + Reconciliation' : 'Pull-based + Reconciliation',
    kubectl: isKo ? 'Push 기반 (CI에서 실행)' : 'Push-based (from CI)',
    icon: '🔄'
  }, {
    feature: isKo ? 'UI/대시보드' : 'UI/Dashboard',
    argocd: isKo ? '풍부한 웹 UI, 앱 토폴로지 시각화' : 'Rich Web UI, app topology visualization',
    flux: isKo ? 'Weave GitOps (별도 설치)' : 'Weave GitOps (separate install)',
    kubectl: isKo ? '없음 (CLI만)' : 'None (CLI only)',
    icon: '🖥️'
  }, {
    feature: isKo ? '롤백' : 'Rollback',
    argocd: isKo ? 'Git 히스토리 기반 원클릭 롤백' : 'One-click rollback via Git history',
    flux: isKo ? 'Git revert 기반 자동 롤백' : 'Auto rollback via Git revert',
    kubectl: isKo ? 'kubectl rollout undo (수동)' : 'kubectl rollout undo (manual)',
    icon: '⏪'
  }, {
    feature: isKo ? '멀티 클러스터' : 'Multi-cluster',
    argocd: isKo ? 'ApplicationSet으로 네이티브 지원' : 'Native via ApplicationSet',
    flux: isKo ? 'Kustomization 기반 지원' : 'Supported via Kustomization',
    kubectl: isKo ? 'kubeconfig 전환 (수동)' : 'kubeconfig switching (manual)',
    icon: '🌐'
  }, {
    feature: isKo ? 'Helm 지원' : 'Helm Support',
    argocd: isKo ? 'Helm 차트 네이티브 렌더링' : 'Native Helm chart rendering',
    flux: 'HelmRelease CRD',
    kubectl: 'helm install/upgrade (CLI)',
    icon: '⎈'
  }, {
    feature: isKo ? '보안/RBAC' : 'Security/RBAC',
    argocd: isKo ? '프로젝트 기반 세분화된 RBAC' : 'Fine-grained project-based RBAC',
    flux: isKo ? 'Kubernetes RBAC 위임' : 'Delegates to Kubernetes RBAC',
    kubectl: isKo ? 'kubeconfig 권한에 의존' : 'Depends on kubeconfig permissions',
    icon: '🔒'
  }, {
    feature: isKo ? '커뮤니티/성숙도' : 'Community/Maturity',
    argocd: 'CNCF Graduated',
    flux: 'CNCF Graduated',
    kubectl: isKo ? 'Kubernetes 내장' : 'Kubernetes built-in',
    icon: '👥'
  }];
  return <div style={{
    maxWidth: '1100px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: '15px',
    lineHeight: '1.6'
  }}>
      <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px 24px',
      borderRadius: '8px 8px 0 0'
    }}>
        <div style={{
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '4px'
      }}>
          {isKo ? '⚖️ GitOps 배포 방식 비교' : '⚖️ GitOps Deployment Comparison'}
        </div>
        <div style={{
        fontSize: '14px',
        opacity: 0.9
      }}>
          {isKo ? 'ArgoCD vs Flux vs 수동 kubectl 배포 전략 비교' : 'ArgoCD vs Flux vs Manual kubectl Deployment Strategy Comparison'}
        </div>
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px',
      padding: '20px'
    }}>
        <div style={{
        display: 'grid',
        gap: '12px'
      }}>
          {comparisons.map((item, index) => <div key={index} style={{
          background: index % 2 === 0 ? 'var(--ifm-background-surface-color)' : 'var(--ifm-color-emphasis-100)',
          padding: '16px',
          borderRadius: '6px',
          display: 'grid',
          gridTemplateColumns: '40px 150px 1fr 1fr 1fr',
          gap: '12px',
          alignItems: 'center',
          border: '1px solid var(--ifm-color-emphasis-200)'
        }}>
              <div style={{
            fontSize: '24px',
            textAlign: 'center'
          }}>
                {item.icon}
              </div>

              <div style={{
            fontSize: '14px',
            fontWeight: '700',
            color: 'var(--ifm-color-primary)'
          }}>
                {item.feature}
              </div>

              <div>
                <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#3b82f6',
              marginBottom: '4px'
            }}>
                  ArgoCD
                </div>
                <div style={{
              fontSize: '13px',
              color: 'var(--ifm-font-color-base)'
            }}>
                  {item.argocd}
                </div>
              </div>

              <div>
                <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#8b5cf6',
              marginBottom: '4px'
            }}>
                  Flux
                </div>
                <div style={{
              fontSize: '13px',
              color: 'var(--ifm-font-color-base)'
            }}>
                  {item.flux}
                </div>
              </div>

              <div>
                <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--ifm-color-emphasis-600)',
              marginBottom: '4px'
            }}>
                  kubectl
                </div>
                <div style={{
              fontSize: '13px',
              color: 'var(--ifm-font-color-base)'
            }}>
                  {item.kubectl}
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </div>;
};
export default KServeVsSeldon;