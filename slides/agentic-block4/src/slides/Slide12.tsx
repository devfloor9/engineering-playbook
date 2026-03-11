import { SlideWrapper, Card, CodeBlock } from '@shared/components';
import { Workflow } from 'lucide-react';

export default function Slide12() {
  const pipelineCode = `@dsl.pipeline(
    name="End-to-End ML Pipeline",
    description="Complete ML pipeline"
)
def ml_pipeline(
    s3_input_path: str,
    mlflow_tracking_uri: str,
    experiment_name: str,
    epochs: int = 10
):
    # 1. 데이터 준비
    data_prep_task = data_preparation(
        s3_input_path=s3_input_path
    )

    # 2. 피처 엔지니어링
    feature_eng_task = feature_engineering(
        input_dataset=data_prep_task.outputs["output_dataset"]
    )

    # 3. 모델 학습 (GPU)
    train_task = model_training(
        input_features=feature_eng_task.outputs["output_features"],
        mlflow_tracking_uri=mlflow_tracking_uri,
        epochs=epochs
    )
    train_task.set_gpu_limit(1)`;

  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
        Kubeflow Pipelines
      </h2>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Workflow className="w-8 h-8 text-cyan-400" />
            <h3 className="text-xl font-bold text-white">재사용 가능 컴포넌트</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• <strong>@dsl.component</strong> 데코레이터</li>
            <li>• 입력/출력 타입 명시 (Dataset, Model)</li>
            <li>• 컨테이너 이미지 지정</li>
            <li>• GPU 리소스 할당</li>
          </ul>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-emerald-400 rounded flex items-center justify-center text-gray-900 font-bold text-xl">
              ⚙️
            </div>
            <h3 className="text-xl font-bold text-white">Argo Workflows</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• DAG 기반 실행 엔진</li>
            <li>• 병렬 실행 지원</li>
            <li>• 재시도 및 에러 처리</li>
            <li>• 아티팩트 저장 (S3)</li>
          </ul>
        </Card>
      </div>

      <CodeBlock
        code={pipelineCode}
        language="python"
        title="ml_pipeline.py"
      />

      <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-blue-300 text-sm">
          <strong>장점</strong>: 파이프라인을 코드로 관리 → 버전 관리, 재현성, 협업 용이
        </p>
      </div>
    </SlideWrapper>
  );
}
