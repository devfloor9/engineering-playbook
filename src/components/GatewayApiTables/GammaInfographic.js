import React from 'react';
import { useColorMode } from '@docusaurus/theme-common';

const i18n = {
  ko: {
    title: 'GAMMA Initiative 핵심 개념',
    subtitle: '4가지 핵심 목표 & 메시 구성 패턴',
    objectives: {
      title: '4가지 핵심 목표',
      items: [
        {
          icon: '🎯',
          title: '통합 API',
          desc: '인그레스와 서비스 메시를 동일한 Gateway API 리소스로 관리'
        },
        {
          icon: '👥',
          title: '역할 기반 구성',
          desc: 'Gateway API의 역할 분리 원칙을 메시 트래픽에도 동일하게 적용'
        },
        {
          icon: '⚡',
          title: '최소 API 변경',
          desc: '기존 Gateway API에 최소한의 변경만 추가하여 메시 기능 지원'
        },
        {
          icon: '🔄',
          title: '구현체 간 일관성',
          desc: 'Istio, Cilium, Linkerd 등 다양한 메시에서 동일한 API 사용'
        }
      ]
    },
    meshPattern: {
      title: '메시 구성 패턴',
      traditional: {
        title: '기존 방식',
        ingress: 'Ingress Controller\n(North-South만)',
        mesh: 'Service Mesh\n(East-West만)',
        problem: '별도 설정 체계'
      },
      gamma: {
        title: 'GAMMA 방식',
        unified: 'Gateway API\n(통합 API)',
        northSouth: 'North-South\n(parentRef: Gateway)',
        eastWest: 'East-West\n(parentRef: Service)',
        benefit: '단일 API로 통합'
      }
    },
    comparison: {
      title: '설정 방식 비교',
      traditional: {
        label: '기존 방식',
        ingressTitle: 'Ingress (별도 CRD)',
        ingressDesc: 'Ingress/VirtualService 등',
        meshTitle: 'Mesh (별도 CRD)',
        meshDesc: 'ServiceEntry/DestinationRule 등',
        problem: '→ 2가지 API 학습 필요'
      },
      gamma: {
        label: 'GAMMA 방식',
        title: 'HTTPRoute (통합)',
        northSouth: '• parentRef: Gateway',
        eastWest: '• parentRef: Service',
        benefit: '→ 1가지 API로 통합'
      }
    },
    example: {
      title: 'GAMMA HTTPRoute 예제',
      subtitle: 'Service에 직접 L7 정책 적용',
      comment1: '# Gateway가 아닌 Service에 attach',
      comment2: '# Service B로 가는 트래픽에 재시도/타임아웃 적용'
    }
  },
  en: {
    title: 'GAMMA Initiative Core Concepts',
    subtitle: '4 Core Objectives & Mesh Configuration Pattern',
    objectives: {
      title: '4 Core Objectives',
      items: [
        {
          icon: '🎯',
          title: 'Unified API',
          desc: 'Manage ingress and service mesh with the same Gateway API resources'
        },
        {
          icon: '👥',
          title: 'Role-Based Config',
          desc: 'Apply Gateway API role separation principles to mesh traffic'
        },
        {
          icon: '⚡',
          title: 'Minimal API Changes',
          desc: 'Support mesh functionality with minimal changes to existing Gateway API'
        },
        {
          icon: '🔄',
          title: 'Cross-Implementation Consistency',
          desc: 'Use same API across various meshes like Istio, Cilium, Linkerd'
        }
      ]
    },
    meshPattern: {
      title: 'Mesh Configuration Pattern',
      traditional: {
        title: 'Traditional Approach',
        ingress: 'Ingress Controller\n(North-South only)',
        mesh: 'Service Mesh\n(East-West only)',
        problem: 'Separate configs'
      },
      gamma: {
        title: 'GAMMA Approach',
        unified: 'Gateway API\n(Unified API)',
        northSouth: 'North-South\n(parentRef: Gateway)',
        eastWest: 'East-West\n(parentRef: Service)',
        benefit: 'Unified into single API'
      }
    },
    comparison: {
      title: 'Configuration Comparison',
      traditional: {
        label: 'Traditional',
        ingressTitle: 'Ingress (Separate CRD)',
        ingressDesc: 'Ingress/VirtualService etc.',
        meshTitle: 'Mesh (Separate CRD)',
        meshDesc: 'ServiceEntry/DestinationRule etc.',
        problem: '→ Need to learn 2 APIs'
      },
      gamma: {
        label: 'GAMMA',
        title: 'HTTPRoute (Unified)',
        northSouth: '• parentRef: Gateway',
        eastWest: '• parentRef: Service',
        benefit: '→ Unified into 1 API'
      }
    },
    example: {
      title: 'GAMMA HTTPRoute Example',
      subtitle: 'Apply L7 policies directly to Service',
      comment1: '# Attach to Service, not Gateway',
      comment2: '# Apply retry/timeout to traffic destined for Service B'
    }
  },
  zh: {
    title: 'GAMMA Initiative 核心概念',
    subtitle: '4大核心目标 & 网格配置模式',
    objectives: {
      title: '4大核心目标',
      items: [
        {
          icon: '🎯',
          title: '统一 API',
          desc: '使用相同的 Gateway API 资源管理入口流量和服务网格'
        },
        {
          icon: '👥',
          title: '基于角色的配置',
          desc: '将 Gateway API 的角色分离原则同样应用于网格流量'
        },
        {
          icon: '⚡',
          title: '最小 API 变更',
          desc: '仅对现有 Gateway API 进行最少的更改即可支持网格功能'
        },
        {
          icon: '🔄',
          title: '跨实现一致性',
          desc: '在 Istio、Cilium、Linkerd 等多种网格中使用相同的 API'
        }
      ]
    },
    meshPattern: {
      title: '网格配置模式',
      traditional: {
        title: '传统方式',
        ingress: 'Ingress Controller\n(仅 North-South)',
        mesh: 'Service Mesh\n(仅 East-West)',
        problem: '独立的配置体系'
      },
      gamma: {
        title: 'GAMMA 方式',
        unified: 'Gateway API\n(统一 API)',
        northSouth: 'North-South\n(parentRef: Gateway)',
        eastWest: 'East-West\n(parentRef: Service)',
        benefit: '统一为单一 API'
      }
    },
    comparison: {
      title: '配置方式对比',
      traditional: {
        label: '传统方式',
        ingressTitle: 'Ingress (独立 CRD)',
        ingressDesc: 'Ingress/VirtualService 等',
        meshTitle: 'Mesh (独立 CRD)',
        meshDesc: 'ServiceEntry/DestinationRule 等',
        problem: '→ 需要学习2种 API'
      },
      gamma: {
        label: 'GAMMA 方式',
        title: 'HTTPRoute (统一)',
        northSouth: '• parentRef: Gateway',
        eastWest: '• parentRef: Service',
        benefit: '→ 统一为1种 API'
      }
    },
    example: {
      title: 'GAMMA HTTPRoute 示例',
      subtitle: '直接对 Service 应用 L7 策略',
      comment1: '# 附加到 Service 而非 Gateway',
      comment2: '# 对发往 Service B 的流量应用重试/超时策略'
    }
  }
};

