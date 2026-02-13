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
  };

  const topTabsContainerStyle = {
    display: 'flex',
    overflowX: 'auto',
    gap: '0.5rem',
    marginBottom: '2rem',
    paddingBottom: '0.5rem',
    borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
  };

  const topTabStyle = (isActive) => ({
    padding: '0.75rem 1.5rem',
    borderRadius: '9999px',
    border: 'none',
    background: isActive
      ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
      : isDark
      ? '#374151'
      : '#f3f4f6',
    color: isActive ? '#fff' : isDark ? '#d1d5db' : '#4b5563',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  });

  const contentCardStyle = {
    background: isDark ? '#1f2937' : '#ffffff',
    borderRadius: '1rem',
    padding: '2rem',
    boxShadow: isDark
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  };

  const innerTabsContainerStyle = {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
  };

  const innerTabStyle = (isActive) => ({
    padding: '0.5rem 1rem',
    border: 'none',
    background: 'transparent',
    color: isActive
      ? isDark
        ? '#60a5fa'
        : '#3b82f6'
      : isDark
      ? '#9ca3af'
      : '#6b7280',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    borderBottom: isActive ? `2px solid ${isDark ? '#60a5fa' : '#3b82f6'}` : 'none',
    transition: 'all 0.2s',
  });

  const yamlContainerStyle = {
    background: isDark ? '#0f172a' : '#1e293b',
    borderRadius: '0.5rem',
    padding: '1rem',
    overflowX: 'auto',
  };

  const yamlCodeStyle = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '0.875rem',
    lineHeight: '1.7',
    color: '#e2e8f0',
    margin: 0,
    whiteSpace: 'pre',
  };

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
            <span>{benefit.icon}</span>
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
          <div style={yamlContainerStyle}>
            <pre style={yamlCodeStyle}>
              <code>{currentBenefit.yaml}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

// Diagram Components
const RBACDiagram = ({ isDark }) => {
  const containerStyle = {
    display: 'flex',
    gap: '2rem',
    alignItems: 'center',
    padding: '2rem',
    flexWrap: 'wrap',
  };

  const leftBoxStyle = {
    flex: '0 0 200px',
    padding: '1.5rem',
    background: isDark ? '#7f1d1d' : '#fee2e2',
    borderRadius: '0.5rem',
    border: `2px solid ${isDark ? '#991b1b' : '#ef4444'}`,
    textAlign: 'center',
    position: 'relative',
  };

  const crossStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(45deg)',
    fontSize: '4rem',
    color: isDark ? '#dc2626' : '#ef4444',
    fontWeight: 'bold',
  };

  const layersContainerStyle = {
    flex: '1',
    minWidth: '300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  };

  const layerStyle = (color) => ({
    padding: '1.5rem',
    background: isDark ? `${color}20` : `${color}10`,
    borderRadius: '0.5rem',
    border: `2px solid ${color}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  });

  const separatorStyle = {
    height: '1px',
    background: isDark ? '#4b5563' : '#d1d5db',
    margin: '0.5rem 0',
    position: 'relative',
  };

  const separatorLabelStyle = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    background: isDark ? '#1f2937' : '#ffffff',
    padding: '0 0.5rem',
    fontSize: '0.75rem',
    color: isDark ? '#9ca3af' : '#6b7280',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={containerStyle}>
      <div style={leftBoxStyle}>
        <div style={crossStyle}>✕</div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <strong>기존 Ingress</strong>
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>단일 권한</div>
        </div>
      </div>

      <div style={layersContainerStyle}>
        <div style={layerStyle('#3b82f6')}>
          <span>🔒 인프라 팀 → GatewayClass</span>
        </div>
        <div style={separatorStyle}>
          <span style={separatorLabelStyle}>RBAC 격리</span>
        </div>
        <div style={layerStyle('#10b981')}>
          <span>🔒 플랫폼 팀 → Gateway</span>
        </div>
        <div style={separatorStyle}>
          <span style={separatorLabelStyle}>RBAC 격리</span>
        </div>
        <div style={layerStyle('#f59e0b')}>
          <span>🔒 앱 팀 → HTTPRoute</span>
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
    padding: '2rem',
    gap: '2rem',
  };

  const centralBoxStyle = {
    padding: '1.5rem 2rem',
    background: isDark ? '#374151' : '#f3f4f6',
    borderRadius: '0.5rem',
    border: `2px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
    fontWeight: 'bold',
    fontSize: '1.125rem',
  };

  const flowsContainerStyle = {
    display: 'flex',
    gap: '2rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  };

  const flowStyle = (color) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    minWidth: '200px',
  });

  const matchBoxStyle = (color) => ({
    padding: '1rem',
    background: isDark ? `${color}20` : `${color}10`,
    borderRadius: '0.5rem',
    border: `2px solid ${color}`,
    fontSize: '0.875rem',
    textAlign: 'center',
  });

  const arrowStyle = {
    fontSize: '1.5rem',
    color: isDark ? '#9ca3af' : '#6b7280',
  };

  const backendBoxStyle = (color) => ({
    padding: '1rem',
    background: color,
    borderRadius: '0.5rem',
    color: '#fff',
    fontWeight: '600',
    fontSize: '0.875rem',
    textAlign: 'center',
  });

  return (
    <div style={containerStyle}>
      <div style={centralBoxStyle}>HTTPRoute</div>
      <div style={flowsContainerStyle}>
        <div style={flowStyle('#3b82f6')}>
          <div style={matchBoxStyle('#3b82f6')}>
            Header: X-User-Group=beta
          </div>
          <div style={arrowStyle}>↓</div>
          <div style={backendBoxStyle('#3b82f6')}>beta-backend</div>
        </div>
        <div style={flowStyle('#10b981')}>
          <div style={matchBoxStyle('#10b981')}>
            Query: ?version=2
          </div>
          <div style={arrowStyle}>↓</div>
          <div style={backendBoxStyle('#10b981')}>v2-backend</div>
        </div>
        <div style={flowStyle('#f59e0b')}>
          <div style={matchBoxStyle('#f59e0b')}>
            Method: POST /api/write
          </div>
          <div style={arrowStyle}>↓</div>
          <div style={backendBoxStyle('#f59e0b')}>write-backend</div>
        </div>
      </div>
    </div>
  );
};

