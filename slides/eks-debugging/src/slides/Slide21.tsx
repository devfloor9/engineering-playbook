import { SlideWrapper } from '../components/SlideWrapper';
import { CompareTable } from '../components/CompareTable';
import { motion } from 'framer-motion';

export default function Slide21() {
  return (
    <SlideWrapper accent="amber">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        ConfigMap / Secret 변경 미반영
      </motion.h2>
      <p className="text-lg text-gray-400 mb-6">마운트 방식에 따라 자동 업데이트 여부가 다릅니다</p>

      <CompareTable
        headers={['마운트 방식', '자동 업데이트', '반영 시간', '비고']}
        rows={[
          ['volumeMount (일반)', '자동 업데이트', '1-2분 (kubelet sync)', '권장 방식'],
          ['volumeMount + subPath', '업데이트 안 됨', 'N/A', 'Pod 재시작 필수'],
          ['envFrom / env', '업데이트 안 됨', 'N/A', 'Pod 재시작 필수'],
        ]}
        highlightCol={1}
        delay={0.1}
      />

      {/* 1-2분 소요 원리 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-5 bg-gray-900 rounded-xl p-5 border border-blue-500/20"
      >
        <p className="text-lg font-bold text-blue-400 mb-3">왜 1-2분이 걸리는가?</p>
        <div className="flex items-center gap-2 text-sm font-mono">
          <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-lg">ConfigMap 변경</span>
          <span className="text-gray-500">→</span>
          <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-lg">캐시 TTL 만료 (~60s)</span>
          <span className="text-gray-500">→</span>
          <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-lg">kubelet sync (~60s)</span>
          <span className="text-gray-500">→</span>
          <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-lg">symlink 교체</span>
        </div>
        <p className="text-sm text-gray-400 mt-3">
          kubelet <code className="text-blue-300">syncFrequency</code> (기본 60초) + ConfigMap <code className="text-blue-300">캐시 TTL</code> (기본 60초) = 최대 ~2분 지연
        </p>
        <p className="text-sm text-gray-500 mt-1">
          빠르게 하려면: <code className="text-emerald-300">Watch</code> 전략 사용 (TTL 대기 없음) 또는 앱에서 <code className="text-emerald-300">inotify</code>로 파일 변경 감지
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-6 mt-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900 rounded-xl p-5 border border-rose-500/20"
        >
          <p className="text-lg font-bold text-rose-400 mb-3">subPath 사용 시 주의</p>
          <pre className="text-sm text-emerald-300 font-mono bg-gray-950 p-3 rounded-lg overflow-x-auto">
{`# 자동 업데이트 불가
volumeMounts:
  - name: config
    mountPath: /etc/app/config.yaml
    subPath: config.yaml  # 문제!`}
          </pre>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900 rounded-xl p-5 border border-emerald-500/20"
        >
          <p className="text-lg font-bold text-emerald-400 mb-3">권장: 디렉토리 마운트</p>
          <pre className="text-sm text-emerald-300 font-mono bg-gray-950 p-3 rounded-lg overflow-x-auto">
{`# 자동 업데이트 가능 (symlink 교체)
volumeMounts:
  - name: config
    mountPath: /etc/app  # 디렉토리`}
          </pre>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 bg-gray-900 rounded-xl p-4 border border-amber-500/20 text-center"
      >
        <p className="text-base text-amber-400 font-semibold">
          Reloader (stakater/reloader) 사용 시 ConfigMap/Secret 변경 감지 후 자동 rollout restart
        </p>
      </motion.div>
    </SlideWrapper>
  );
}
