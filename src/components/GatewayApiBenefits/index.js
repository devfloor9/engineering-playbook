import React, { useState } from 'react';
import { useColorMode } from '@docusaurus/theme-common';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const GatewayApiBenefits = () => {
  const { colorMode } = useColorMode();
  const { i18n } = useDocusaurusContext();
  const locale = i18n.currentLocale || 'en';
  const isDark = colorMode === 'dark';

  const [selectedBenefit, setSelectedBenefit] = useState(0);
  const [innerTabs, setInnerTabs] = useState({});

  const getInnerTab = (benefitIndex) => innerTabs[benefitIndex] || 'diagram';
  const setInnerTab = (benefitIndex, tab) => {
    setInnerTabs(prev => ({ ...prev, [benefitIndex]: tab }));
  };

  const labels = {
    ko: {
      diagram: '다이어그램',
      yaml: 'YAML 코드',
    },
    en: {
      diagram: 'Diagram',
      yaml: 'YAML Code',
    },
    zh: {
      diagram: '架构图',
      yaml: 'YAML 代码',
    },
  };

  const currentLabels = labels[locale] || labels.en;

  const benefits = [
    {
      icon: '🔐',
      title: {
        ko: '역할 기반 접근 제어',
        en: 'Role-Based Access Control',
        zh: '基于角色的访问控制',
      },
      diagram: <RBACDiagram isDark={isDark} />,
      yaml: `# 애플리케이션 팀은 HTTPRoute만 수정 가능 (인프라 설정 격리)
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: backend-api-routes
  namespace: production-app
spec:
  parentRefs:
  - name: shared-gateway  # 플랫폼 팀이 관리하는 Gateway 참조
    namespace: gateway-system
    sectionName: https
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api/v1
    backendRefs:
    - name: backend-v1
      port: 8080`,
    },
    {
      icon: '🔀',
      title: {
        ko: '표현력 있는 라우팅',
        en: 'Expressive Routing',
        zh: '表达式路由',
      },
      diagram: <ExpressiveRoutingDiagram isDark={isDark} />,
      yaml: `apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: advanced-routing
spec:
  rules:
  # 헤더 기반 라우팅 (A/B 테스트)
  - matches:
    - headers:
      - name: X-User-Group
        value: beta-testers
    backendRefs:
    - name: backend-beta
      port: 8080
  # 쿼리 파라미터 기반 라우팅
  - matches:
    - queryParams:
      - name: version
        value: "2"
    backendRefs:
    - name: backend-v2
      port: 8080
  # HTTP 메서드 기반 라우팅
  - matches:
    - method: POST
      path:
        type: PathPrefix
        value: /api/write
    backendRefs:
    - name: write-backend
      port: 8080`,
    },
    {
      icon: '🧩',
      title: {
        ko: '확장 가능한 설계',
        en: 'Extensible Design',
        zh: '可扩展设计',
      },
      diagram: <ExtensibleDesignDiagram isDark={isDark} />,
      yaml: `# 표준 Gateway API 리소스
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api-route
spec:
  rules:
  - backendRefs:
    - name: api-service
      port: 80
---
# Cilium의 Rate Limiting Policy (별도 리소스)
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: api-rate-limit
spec:
  endpointSelector:
    matchLabels:
      gateway.networking.k8s.io/gateway-name: production-gateway
  ingress:
  - toPorts:
    - ports:
      - port: "80"
      rules:
        http:
        - rateLimit:
            requestsPerSecond: 1000`,
    },
    {
      icon: '🌐',
      title: {
        ko: '멀티 프로토콜 지원',
        en: 'Multi-Protocol Support',
        zh: '多协议支持',
      },
      diagram: <MultiProtocolDiagram isDark={isDark} />,
      yaml: `# gRPC 서비스 라우팅
apiVersion: gateway.networking.k8s.io/v1
kind: GRPCRoute
metadata:
  name: grpc-service-route
spec:
  parentRefs:
  - name: gateway
  rules:
  - matches:
    - method:
        service: com.example.UserService
        method: GetUser
    backendRefs:
    - name: user-grpc-service
      port: 50051`,
    },
    {
      icon: '🔄',
      title: {
        ko: '이식성',
        en: 'Portability',
        zh: '可移植性',
      },
      diagram: <PortabilityDiagram isDark={isDark} />,
      yaml: `# Before: Cilium
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: cilium
spec:
  controllerName: io.cilium/gateway-controller
---
# After: AWS Load Balancer Controller (HTTPRoute는 동일)
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: aws-lb
spec:
  controllerName: aws.gateway.networking.k8s.io`,
    },
    {
      icon: '✅',
      title: {
        ko: '타입 안전',
        en: 'Type Safety',
        zh: '类型安全',
      },
      diagram: <TypeSafetyDiagram isDark={isDark} />,
      yaml: `# ❌ NGINX Ingress: 어노테이션 오타 시 런타임 에러
annotations:
  nginx.ingress.kubernetes.io/rewrite-traget: /  # 오타!

# ✅ Gateway API: CRD 스키마 검증으로 사전 차단
spec:
  rules:
  - filters:
    - type: URLRewrite
      urlRewrite:
        path:
          type: ReplacePrefixMatch
          replacePrefixMatch: /new-path`,
    },
  ];

  const containerStyle = {
    padding: '2rem 0',
    width: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const topTabsContainerStyle = {
    display: 'flex',
    overflowX: 'auto',
    gap: '0.5rem',
    marginBottom: '2rem',
    paddingBottom: '0.5rem',
    borderBottom: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
  };

  const topTabStyle = (isActive) => ({
    padding: '0.875rem 1.75rem',
    borderRadius: '12px',
    border: 'none',
    background: isActive
      ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
      : isDark
      ? '#374151'
      : '#f3f4f6',
    color: isActive ? '#fff' : isDark ? '#d1d5db' : '#4b5563',
    cursor: 'pointer',
    fontSize: '0.9375rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    boxShadow: isActive
      ? '0 4px 12px rgba(59, 130, 246, 0.25)'
      : 'none',
    transform: isActive ? 'translateY(-2px)' : 'none',
  });

  const contentCardStyle = {
    background: isDark
      ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: isDark
      ? '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)'
      : '0 8px 24px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
  };

  const innerTabsContainerStyle = {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1.75rem',
    borderBottom: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    paddingBottom: '0.5rem',
  };

  const innerTabStyle = (isActive) => ({
    padding: '0.625rem 1.25rem',
    border: 'none',
    background: isActive
      ? isDark
        ? 'rgba(59, 130, 246, 0.15)'
        : 'rgba(59, 130, 246, 0.1)'
      : 'transparent',
    color: isActive
      ? isDark
        ? '#60a5fa'
        : '#3b82f6'
      : isDark
      ? '#9ca3af'
      : '#6b7280',
    cursor: 'pointer',
    fontSize: '0.9375rem',
    fontWeight: '600',
    borderRadius: '8px',
    borderBottom: isActive ? `3px solid ${isDark ? '#60a5fa' : '#3b82f6'}` : 'none',
    transition: 'all 0.2s ease',
    transform: isActive ? 'translateY(-1px)' : 'none',
  });

  const currentBenefit = benefits[selectedBenefit];
  const currentInnerTab = getInnerTab(selectedBenefit);

  return (
    <div style={containerStyle}>
      <div style={topTabsContainerStyle}>
        {benefits.map((benefit, index) => (
          <button
            key={index}
            onClick={() => setSelectedBenefit(index)}
            style={topTabStyle(selectedBenefit === index)}
          >
            <span style={{ fontSize: '1.25rem' }}>{benefit.icon}</span>
            <span>{benefit.title[locale] || benefit.title.en}</span>
          </button>
        ))}
      </div>

      <div style={contentCardStyle}>
        <div style={innerTabsContainerStyle}>
          <button
            onClick={() => setInnerTab(selectedBenefit, 'diagram')}
            style={innerTabStyle(currentInnerTab === 'diagram')}
          >
            {currentLabels.diagram}
          </button>
          <button
            onClick={() => setInnerTab(selectedBenefit, 'yaml')}
            style={innerTabStyle(currentInnerTab === 'yaml')}
          >
            {currentLabels.yaml}
          </button>
        </div>

        {currentInnerTab === 'diagram' ? (
          <div>{currentBenefit.diagram}</div>
        ) : (
          <YAMLCodeBlock yaml={currentBenefit.yaml} isDark={isDark} />
        )}
      </div>
    </div>
  );
};

// YAML Code Block with Syntax Highlighting
const YAMLCodeBlock = ({ yaml, isDark }) => {
  const highlightYAML = (code) => {
    const lines = code.split('\n');
    return lines.map((line, index) => {
      let highlightedLine = line;

      // Comments (green/gray)
      if (line.trim().startsWith('#')) {
        return (
          <div key={index} style={{ color: isDark ? '#6ee7b7' : '#059669' }}>
            {line}
          </div>
        );
      }

      // Keys (cyan/blue)
      highlightedLine = line.replace(
        /^(\s*)([a-zA-Z_][a-zA-Z0-9_-]*):/,
        (match, indent, key) => {
          return `${indent}<span style="color: ${isDark ? '#67e8f9' : '#0891b2'}; font-weight: 600;">${key}</span>:`;
        }
      );

      // String values (orange/amber)
      highlightedLine = highlightedLine.replace(
        /:\s*"([^"]*)"/g,
        (match, value) => {
          return `: <span style="color: ${isDark ? '#fbbf24' : '#d97706'};">"${value}"</span>`;
        }
      );

      // String values without quotes (yellow)
      highlightedLine = highlightedLine.replace(
        /:\s+([a-zA-Z][a-zA-Z0-9_.\-/:]*)(?=\s|$)/g,
        (match, value) => {
          return `: <span style="color: ${isDark ? '#fde047' : '#ca8a04'};">${value}</span>`;
        }
      );

      // Numbers (purple/violet)
      highlightedLine = highlightedLine.replace(
        /:\s+(\d+)/g,
        (match, number) => {
          return `: <span style="color: ${isDark ? '#c084fc' : '#9333ea'};">${number}</span>`;
        }
      );

      // Dashes for list items (pink)
      highlightedLine = highlightedLine.replace(
        /^(\s*)(-)(\s)/,
        (match, indent, dash, space) => {
          return `${indent}<span style="color: ${isDark ? '#f472b6' : '#db2777'};">${dash}</span>${space}`;
        }
      );

      return (
        <div key={index} dangerouslySetInnerHTML={{ __html: highlightedLine }} />
      );
    });
  };

  const containerStyle = {
    position: 'relative',
    background: isDark
      ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderRadius: '12px',
    padding: '1.5rem',
    overflowX: 'auto',
    border: `2px solid ${isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`,
    boxShadow: isDark
      ? '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
      : '0 4px 12px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
  };

  const badgeStyle = {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    padding: '0.25rem 0.75rem',
    background: isDark
      ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
      : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: '700',
    borderRadius: '6px',
    letterSpacing: '0.05em',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  };

  const codeStyle = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '0.875rem',
    lineHeight: '1.75',
    color: isDark ? '#e2e8f0' : '#1e293b',
    margin: 0,
    whiteSpace: 'pre',
    paddingRight: '4rem',
  };

  return (
    <div style={containerStyle}>
      <div style={badgeStyle}>YAML</div>
      <pre style={codeStyle}>
        <code>{highlightYAML(yaml)}</code>
      </pre>
    </div>
  );
};

