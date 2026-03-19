import { SlideWrapper, Card } from '@shared/components';
import { Database, Network, Zap, FileText } from 'lucide-react';

export default function Slide15() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center text-purple-300">
        Data Layer
      </h2>
      <h3 className="text-3xl font-semibold mb-8 text-center text-gray-400">
        Knowledge Feature Store
      </h3>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Database className="w-10 h-10 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-semibold mb-2 text-purple-300">역할: LLM Feature Store + Ontology 확장</h3>
              <p className="text-lg text-gray-300">
                Vector RAG (유사도) + GraphRAG (관계 추론)로 환각 감소 및 사실 검증
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-5">
          <Card className="p-6">
            <Network className="w-9 h-9 text-cyan-400 mb-3" />
            <h4 className="text-xl font-semibold mb-3 text-cyan-300">Knowledge Graph</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• Neo4j/Neptune: 엔티티 관계 그래프</li>
              <li>• OWL/RDF: 온톨로지 스키마</li>
              <li>• 관계 기반 추론 (GraphRAG)</li>
              <li>• Fact-chain 검증</li>
            </ul>
          </Card>

          <Card className="p-6">
            <Database className="w-9 h-9 text-amber-400 mb-3" />
            <h4 className="text-xl font-semibold mb-3 text-amber-300">Vector Database (Milvus)</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• HNSW 인덱스: 고성능 벡터 검색</li>
              <li>• GPU 가속 Index Node</li>
              <li>• 분산 아키텍처 (Query/Index/Data Nodes)</li>
              <li>• S3 영구 스토리지</li>
            </ul>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5">
            <Zap className="w-8 h-8 text-emerald-400 mb-2" />
            <h4 className="text-lg font-semibold mb-2 text-emerald-300">Semantic Cache</h4>
            <p className="text-sm text-gray-300">
              Redis 기반 유사 쿼리 캐싱, TTL 관리
            </p>
          </Card>

          <Card className="p-5">
            <FileText className="w-8 h-8 text-blue-400 mb-2" />
            <h4 className="text-lg font-semibold mb-2 text-blue-300">문서 파이프라인</h4>
            <p className="text-sm text-gray-300">
              Unstructured.io: PDF/HTML/Docx 파싱 및 청크 분할
            </p>
          </Card>

          <Card color="purple" className="p-5">
            <h4 className="text-lg font-semibold mb-2 text-purple-300">Hybrid RAG</h4>
            <p className="text-sm text-gray-300">
              Vector + Graph 결합으로 정확도 향상
            </p>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
