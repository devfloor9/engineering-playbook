# Engineering Playbook

> 클라우드 네이티브 아키텍처 엔지니어링 플레이북 & 벤치마크 리포트 — Battle-tested engineering know-how from production environments

[![Deploy](https://github.com/devfloor9/engineering-playbook/actions/workflows/deploy.yml/badge.svg)](https://github.com/devfloor9/engineering-playbook/actions/workflows/deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://devfloor9.github.io/engineering-playbook/)

## About

**Engineering Playbook**은 프로덕션 환경에서 축적한 클라우드 네이티브 아키텍처 엔지니어링 노하우를 체계적으로 정리한 기술 문서 모음입니다. Amazon EKS 인프라 최적화, Agentic AI 플랫폼 엔지니어링, AIDLC/AgenticOps 방법론, 그리고 정량적 벤치마크 결과를 포함합니다.

각 기술 도메인은 구현 가이드와 측정 가능한 성능 데이터를 함께 제공하여 데이터 기반 아키텍처 의사결정을 지원합니다.

**Live Documentation**: [https://devfloor9.github.io/engineering-playbook/](https://devfloor9.github.io/engineering-playbook/)

## What's Inside

### Agentic AI Platform

EKS 기반 엔터프라이즈 Agentic AI 플랫폼 구축을 위한 End-to-End 가이드.

- **설계 아키텍처**: 기술적 도전과제, EKS 기반 해결방안, 플랫폼 아키텍처
- **모델 서빙**: EKS GPU 노드 전략 (Auto Mode/Karpenter/MNG/DRA), GPU 리소스 관리, vLLM, llm-d 분산 추론, MoE 모델 서빙, NVIDIA GPU 스택 (Dynamo/GPU Operator/DCGM), NeMo Framework
- **Gateway & Agent**: LLM Gateway 2-Tier 아키텍처 (kgateway + agentgateway + Bifrost), Inference Gateway 라우팅, OpenClaw AI Gateway
- **운영 & MLOps**: Agent 모니터링, RAGAS 평가, LLMOps Observability, MLOps 파이프라인, SageMaker-EKS 통합

### EKS Best Practices

Amazon EKS 인프라 최적화를 위한 실전 가이드.

- **네트워킹**: Cilium ENI, Gateway API 마이그레이션, CoreDNS 튜닝, East-West 트래픽 최적화
- **컨트롤 플레인**: 대규모 클러스터 스케일링 전략
- **리소스 & 비용**: Karpenter 오토스케일링, 비용 최적화
- **운영 & 안정성**: GitOps (Argo CD), 노드 모니터링, EKS 디버깅 & 레질리언스
- **보안 & 인증**: Pod Identity, IRSA 전략

### AIDLC & AgenticOps

AI 개발 라이프사이클 프레임워크와 Agentic AI 운영 피드백 루프.

- **AIDLC 프레임워크**: 신뢰성 듀얼 축 (온톨로지 x 하네스) 기반 AI 개발 생명주기
- **AgenticOps**: OpenTelemetry 관측성, CloudWatch AI 통합, DevOps Guru 예측 운영

### Hybrid Infrastructure

온프레미스 GPU 인프라와 클라우드 네이티브 플랫폼 통합.

- EKS Hybrid Nodes 도입 가이드
- SR-IOV with DGX H200
- 파일 스토리지 전략
- Harbor 레지스트리 통합

### Security & Governance

엔터프라이즈 보안 거버넌스.

- Identity-First Security (EKS Pod Identity)
- GuardDuty Extended Threat Detection
- Kyverno 정책 관리
- Supply Chain Security

### Benchmark Reports

인프라, AI/ML, 하이브리드 환경의 정량적 벤치마크.

- CNI 성능 비교 (VPC CNI vs Cilium)
- Gateway API 구현체 벤치마크
- AI/ML 워크로드 분석
- Dynamo 추론 벤치마크
- AgentCore vs EKS 자체 추론 비교
- 보안 운영 메트릭

### ROSA

Red Hat OpenShift on AWS 설치, 보안, 컴플라이언스 가이드.

## Tech Stack

| 영역 | 기술 |
|---|---|
| **컨테이너 오케스트레이션** | Amazon EKS, EKS Auto Mode, Karpenter, MNG + DRA |
| **네트워킹** | Cilium, Gateway API, CoreDNS, kgateway |
| **AI/ML 서빙** | vLLM, llm-d, NVIDIA Dynamo, NeMo Framework, Amazon Bedrock AgentCore |
| **AI Gateway** | kgateway + agentgateway, Bifrost, OpenClaw |
| **GPU 관리** | NVIDIA GPU Operator, DCGM, DRA, MIG, KAI Scheduler |
| **MLOps** | Kubeflow, MLflow, KServe, SageMaker |
| **벡터 DB** | Milvus |
| **관측성** | Prometheus, Grafana, Langfuse, Hubble, OpenTelemetry |
| **GitOps** | Argo CD |
| **보안** | Kyverno, GuardDuty, EKS Pod Identity |
| **AI Agent** | Kagent, MCP (Model Context Protocol) |
| **평가** | RAGAS |

## Documentation Structure

```
docs/
├── agentic-ai-platform/           # Agentic AI 플랫폼
│   ├── design-architecture/        #   설계 아키텍처
│   ├── model-serving/              #   모델 서빙 (GPU 노드 전략, vLLM, llm-d, MoE, NeMo)
│   ├── gateway-agents/             #   Gateway & Agent (LLM Gateway, Inference GW, OpenClaw)
│   └── operations-mlops/           #   운영 & MLOps (모니터링, RAGAS, LLMOps)
├── eks-best-practices/             # EKS Best Practices
│   ├── networking-performance/     #   네트워킹 (Cilium, Gateway API, CoreDNS)
│   ├── control-plane-scaling/      #   컨트롤 플레인 스케일링
│   ├── resource-cost/              #   리소스 & 비용 최적화
│   ├── operations-reliability/     #   운영 & 안정성
│   └── security-authn/             #   보안 & 인증
├── aidlc/                          # AIDLC 프레임워크
│   └── agentic-ops/                #   AgenticOps
├── hybrid-infrastructure/          # 하이브리드 인프라
├── security-governance/            # 보안 & 거버넌스
├── benchmarks/                     # 벤치마크 리포트
└── rosa/                           # ROSA (OpenShift on AWS)
```

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Production build
npm run build
```

> Requires Node.js >=20.0 and Docusaurus 3.9.2

## Contributing

Issues, PRs, and feedback are all welcome. See [GitHub Issues](https://github.com/devfloor9/engineering-playbook/issues) for details.

## License

Content in this project is available under the [MIT License](LICENSE).