// Diagram Components with Enhanced Visuals

const RBACDiagram = ({ isDark }) => {
  const containerStyle = {
    display: 'flex',
    gap: '3rem',
    alignItems: 'center',
    padding: '3rem 2rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  };

  const leftBoxStyle = {
    flex: '0 0 240px',
    padding: '2rem',
    background: isDark
      ? 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)'
      : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    borderRadius: '16px',
    border: `3px solid ${isDark ? '#dc2626' : '#ef4444'}`,
    textAlign: 'center',
    position: 'relative',
    boxShadow: isDark
      ? '0 8px 24px rgba(220, 38, 38, 0.3)'
      : '0 8px 24px rgba(239, 68, 68, 0.15)',
  };

  const crossStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(45deg)',
    fontSize: '5rem',
    color: isDark ? '#dc2626' : '#ef4444',
    fontWeight: 'bold',
    opacity: 0.8,
  };

  const layersContainerStyle = {
    flex: '1',
    minWidth: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  };

  const layerStyle = (color, gradient) => ({
    padding: '1.75rem 2rem',
    background: gradient,
    borderRadius: '12px',
    border: `3px solid ${color}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '1rem',
    fontWeight: '600',
    boxShadow: isDark
      ? `0 4px 12px ${color}40`
      : `0 4px 12px ${color}20`,
    transition: 'transform 0.2s ease',
  });

  const separatorStyle = {
    height: '2px',
    background: `linear-gradient(90deg, transparent 0%, ${isDark ? '#6b7280' : '#d1d5db'} 50%, transparent 100%)`,
    margin: '0.5rem 0',
    position: 'relative',
  };

  const separatorLabelStyle = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    background: isDark ? '#1f2937' : '#ffffff',
    padding: '0.375rem 1rem',
    fontSize: '0.8125rem',
    color: isDark ? '#9ca3af' : '#6b7280',
    fontWeight: '600',
    borderRadius: '999px',
    border: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    whiteSpace: 'nowrap',
  };

  const iconStyle = {
    fontSize: '1.5rem',
  };

  return (
    <div style={containerStyle}>
      <div style={leftBoxStyle}>
        <div style={crossStyle}>✕</div>
        <div style={{ position: 'relative', zIndex: 1, color: isDark ? '#fca5a5' : '#dc2626' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚫</div>
          <strong style={{ fontSize: '1.125rem' }}>기존 Ingress</strong>
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.9 }}>단일 권한 모델</div>
        </div>
      </div>

      <div style={layersContainerStyle}>
        <div style={layerStyle(
          '#3b82f6',
          isDark
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.25) 100%)'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 197, 253, 0.15) 100%)'
        )}>
          <span><span style={iconStyle}>🏢</span> 인프라 팀 → GatewayClass</span>
          <span style={{ fontSize: '1.25rem' }}>🔒</span>
        </div>
        <div style={separatorStyle}>
          <span style={separatorLabelStyle}>RBAC 격리</span>
        </div>
        <div style={layerStyle(
          '#10b981',
          isDark
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.25) 100%)'
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(110, 231, 183, 0.15) 100%)'
        )}>
          <span><span style={iconStyle}>🔧</span> 플랫폼 팀 → Gateway</span>
          <span style={{ fontSize: '1.25rem' }}>🔒</span>
        </div>
        <div style={separatorStyle}>
          <span style={separatorLabelStyle}>RBAC 격리</span>
        </div>
        <div style={layerStyle(
          '#f59e0b',
          isDark
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.25) 100%)'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(252, 211, 77, 0.15) 100%)'
        )}>
          <span><span style={iconStyle}>💻</span> 앱 팀 → HTTPRoute</span>
          <span style={{ fontSize: '1.25rem' }}>🔒</span>
        </div>
      </div>
    </div>
  );
};

const ExpressiveRoutingDiagram = ({ isDark }) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '3rem 2rem',
    gap: '3rem',
  };

  const centralBoxStyle = {
    padding: '2rem 3rem',
    background: isDark
      ? 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
      : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
    borderRadius: '16px',
    border: `3px solid ${isDark ? '#6b7280' : '#d1d5db'}`,
    fontWeight: 'bold',
    fontSize: '1.5rem',
    boxShadow: isDark
      ? '0 8px 24px rgba(0, 0, 0, 0.4)'
      : '0 8px 24px rgba(0, 0, 0, 0.1)',
    position: 'relative',
  };

  const labelStyle = {
    position: 'absolute',
    top: '-1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    background: isDark
      ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
      : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#fff',
    padding: '0.375rem 1rem',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '0.05em',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  };

  const flowsContainerStyle = {
    display: 'flex',
    gap: '2.5rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  };

  const flowStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.25rem',
    minWidth: '220px',
  };

  const matchBoxStyle = (color, gradient) => ({
    padding: '1.25rem 1.5rem',
    background: gradient,
    borderRadius: '12px',
    border: `3px solid ${color}`,
    fontSize: '0.9375rem',
    textAlign: 'center',
    fontWeight: '600',
    minHeight: '80px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '0.5rem',
    boxShadow: isDark
      ? `0 4px 12px ${color}40`
      : `0 4px 12px ${color}20`,
  });

  const arrowStyle = {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: isDark ? '#9ca3af' : '#6b7280',
  };

  const backendBoxStyle = (color) => ({
    padding: '1.25rem 1.5rem',
    background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
    borderRadius: '12px',
    color: '#fff',
    fontWeight: '700',
    fontSize: '1rem',
    textAlign: 'center',
    boxShadow: `0 6px 16px ${color}60`,
    border: `2px solid ${color}`,
  });

  const tagStyle = {
    fontSize: '0.75rem',
    opacity: 0.9,
    fontWeight: '500',
  };

  return (
    <div style={containerStyle}>
      <div style={centralBoxStyle}>
        <div style={labelStyle}>GATEWAY API</div>
        HTTPRoute
      </div>
      <div style={flowsContainerStyle}>
        <div style={flowStyle}>
          <div style={matchBoxStyle(
            '#3b82f6',
            isDark
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.25) 100%)'
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 197, 253, 0.15) 100%)'
          )}>
            <div style={{ fontSize: '1.5rem' }}>📋</div>
            <div>Header Match</div>
            <div style={tagStyle}>X-User-Group: beta</div>
          </div>
          <div style={arrowStyle}>↓</div>
          <div style={backendBoxStyle('#3b82f6')}>
            🎯 beta-backend
          </div>
        </div>
        <div style={flowStyle}>
          <div style={matchBoxStyle(
            '#10b981',
            isDark
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.25) 100%)'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(110, 231, 183, 0.15) 100%)'
          )}>
            <div style={{ fontSize: '1.5rem' }}>🔍</div>
            <div>Query Match</div>
            <div style={tagStyle}>?version=2</div>
          </div>
          <div style={arrowStyle}>↓</div>
          <div style={backendBoxStyle('#10b981')}>
            🎯 v2-backend
          </div>
        </div>
        <div style={flowStyle}>
          <div style={matchBoxStyle(
            '#f59e0b',
            isDark
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.25) 100%)'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(252, 211, 77, 0.15) 100%)'
          )}>
            <div style={{ fontSize: '1.5rem' }}>✉️</div>
            <div>Method Match</div>
            <div style={tagStyle}>POST /api/write</div>
          </div>
          <div style={arrowStyle}>↓</div>
          <div style={backendBoxStyle('#f59e0b')}>
            🎯 write-backend
          </div>
        </div>
      </div>
    </div>
  );
};

const ExtensibleDesignDiagram = ({ isDark }) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '3rem 2rem',
    gap: '2.5rem',
  };

  const centralBoxStyle = {
    padding: '2rem 3rem',
    background: isDark
      ? 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
      : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
    borderRadius: '16px',
    border: `3px solid ${isDark ? '#6b7280' : '#d1d5db'}`,
    fontWeight: 'bold',
    fontSize: '1.5rem',
    boxShadow: isDark
      ? '0 8px 24px rgba(0, 0, 0, 0.4)'
      : '0 8px 24px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    zIndex: 2,
  };

  const policiesContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    width: '100%',
    maxWidth: '900px',
  };

  const policyBoxStyle = (color, gradient, icon) => ({
    padding: '1.5rem',
    background: gradient,
    borderRadius: '12px',
    border: `3px dashed ${color}`,
    fontSize: '0.9375rem',
    fontWeight: '600',
    textAlign: 'center',
    boxShadow: isDark
      ? `0 4px 12px ${color}40`
      : `0 4px 12px ${color}20`,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    alignItems: 'center',
  });

  const labelStyle = {
    background: isDark
      ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
      : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#fff',
    padding: '0.5rem 1.5rem',
    borderRadius: '999px',
    fontSize: '0.875rem',
    fontWeight: '700',
    letterSpacing: '0.05em',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  };

  return (
    <div style={containerStyle}>
      <div style={centralBoxStyle}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
        HTTPRoute (Core)
      </div>

      <div style={policiesContainerStyle}>
        <div style={policyBoxStyle(
          '#3b82f6',
          isDark
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(147, 197, 253, 0.12) 100%)',
          '⏱️'
        )}>
          <div style={{ fontSize: '2rem' }}>⏱️</div>
          <div>RateLimit Policy</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>요청 속도 제한</div>
        </div>

        <div style={policyBoxStyle(
          '#10b981',
          isDark
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(110, 231, 183, 0.12) 100%)',
          '🔄'
        )}>
          <div style={{ fontSize: '2rem' }}>🔄</div>
          <div>Retry Policy</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>자동 재시도</div>
        </div>

        <div style={policyBoxStyle(
          '#f59e0b',
          isDark
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(252, 211, 77, 0.12) 100%)',
          '🔐'
        )}>
          <div style={{ fontSize: '2rem' }}>🔐</div>
          <div>Auth Policy</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>인증/인가</div>
        </div>
      </div>

      <div style={labelStyle}>
        Policy Attachment 패턴 (확장 가능)
      </div>
    </div>
  );
};

const MultiProtocolDiagram = ({ isDark }) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '3rem 2rem',
    gap: '3rem',
  };

  const centralBoxStyle = {
    padding: '2rem 3rem',
    background: isDark
      ? 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
      : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
    borderRadius: '16px',
    border: `3px solid ${isDark ? '#6b7280' : '#d1d5db'}`,
    fontWeight: 'bold',
    fontSize: '1.5rem',
    boxShadow: isDark
      ? '0 8px 24px rgba(0, 0, 0, 0.4)'
      : '0 8px 24px rgba(0, 0, 0, 0.1)',
  };

  const protocolsContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1.5rem',
    width: '100%',
    maxWidth: '1000px',
  };

  const protocolBoxStyle = (color, gradient, icon) => ({
    padding: '1.75rem 1.5rem',
    background: gradient,
    borderRadius: '12px',
    border: `3px solid ${color}`,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    alignItems: 'center',
    boxShadow: isDark
      ? `0 6px 16px ${color}50`
      : `0 6px 16px ${color}30`,
    transition: 'transform 0.2s ease',
  });

  const iconStyle = {
    fontSize: '2.5rem',
  };

  const portStyle = {
    fontSize: '1.125rem',
    fontWeight: '700',
  };

  const descStyle = {
    fontSize: '0.75rem',
    fontWeight: '500',
    opacity: 0.85,
  };

  return (
    <div style={containerStyle}>
      <div style={centralBoxStyle}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌐</div>
        Gateway
      </div>
      <div style={protocolsContainerStyle}>
        <div style={protocolBoxStyle(
          '#3b82f6',
          isDark
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.25) 100%)'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 197, 253, 0.15) 100%)'
        )}>
          <div style={iconStyle}>🌍</div>
          <div>HTTPRoute</div>
          <div style={portStyle}>:80</div>
          <div style={descStyle}>HTTP/1.1, HTTP/2</div>
        </div>
        <div style={protocolBoxStyle(
          '#10b981',
          isDark
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.25) 100%)'
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(110, 231, 183, 0.15) 100%)'
        )}>
          <div style={iconStyle}>🔒</div>
          <div>TLSRoute</div>
          <div style={portStyle}>:443</div>
          <div style={descStyle}>HTTPS, TLS termination</div>
        </div>
        <div style={protocolBoxStyle(
          '#8b5cf6',
          isDark
            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(124, 58, 237, 0.25) 100%)'
            : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(196, 181, 253, 0.15) 100%)'
        )}>
          <div style={iconStyle}>🗄️</div>
          <div>TCPRoute</div>
          <div style={portStyle}>:3306</div>
          <div style={descStyle}>MySQL, Redis</div>
        </div>
        <div style={protocolBoxStyle(
          '#f59e0b',
          isDark
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.25) 100%)'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(252, 211, 77, 0.15) 100%)'
        )}>
          <div style={iconStyle}>📡</div>
          <div>UDPRoute</div>
          <div style={portStyle}>:53</div>
          <div style={descStyle}>DNS, syslog</div>
        </div>
        <div style={protocolBoxStyle(
          '#06b6d4',
          isDark
            ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(8, 145, 178, 0.25) 100%)'
            : 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(103, 232, 249, 0.15) 100%)'
        )}>
          <div style={iconStyle}>⚡</div>
          <div>GRPCRoute</div>
          <div style={portStyle}>:50051</div>
          <div style={descStyle}>gRPC services</div>
        </div>
      </div>
    </div>
  );
};

const PortabilityDiagram = ({ isDark }) => {
  const containerStyle = {
    display: 'flex',
    gap: '2.5rem',
    alignItems: 'center',
    padding: '3rem 2rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  };

  const stateBoxStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minWidth: '280px',
  };

  const labelStyle = {
    fontWeight: 'bold',
    fontSize: '1.25rem',
    textAlign: 'center',
    marginBottom: '0.75rem',
    padding: '0.5rem 1rem',
    background: isDark
      ? 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
      : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
    borderRadius: '12px',
    border: `2px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
  };

  const resourceBoxStyle = (color, highlight, icon) => ({
    padding: '1.25rem 1.5rem',
    background: highlight
      ? isDark
        ? `linear-gradient(135deg, ${color}60 0%, ${color}40 100%)`
        : `linear-gradient(135deg, ${color}40 0%, ${color}20 100%)`
      : isDark
      ? 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
      : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
    borderRadius: '12px',
    border: `3px solid ${highlight ? color : isDark ? '#4b5563' : '#d1d5db'}`,
    fontSize: '0.9375rem',
    textAlign: 'center',
    fontWeight: highlight ? '700' : '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    boxShadow: highlight
      ? isDark
        ? `0 6px 16px ${color}60`
        : `0 6px 16px ${color}40`
      : isDark
      ? '0 2px 8px rgba(0, 0, 0, 0.3)'
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
  });

  const arrowContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  };

  const arrowStyle = {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: isDark ? '#9ca3af' : '#6b7280',
  };

  const arrowLabelStyle = {
    fontSize: '0.875rem',
    textAlign: 'center',
    color: isDark ? '#9ca3af' : '#6b7280',
    fontWeight: '600',
    background: isDark
      ? 'rgba(59, 130, 246, 0.2)'
      : 'rgba(59, 130, 246, 0.1)',
    padding: '0.5rem 1rem',
    borderRadius: '999px',
    border: `2px solid ${isDark ? '#3b82f6' : '#60a5fa'}`,
  };

  return (
    <div style={containerStyle}>
      <div style={stateBoxStyle}>
        <div style={labelStyle}>⏮️ Before</div>
        <div style={resourceBoxStyle('#3b82f6', true, '🎯')}>
          <span style={{ fontSize: '1.5rem' }}>🎯</span>
          <span>GatewayClass = Cilium</span>
        </div>
        <div style={resourceBoxStyle('#10b981', false, '🚪')}>
          <span style={{ fontSize: '1.25rem' }}>🚪</span>
          <span>Gateway</span>
        </div>
        <div style={resourceBoxStyle('#f59e0b', false, '🔀')}>
          <span style={{ fontSize: '1.25rem' }}>🔀</span>
          <span>HTTPRoute</span>
        </div>
        <div style={resourceBoxStyle('#6b7280', false, '⚙️')}>
          <span style={{ fontSize: '1.25rem' }}>⚙️</span>
          <span>Service</span>
        </div>
      </div>

      <div style={arrowContainerStyle}>
        <div style={arrowStyle}>→</div>
        <div style={arrowLabelStyle}>
          <div>GatewayClass만 교체</div>
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.85 }}>나머지는 변경 없음</div>
        </div>
      </div>

      <div style={stateBoxStyle}>
        <div style={labelStyle}>⏭️ After</div>
        <div style={resourceBoxStyle('#3b82f6', true, '🎯')}>
          <span style={{ fontSize: '1.5rem' }}>🎯</span>
          <span>GatewayClass = AWS LBC</span>
        </div>
        <div style={resourceBoxStyle('#10b981', false, '🚪')}>
          <span style={{ fontSize: '1.25rem' }}>🚪</span>
          <span>Gateway</span>
        </div>
        <div style={resourceBoxStyle('#f59e0b', false, '🔀')}>
          <span style={{ fontSize: '1.25rem' }}>🔀</span>
          <span>HTTPRoute</span>
        </div>
        <div style={resourceBoxStyle('#6b7280', false, '⚙️')}>
          <span style={{ fontSize: '1.25rem' }}>⚙️</span>
          <span>Service</span>
        </div>
      </div>
    </div>
  );
};

