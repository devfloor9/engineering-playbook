import { SlideWrapper, Card } from '@shared/components';
import { Database, Zap, HardDrive } from 'lucide-react';

export default function Slide15() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center text-purple-300">
        Data Layer
      </h2>
      <h3 className="text-3xl font-semibold mb-8 text-center text-gray-400">
        Milvus 벡터 DB + Redis 캐시
      </h3>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Database className="w-10 h-10 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-semibold mb-2 text-purple-300">역할: RAG 및 세션 데이터 저장</h3>
              <p className="text-lg text-gray-300">
                Milvus로 벡터 검색, Redis로 세션 캐시 및 에이전트 메모리 관리
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-5">
          <Card className="p-6">
            <Database className="w-9 h-9 text-cyan-400 mb-3" />
            <h4 className="text-xl font-semibold mb-3 text-cyan-300">Milvus (Vector Database)</h4>
            <ul className="text-base text-gray-400 space-y-2">
              <li>• 분산 아키텍처: Query/Index/Data Nodes</li>
              <li>• HNSW 인덱스: 고성능 벡터 검색</li>
              <li>• GPU 가속: Index Node GPU 활용</li>
              <li>• S3 통합: 영구 스토리지</li>
            </ul>
          </Card>

          <Card className="p-6">
            <Zap className="w-9 h-9 text-amber-400 mb-3" />
            <h4 className="text-xl font-semibold mb-3 text-amber-300">Redis (Cache &amp; Session)</h4>
            <ul className="text-base text-gray-400 space-y-2">
              <li>• 세션 메모리: Agent 대화 컨텍스트</li>
              <li>• 큐 관리: KEDA 스케일링 소스</li>
              <li>• Cluster Mode: 고가용성 및 확장</li>
              <li>• TTL 기반 데이터 관리</li>
            </ul>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5">
            <HardDrive className="w-8 h-8 text-blue-400 mb-2" />
            <h4 className="text-lg font-semibold mb-2 text-blue-300">컬렉션 설계</h4>
            <p className="text-sm text-gray-400">
              임베딩 필드 (FLOAT_VECTOR), 메타데이터 (JSON), 테넌트 ID
            </p>
          </Card>

          <Card className="p-5">
            <h4 className="text-lg font-semibold mb-2 text-emerald-300">Kubernetes 통합</h4>
            <p className="text-sm text-gray-400">
              Milvus Operator (CRD), StatefulSet 배포, PVC 관리
            </p>
          </Card>

          <Card className="p-5 bg-purple-900/20 border-purple-700">
            <h4 className="text-lg font-semibold mb-2 text-purple-300">확장 전략</h4>
            <p className="text-sm text-gray-400">
              Query/Index Nodes 독립 스케일링, 부하 분산
            </p>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
