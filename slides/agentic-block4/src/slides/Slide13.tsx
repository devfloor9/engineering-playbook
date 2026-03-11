import { SlideWrapper, Card } from '@shared/components';
import { Package, Database, Tag } from 'lucide-react';

export default function Slide13() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        모델 레지스트리
      </h2>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-8 h-8 text-purple-400" />
            <h3 className="text-2xl font-bold text-white">MLflow Model Registry</h3>
          </div>
          <p className="text-gray-300 mb-4">
            중앙 집중식 모델 저장소로 버전 관리 및 거버넌스 제공
          </p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• 모델 버전 자동 관리</li>
            <li>• Stage 기반 라이프사이클</li>
            <li>• 메타데이터 및 태그 추적</li>
            <li>• 모델 승인 워크플로우</li>
          </ul>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-8 h-8 text-emerald-400" />
            <h3 className="text-2xl font-bold text-white">S3 아티팩트 저장소</h3>
          </div>
          <p className="text-gray-300 mb-4">
            모델 파일 및 실험 아티팩트를 S3에 버전별로 저장
          </p>
          <div className="space-y-2">
            <div className="bg-gray-800 border border-emerald-500/30 rounded p-2 text-sm">
              <div className="text-emerald-300 font-bold">모델 파일</div>
              <div className="text-xs text-gray-300 font-mono mt-1">
                s3://models/fraud-detection/v1/model.tar.gz
              </div>
            </div>
            <div className="bg-gray-800 border border-blue-500/30 rounded p-2 text-sm">
              <div className="text-blue-300 font-bold">메타데이터</div>
              <div className="text-xs text-gray-300 font-mono mt-1">
                accuracy: 0.95, precision: 0.93
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card color="gray" className="p-6">
        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <Tag className="w-8 h-8 text-amber-400" />
          모델 라이프사이클 Stage
        </h3>
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gray-800 border border-gray-500/30 rounded-lg p-3 text-center">
            <div className="text-2xl mb-2">🔬</div>
            <div className="text-sm font-bold text-gray-300">None</div>
            <div className="text-xs text-gray-300 mt-1">실험 단계</div>
          </div>
          <div className="bg-gray-800 border border-amber-500/30 rounded-lg p-3 text-center">
            <div className="text-2xl mb-2">🧪</div>
            <div className="text-sm font-bold text-amber-300">Staging</div>
            <div className="text-xs text-gray-300 mt-1">검증 중</div>
          </div>
          <div className="bg-gray-800 border border-emerald-500/30 rounded-lg p-3 text-center">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-sm font-bold text-emerald-300">Production</div>
            <div className="text-xs text-gray-300 mt-1">프로덕션</div>
          </div>
          <div className="bg-gray-800 border border-red-500/30 rounded-lg p-3 text-center">
            <div className="text-2xl mb-2">📦</div>
            <div className="text-sm font-bold text-red-300">Archived</div>
            <div className="text-xs text-gray-300 mt-1">아카이브</div>
          </div>
        </div>
      </Card>
    </SlideWrapper>
  );
}