const TypeSafetyDiagram = ({ isDark }) => {
  const containerStyle = {
    display: 'flex',
    gap: '2.5rem',
    padding: '3rem 2rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  };

  const columnStyle = {
    flex: '1',
    minWidth: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  };

  const headerStyle = (color, gradient) => ({
    padding: '1.25rem 1.5rem',
    background: gradient,
    borderRadius: '12px',
    border: `3px solid ${color}`,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '1.25rem',
    boxShadow: isDark
      ? `0 6px 16px ${color}50`
      : `0 6px 16px ${color}30`,
  });

  const codeBoxStyle = (bgColor, borderColor) => ({
    padding: '1.5rem',
    background: bgColor,
    borderRadius: '12px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '0.8125rem',
    lineHeight: '1.6',
    border: `2px solid ${borderColor}`,
    boxShadow: isDark
      ? '0 4px 12px rgba(0, 0, 0, 0.3)'
      : '0 4px 12px rgba(0, 0, 0, 0.1)',
  });

  const strikethroughStyle = {
    textDecoration: 'line-through',
    color: '#ef4444',
    fontWeight: 'bold',
  };

  const arrowStyle = (color, gradient) => ({
    padding: '1rem',
    background: gradient,
    borderRadius: '12px',
    border: `3px solid ${color}`,
    textAlign: 'center',
    fontSize: '2rem',
    fontWeight: 'bold',
  });

  const resultStyle = (color, gradient, icon) => ({
    padding: '1.5rem',
    background: gradient,
    borderRadius: '12px',
    border: `3px solid ${color}`,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: '1.125rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    boxShadow: isDark
      ? `0 6px 16px ${color}60`
      : `0 6px 16px ${color}40`,
  });

  return (
    <div style={containerStyle}>
      <div style={columnStyle}>
        <div style={headerStyle(
          '#ef4444',
          isDark
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%)'
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(252, 165, 165, 0.15) 100%)'
        )}>
          ❌ NGINX Ingress
        </div>
        <div style={codeBoxStyle(
          isDark ? '#0f172a' : '#1e293b',
          isDark ? '#374151' : '#475569'
        )}>
          <div style={{ color: '#67e8f9' }}>annotations:</div>
          <div style={{ color: '#e2e8f0', marginLeft: '1rem' }}>
            nginx.ingress.kubernetes.io/
          </div>
          <div style={{ ...strikethroughStyle, marginLeft: '2rem' }}>
            rewrite-traget: /
          </div>
          <div style={{ color: '#6ee7b7', marginLeft: '1rem' }}>
            # 오타!
          </div>
        </div>
        <div style={arrowStyle(
          '#ef4444',
          isDark
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.25) 100%)'
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(252, 165, 165, 0.15) 100%)'
        )}>
          ↓
        </div>
        <div style={resultStyle(
          '#ef4444',
          isDark
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.35) 0%, rgba(220, 38, 38, 0.35) 100%)'
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(252, 165, 165, 0.2) 100%)'
        )}>
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <span>런타임 에러 발생</span>
        </div>
      </div>

      <div style={columnStyle}>
        <div style={headerStyle(
          '#22c55e',
          isDark
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.3) 100%)'
            : 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(134, 239, 172, 0.15) 100%)'
        )}>
          ✅ Gateway API
        </div>
        <div style={codeBoxStyle(
          isDark ? '#0f172a' : '#1e293b',
          isDark ? '#374151' : '#475569'
        )}>
          <div style={{ color: '#67e8f9' }}>spec:</div>
          <div style={{ color: '#67e8f9', marginLeft: '1rem' }}>rules:</div>
          <div style={{ color: '#f472b6', marginLeft: '1rem' }}>-</div>
          <div style={{ color: '#67e8f9', marginLeft: '2rem' }}>filters:</div>
          <div style={{ color: '#f472b6', marginLeft: '2rem' }}>-</div>
          <div style={{ color: '#67e8f9', marginLeft: '3rem' }}>
            type: <span style={{ color: '#fde047' }}>URLRewrite</span>
          </div>
          <div style={{ color: '#67e8f9', marginLeft: '4rem' }}>urlRewrite:</div>
          <div style={{ color: '#67e8f9', marginLeft: '5rem' }}>path:</div>
          <div style={{ color: '#67e8f9', marginLeft: '6rem' }}>
            replacePrefixMatch: <span style={{ color: '#fde047' }}>/</span>
          </div>
        </div>
        <div style={arrowStyle(
          '#22c55e',
          isDark
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, rgba(22, 163, 74, 0.25) 100%)'
            : 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(134, 239, 172, 0.15) 100%)'
        )}>
          ↓
        </div>
        <div style={resultStyle(
          '#22c55e',
          isDark
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.35) 0%, rgba(22, 163, 74, 0.35) 100%)'
            : 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(134, 239, 172, 0.2) 100%)'
        )}>
          <span style={{ fontSize: '2rem' }}>✓</span>
          <span>배포 시점에 차단</span>
        </div>
      </div>
    </div>
  );
};

export default GatewayApiBenefits;