const ExtensibleDesignDiagram = ({ isDark }) => {
  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
    position: 'relative',
    minHeight: '300px',
  };

  const centralBoxStyle = {
    padding: '2rem',
    background: isDark ? '#374151' : '#f3f4f6',
    borderRadius: '0.5rem',
    border: `2px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
    fontWeight: 'bold',
    fontSize: '1.125rem',
    position: 'relative',
    zIndex: 2,
  };

  const policyBoxStyle = (color, position) => ({
    position: 'absolute',
    padding: '1rem 1.5rem',
    background: isDark ? `${color}20` : `${color}10`,
    borderRadius: '0.5rem',
    border: `2px dashed ${color}`,
    fontSize: '0.875rem',
    fontWeight: '600',
    ...position,
    zIndex: 1,
  });

  const labelStyle = {
    position: 'absolute',
    bottom: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    background: isDark ? '#1f2937' : '#ffffff',
    padding: '0.5rem 1rem',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    color: isDark ? '#9ca3af' : '#6b7280',
    fontWeight: '500',
    zIndex: 3,
  };

  return (
    <div style={containerStyle}>
      <div style={centralBoxStyle}>HTTPRoute</div>
      <div style={policyBoxStyle('#3b82f6', { top: '2rem', left: '5%' })}>
        RateLimit Policy
      </div>
      <div style={policyBoxStyle('#10b981', { top: '2rem', right: '5%' })}>
        Retry Policy
      </div>
      <div style={policyBoxStyle('#f59e0b', { bottom: '4rem', left: '50%', transform: 'translateX(-50%)' })}>
        Auth Policy
      </div>
      <div style={labelStyle}>Policy Attachment 패턴</div>
    </div>
  );
};

const MultiProtocolDiagram = ({ isDark }) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem',
    gap: '2rem',
  };

  const centralBoxStyle = {
    padding: '2rem',
    background: isDark ? '#374151' : '#f3f4f6',
    borderRadius: '0.5rem',
    border: `2px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
    fontWeight: 'bold',
    fontSize: '1.125rem',
  };

  const protocolsContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    width: '100%',
    maxWidth: '800px',
  };

  const protocolBoxStyle = (color) => ({
    padding: '1rem',
    background: isDark ? `${color}20` : `${color}10`,
    borderRadius: '0.5rem',
    border: `2px solid ${color}`,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '0.875rem',
  });

  return (
    <div style={containerStyle}>
      <div style={centralBoxStyle}>Gateway</div>
      <div style={protocolsContainerStyle}>
        <div style={protocolBoxStyle('#3b82f6')}>
          HTTPRoute<br />:80
        </div>
        <div style={protocolBoxStyle('#10b981')}>
          🔒 TLSRoute<br />:443
        </div>
        <div style={protocolBoxStyle('#8b5cf6')}>
          TCPRoute<br />:3306
        </div>
        <div style={protocolBoxStyle('#f59e0b')}>
          UDPRoute<br />:53
        </div>
        <div style={protocolBoxStyle('#06b6d4')}>
          GRPCRoute<br />:50051
        </div>
      </div>
    </div>
  );
};

