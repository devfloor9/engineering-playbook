import { SlideWrapper, CodeBlock, Card } from '@shared/components';
import { Network, Server } from 'lucide-react';

export default function Slide16() {
  const mcpServerCode = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: eks-mcp-server
  namespace: mcp-servers
spec:
  replicas: 2
  template:
    spec:
      serviceAccountName: eks-mcp-server
      containers:
      - name: server
        image: eks-mcp-server:latest
        ports:
        - containerPort: 8080
        env:
        - name: CLUSTER_NAME
          value: "production-cluster"
        - name: AWS_REGION
          value: "ap-northeast-2"
---
apiVersion: v1
kind: Service
metadata:
  name: eks-mcp-server
spec:
  selector:
    app: eks-mcp-server
  ports:
  - port: 80
    targetPort: 8080`;

  const pythonCode = `import boto3

bedrock_agent = boto3.client('bedrock-agent')

# SRE 에이전트 생성
response = bedrock_agent.create_agent(
    agentName='sre-agent',
    foundationModel='anthropic.claude-sonnet-4-20250514',
    instruction='Kubernetes 클러스터 문제 해결 에이전트',
)

# MCP 도구 연결 (Action Group)
bedrock_agent.create_agent_action_group(
    agentId=response['agent']['agentId'],
    actionGroupName='eks-mcp-tools',
    actionGroupExecutor={'customControl': 'RETURN_CONTROL'},
    apiSchema={
        'payload': json.dumps({
            'paths': {
                '/pod-logs': {'post': {'description': 'Get pod logs'}},
                '/k8s-events': {'post': {'description': 'Get K8s events'}},
            }
        })
    }
)`;

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold mb-6 text-blue-400">MCP 통합</h2>
        <p className="text-xl text-gray-400 mb-6">EKS MCP 서버 및 SRE 에이전트 구축</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-5">
            <Network className="w-8 h-8 text-blue-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-blue-300">MCP 프로토콜</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• 에이전트와 도구 간 표준 통신</li>
              <li>• 도구 동적 검색</li>
              <li>• 컨텍스트 전달 표준화</li>
              <li>• 에이전트 간 통신</li>
            </ul>
          </Card>

          <Card className="p-5">
            <Server className="w-8 h-8 text-emerald-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-emerald-300">EKS MCP 서버</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Pod 로그 조회</li>
              <li>• Kubernetes 이벤트</li>
              <li>• CloudWatch 메트릭</li>
              <li>• 리소스 상태 확인</li>
            </ul>
          </Card>

          <Card className="p-5 bg-purple-900/20 border-purple-500/30">
            <h4 className="text-sm font-semibold mb-2 text-purple-300">AWS MCP 서버 에코시스템</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• <span className="text-blue-400">EKS:</span> Kubernetes 통합</li>
              <li>• <span className="text-emerald-400">S3:</span> 스토리지 관리</li>
              <li>• <span className="text-amber-400">DynamoDB:</span> 데이터베이스</li>
              <li>• <span className="text-purple-400">Lambda:</span> 서버리스 함수</li>
            </ul>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <CodeBlock
            code={mcpServerCode}
            language="yaml"
            title="EKS MCP 서버 배포"
          />
          <CodeBlock
            code={pythonCode}
            language="python"
            title="Bedrock SRE 에이전트 생성 (boto3)"
          />
        </div>

        <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
          <p className="text-sm text-blue-300">
            <span className="font-semibold">통합 포인트:</span> AgentCore는 EKS MCP 서버를 호출하여 Kubernetes 클러스터 관리 자동화
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