export default function GammaInfographic({ locale = 'ko' }) {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const t = i18n[locale] || i18n.en;

  const bgColor = isDark ? '#1a1a1a' : '#ffffff';
  const borderColor = isDark ? '#333' : 'var(--ifm-color-emphasis-200)';
  const textColor = isDark ? 'var(--ifm-color-emphasis-200)' : '#1a202c';
  const mutedColor = isDark ? '#a0a0a0' : '#64748b';
  const cardBg = isDark ? '#2a2a2a' : '#f8fafc';
  const accentBg = isDark ? '#3a2a5a' : '#f3e5f5';

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      margin: '2rem 0',
      background: bgColor,
      border: `2px solid ${borderColor}`,
      borderRadius: '16px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 100%)',
        padding: '1.5rem',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {t.title}
        </div>
        <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
          {t.subtitle}
        </div>
      </div>

      <div style={{ padding: '2rem' }}>
        {/* Section 1: 4 Core Objectives */}
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
            color: textColor,
            textAlign: 'center'
          }}>
            {t.objectives.title}
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {t.objectives.items.map((item, idx) => (
              <div key={idx} style={{
                background: cardBg,
                border: `2px solid ${borderColor}`,
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(74, 20, 140, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>
                  {item.icon}
                </div>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                  color: textColor
                }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.85rem', color: mutedColor, lineHeight: 1.5 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Mesh Configuration Pattern - Vertical Before/After */}
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
            color: textColor,
            textAlign: 'center'
          }}>
            {t.meshPattern.title}
          </h3>

          <div style={{
            border: `2px solid ${borderColor}`,
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {/* Traditional Approach - Top */}
            <div style={{
              background: isDark
                ? 'linear-gradient(135deg, #3a1a1a 0%, #4a2020 100%)'
                : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
              padding: '1.25rem'
            }}>
              <div style={{
                fontSize: '1rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
                color: isDark ? '#ef9a9a' : '#c62828',
                textAlign: 'center'
              }}>
                ❌ {t.meshPattern.traditional.title}
              </div>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center'
              }}>
                <div style={{
                  flex: 1,
                  maxWidth: '280px',
                  background: isDark ? '#2a1515' : 'white',
                  border: `1px solid ${isDark ? '#c62828' : '#ef5350'}`,
                  borderRadius: '8px',
                  padding: '0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: isDark ? '#ef9a9a' : '#c62828',
                  whiteSpace: 'pre-line',
                  textAlign: 'center'
                }}>
                  {t.meshPattern.traditional.ingress}
                </div>
                <div style={{
                  flex: 1,
                  maxWidth: '280px',
                  background: isDark ? '#2a1515' : 'white',
                  border: `1px solid ${isDark ? '#c62828' : '#ef5350'}`,
                  borderRadius: '8px',
                  padding: '0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: isDark ? '#ef9a9a' : '#c62828',
                  whiteSpace: 'pre-line',
                  textAlign: 'center'
                }}>
                  {t.meshPattern.traditional.mesh}
                </div>
              </div>
              <div style={{
                marginTop: '0.75rem',
                fontSize: '0.8rem',
                fontStyle: 'italic',
                color: isDark ? '#e57373' : '#d32f2f',
                textAlign: 'center'
              }}>
                {t.meshPattern.traditional.problem}
              </div>
            </div>

            {/* Transition Arrow */}
            <div style={{
              background: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 100%)',
              padding: '0.5rem',
              textAlign: 'center',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: 700,
              letterSpacing: '0.05em'
            }}>
              ▼ GAMMA Initiative ▼
            </div>

            {/* GAMMA Approach - Bottom */}
            <div style={{
              background: isDark
                ? 'linear-gradient(135deg, #1a3a1a 0%, #204a20 100%)'
                : 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
              padding: '1.25rem'
            }}>
              <div style={{
                fontSize: '1rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
                color: isDark ? '#81c784' : '#2e7d32',
                textAlign: 'center'
              }}>
                ✅ {t.meshPattern.gamma.title}
              </div>
              <div style={{
                background: '#1565c0',
                color: 'white',
                border: '2px solid #0d47a1',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                textAlign: 'center',
                marginBottom: '0.5rem',
                whiteSpace: 'pre-line',
                maxWidth: '320px',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}>
                {t.meshPattern.gamma.unified}
              </div>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center'
              }}>
                <div style={{
                  flex: 1,
                  maxWidth: '280px',
                  background: isDark ? '#1a2e1a' : 'white',
                  border: `1px solid ${isDark ? '#4caf50' : '#66bb6a'}`,
                  borderRadius: '8px',
                  padding: '0.6rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: isDark ? '#81c784' : '#2e7d32',
                  whiteSpace: 'pre-line',
                  textAlign: 'center'
                }}>
                  {t.meshPattern.gamma.northSouth}
                </div>
                <div style={{
                  flex: 1,
                  maxWidth: '280px',
                  background: isDark ? '#1a2e1a' : 'white',
                  border: `1px solid ${isDark ? '#4caf50' : '#66bb6a'}`,
                  borderRadius: '8px',
                  padding: '0.6rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: isDark ? '#81c784' : '#2e7d32',
                  whiteSpace: 'pre-line',
                  textAlign: 'center'
                }}>
                  {t.meshPattern.gamma.eastWest}
                </div>
              </div>
              <div style={{
                marginTop: '0.75rem',
                fontSize: '0.8rem',
                fontStyle: 'italic',
                color: isDark ? '#66bb6a' : '#388e3c',
                textAlign: 'center'
              }}>
                {t.meshPattern.gamma.benefit}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Configuration Comparison */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
            color: textColor,
            textAlign: 'center'
          }}>
            {t.comparison.title}
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem'
          }}>
            {/* Traditional Config */}
            <div style={{
              background: cardBg,
              border: `2px solid ${isDark ? '#b71c1c' : '#ef5350'}`,
              borderRadius: '12px',
              padding: '1.25rem'
            }}>
              <div style={{
                fontSize: '1rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
                color: isDark ? '#ef9a9a' : '#c62828',
                textAlign: 'center'
              }}>
                {t.comparison.traditional.label}
              </div>
              <div style={{
                background: isDark ? '#3a1a1a' : '#ffebee',
                border: `1px solid ${isDark ? '#c62828' : '#ef9a9a'}`,
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem', color: isDark ? '#ef9a9a' : '#c62828' }}>
                  {t.comparison.traditional.ingressTitle}
                </div>
                <div style={{ fontSize: '0.8rem', color: isDark ? '#e57373' : '#d32f2f' }}>
                  {t.comparison.traditional.ingressDesc}
                </div>
              </div>
              <div style={{
                background: isDark ? '#3a1a1a' : '#ffebee',
                border: `1px solid ${isDark ? '#c62828' : '#ef9a9a'}`,
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem', color: isDark ? '#ef9a9a' : '#c62828' }}>
                  {t.comparison.traditional.meshTitle}
                </div>
                <div style={{ fontSize: '0.8rem', color: isDark ? '#e57373' : '#d32f2f' }}>
                  {t.comparison.traditional.meshDesc}
                </div>
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isDark ? '#ef9a9a' : '#c62828',
                marginTop: '0.75rem'
              }}>
                {t.comparison.traditional.problem}
              </div>
            </div>

            {/* GAMMA Config */}
            <div style={{
              background: cardBg,
              border: `2px solid ${isDark ? '#388e3c' : '#66bb6a'}`,
              borderRadius: '12px',
              padding: '1.25rem'
            }}>
              <div style={{
                fontSize: '1rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
                color: isDark ? '#81c784' : '#2e7d32',
                textAlign: 'center'
              }}>
                {t.comparison.gamma.label}
              </div>
              <div style={{
                background: isDark ? '#1a3a1a' : '#e8f5e9',
                border: `2px solid ${isDark ? '#4caf50' : '#66bb6a'}`,
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', color: isDark ? '#81c784' : '#2e7d32' }}>
                  {t.comparison.gamma.title}
                </div>
                <div style={{ fontSize: '0.85rem', color: isDark ? '#66bb6a' : '#388e3c', marginBottom: '0.25rem' }}>
                  {t.comparison.gamma.northSouth}
                </div>
                <div style={{ fontSize: '0.85rem', color: isDark ? '#66bb6a' : '#388e3c' }}>
                  {t.comparison.gamma.eastWest}
                </div>
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isDark ? '#81c784' : '#2e7d32',
                marginTop: '0.75rem'
              }}>
                {t.comparison.gamma.benefit}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Code Example */}
        <div style={{
          background: accentBg,
          border: `2px solid ${isDark ? '#6a1b9a' : '#9c27b0'}`,
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            color: textColor,
            textAlign: 'center'
          }}>
            {t.example.title}
          </h3>
          <div style={{
            fontSize: '0.85rem',
            color: mutedColor,
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            {t.example.subtitle}
          </div>
          <pre style={{
            background: isDark ? '#1a1a1a' : '#2d2d2d',
            color: 'var(--ifm-color-emphasis-200)',
            padding: '1.25rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            overflowX: 'auto',
            margin: 0
          }}>
{`apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: service-b-retry
  namespace: production
spec:
  parentRefs:
    - group: ""
      kind: Service
      name: service-b    ${t.example.comment1}
  rules:
    - backendRefs:
        - name: service-b
          port: 8080
      timeouts:
        request: 10s
      retry:
        attempts: 3
        backoff: 100ms
      ${t.example.comment2}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