const PortabilityDiagram = ({ isDark }) => {
  const containerStyle = {
    display: 'flex',
    gap: '2rem',
    alignItems: 'center',
    padding: '2rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  };

  const stateBoxStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minWidth: '250px',
  };

  const labelStyle = {
    fontWeight: 'bold',
    fontSize: '1rem',
    textAlign: 'center',
    marginBottom: '0.5rem',
  };

  const resourceBoxStyle = (color, highlight) => ({
    padding: '1rem',
    background: highlight
      ? isDark
        ? `${color}40`
        : `${color}30`
      : isDark
      ? '#374151'
      : '#f3f4f6',
    borderRadius: '0.5rem',
    border: `2px solid ${highlight ? color : isDark ? '#4b5563' : '#d1d5db'}`,
    fontSize: '0.875rem',
    textAlign: 'center',
    fontWeight: highlight ? '600' : '400',
  });

  const arrowStyle = {
    fontSize: '2rem',
    color: isDark ? '#9ca3af' : '#6b7280',
    display: 'flex',
    alignItems: 'center',
  };

  const arrowLabelStyle = {
    fontSize: '0.75rem',
    textAlign: 'center',
    marginTop: '0.5rem',
    color: isDark ? '#9ca3af' : '#6b7280',
  };

  return (
    <div style={containerStyle}>
      <div style={stateBoxStyle}>
        <div style={labelStyle}>Before</div>
        <div style={resourceBoxStyle('#3b82f6', true)}>GatewayClass=Cilium</div>
        <div style={resourceBoxStyle('#10b981', false)}>Gateway</div>
        <div style={resourceBoxStyle('#f59e0b', false)}>HTTPRoute</div>
        <div style={resourceBoxStyle('#6b7280', false)}>Service</div>
      </div>

      <div>
        <div style={arrowStyle}>→</div>
        <div style={arrowLabelStyle}>GatewayClass만 교체</div>
      </div>

      <div style={stateBoxStyle}>
        <div style={labelStyle}>After</div>
        <div style={resourceBoxStyle('#3b82f6', true)}>GatewayClass=AWS LBC</div>
        <div style={resourceBoxStyle('#10b981', false)}>Gateway</div>
        <div style={resourceBoxStyle('#f59e0b', false)}>HTTPRoute</div>
        <div style={resourceBoxStyle('#6b7280', false)}>Service</div>
      </div>
    </div>
  );
};

const TypeSafetyDiagram = ({ isDark }) => {
  const containerStyle = {
    display: 'flex',
    gap: '2rem',
    padding: '2rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  };

  const columnStyle = {
    flex: '1',
    minWidth: '280px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  };

  const headerStyle = (color) => ({
    padding: '1rem',
    background: isDark ? `${color}20` : `${color}10`,
    borderRadius: '0.5rem',
    border: `2px solid ${color}`,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '1rem',
  });

  const codeBoxStyle = (bgColor) => ({
    padding: '1rem',
    background: isDark ? '#0f172a' : bgColor,
    borderRadius: '0.5rem',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    lineHeight: '1.5',
  });

  const strikethroughStyle = {
    textDecoration: 'line-through',
    color: '#ef4444',
  };

  const arrowStyle = (color) => ({
    padding: '0.75rem',
    background: isDark ? `${color}20` : `${color}10`,
    borderRadius: '0.5rem',
    border: `2px solid ${color}`,
    textAlign: 'center',
    fontSize: '0.875rem',
    fontWeight: '600',
  });

  const resultStyle = (color) => ({
    padding: '1rem',
    background: isDark ? `${color}30` : `${color}20`,
    borderRadius: '0.5rem',
    border: `2px solid ${color}`,
    textAlign: 'center',
    fontWeight: '600',
  });

  return (
    <div style={containerStyle}>
      <div style={columnStyle}>
        <div style={headerStyle('#ef4444')}>❌ NGINX Ingress</div>
        <div style={codeBoxStyle('#1e1e1e')}>
          <div>annotations:</div>
          <div>  nginx.ingress.kubernetes.io/</div>
          <div style={strikethroughStyle}>    rewrite-traget: /</div>
          <div style={{ color: '#6b7280' }}>  # 오타!</div>
        </div>
        <div style={arrowStyle('#ef4444')}>↓</div>
        <div style={resultStyle('#ef4444')}>⚠️ 런타임 에러</div>
      </div>

      <div style={columnStyle}>
        <div style={headerStyle('#22c55e')}>✅ Gateway API</div>
        <div style={codeBoxStyle('#1e1e1e')}>
          <div>spec:</div>
          <div>  rules:</div>
          <div>  - filters:</div>
          <div>    - type: URLRewrite</div>
          <div>      urlRewrite:</div>
          <div>        path:</div>
          <div>          replacePrefixMatch: /</div>
        </div>
        <div style={arrowStyle('#22c55e')}>↓</div>
        <div style={resultStyle('#22c55e')}>✓ 배포 시점 차단</div>
      </div>
    </div>
  );
};

export default GatewayApiBenefits;
