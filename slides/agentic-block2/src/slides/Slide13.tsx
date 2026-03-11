import { SlideWrapper, Card } from '@shared/components';
import { Database, Server, Search, FileSearch } from 'lucide-react';

export default function Slide13() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold mb-6 text-cyan-400">Milvus 벡터 DB 아키텍처</h2>
        <p className="text-xl text-gray-400 mb-6">분산 구조로 대규모 벡터 검색 지원</p>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-5 bg-blue-900/20 border-blue-500/30">
            <Server className="w-8 h-8 text-blue-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-blue-300">Proxy</h4>
            <p className="text-xs text-gray-400">
              클라이언트 요청 수신 및 라우팅, 로드 밸런싱
            </p>
          </Card>

          <Card className="p-5 bg-emerald-900/20 border-emerald-500/30">
            <Search className="w-8 h-8 text-emerald-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-emerald-300">Query Node</h4>
            <p className="text-xs text-gray-400">
              벡터 검색 실행, 메모리에 인덱스 로드하여 검색 성능 최적화
            </p>
          </Card>

          <Card className="p-5 bg-purple-900/20 border-purple-500/30">
            <Database className="w-8 h-8 text-purple-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-purple-300">Data Node</h4>
            <p className="text-xs text-gray-400">
              데이터 저장 및 영구화, S3/MinIO로 스토리지 관리
            </p>
          </Card>

          <Card className="p-5 bg-amber-900/20 border-amber-500/30">
            <FileSearch className="w-8 h-8 text-amber-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-amber-300">Index Node</h4>
            <p className="text-xs text-gray-400">
              인덱스 빌드 (HNSW, IVF, SCANN), GPU 가속 지원
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-blue-300">Coordinator Layer</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <div>
                <span className="text-blue-400 font-semibold">Root Coordinator:</span> 메타데이터 관리, DDL 처리
              </div>
              <div>
                <span className="text-cyan-400 font-semibold">Query Coordinator:</span> Query Node 조정, 세그먼트 분배
              </div>
              <div>
                <span className="text-emerald-400 font-semibold">Data Coordinator:</span> Data Node 관리, 컴팩션
              </div>
              <div>
                <span className="text-amber-400 font-semibold">Index Coordinator:</span> Index Node 작업 스케줄링
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-purple-300">Storage Layer</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-800/50 rounded">
                <div className="text-sm font-semibold text-blue-400 mb-1">etcd</div>
                <div className="text-xs text-gray-400">메타데이터 저장 (스키마, 인덱스 정보)</div>
              </div>
              <div className="p-3 bg-gray-800/50 rounded">
                <div className="text-sm font-semibold text-emerald-400 mb-1">S3/MinIO</div>
                <div className="text-xs text-gray-400">벡터 데이터 및 인덱스 파일 영구 저장</div>
              </div>
              <div className="p-3 bg-gray-800/50 rounded">
                <div className="text-sm font-semibold text-amber-400 mb-1">Pulsar/Kafka</div>
                <div className="text-xs text-gray-400">메시지 큐, 데이터 스트림 처리</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-4 p-4 bg-cyan-900/20 rounded-lg border border-cyan-500/30">
          <p className="text-sm text-cyan-300">
            <span className="font-semibold">분산 아키텍처:</span> 각 레이어를 독립적으로 스케일하여 대규모 벡터 검색을 효율적으로 처리
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
