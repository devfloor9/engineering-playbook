import { SlideWrapper, Card } from '@shared/components';
import { Layers, Database } from 'lucide-react';

export default function Slide04() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        LangFuse 아키텍처
      </h2>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-8 h-8 text-purple-400" />
            <h3 className="text-xl font-bold text-white">애플리케이션</h3>
          </div>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• <strong>Web UI</strong>: Next.js 기반</li>
            <li>• <strong>API Server</strong>: tRPC</li>
            <li>• <strong>Worker</strong>: 백그라운드 처리</li>
          </ul>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-8 h-8 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">스토리지</h3>
          </div>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• <strong>PostgreSQL</strong>: 메타데이터</li>
            <li>• <strong>Redis</strong>: 캐시/큐</li>
            <li>• <strong>S3</strong>: Blob 저장소</li>
          </ul>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-cyan-400 rounded flex items-center justify-center text-gray-900 font-bold">
              AI
            </div>
            <h3 className="text-xl font-bold text-white">클라이언트</h3>
          </div>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• <strong>Agent 1..N</strong>: AI 앱</li>
            <li>• <strong>Python SDK</strong>: 통합</li>
            <li>• <strong>LangChain</strong>: 콜백</li>
          </ul>
        </Card>
      </div>

      <Card color="gray" className="p-6">
        <h3 className="text-2xl font-bold text-white mb-4">추적 데이터 구조</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-purple-500/30 rounded-lg p-4">
            <h4 className="text-lg font-bold text-purple-300 mb-2">Trace</h4>
            <p className="text-sm text-gray-300">전체 실행 단위 (요청 → 응답)</p>
          </div>
          <div className="bg-gray-800 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-lg font-bold text-blue-300 mb-2">Span</h4>
            <p className="text-sm text-gray-300">LLM 호출, 도구 실행 등</p>
          </div>
          <div className="bg-gray-800 border border-emerald-500/30 rounded-lg p-4">
            <h4 className="text-lg font-bold text-emerald-300 mb-2">Event</h4>
            <p className="text-sm text-gray-300">로그, 에러, 메트릭</p>
          </div>
        </div>
      </Card>
    </SlideWrapper>
  );
}
