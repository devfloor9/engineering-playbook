import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Check, X, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AutoModeStorage() {
  return (
    <SlideWrapper accent="orange">
      <Badge color="orange">Storage + Auto Mode</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-6">Auto Mode 스토리지 제약</h1>

      <div className="grid grid-cols-3 gap-5 mb-6">
        <Card title="내장 EBS 드라이버" icon={<Check size={22} />} accent="emerald" delay={0.1}>
          <p><span className="text-emerald-400 font-bold">gp3 기본 지원</span> — 별도 CSI Driver 설치 불필요</p>
          <p className="mt-2">WaitForFirstConsumer 자동 설정</p>
          <p className="text-gray-400 mt-1">allowVolumeExpansion: true</p>
        </Card>
        <Card title="gp3 기본, gp2 미지원" icon={<AlertTriangle size={22} />} accent="amber" delay={0.2}>
          <p>gp2 StorageClass 사용 불가</p>
          <p className="mt-2"><span className="text-amber-400 font-bold">io2 Block Express 미지원</span></p>
          <p className="text-gray-400 mt-1">기본 EBS 암호화 제공</p>
        </Card>
        <Card title="EFS 별도 설치" icon={<X size={22} />} accent="rose" delay={0.3}>
          <p>EFS CSI Driver는 <span className="text-rose-400 font-bold">자동 관리 대상이 아님</span></p>
          <p className="mt-2">ReadWriteMany 필요 시 수동 설치</p>
          <p className="text-gray-400 mt-1">FSx for Lustre도 별도 설치</p>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-900 rounded-xl p-6 border border-[#ff9900]/30"
      >
        <h3 className="text-xl font-bold text-[#ff9900] mb-4">Auto Mode 스토리지 지원 매트릭스</h3>
        <div className="grid grid-cols-4 gap-4 text-lg">
          {[
            { type: 'gp3', status: '내장 지원', ok: true },
            { type: 'gp2', status: '미지원', ok: false },
            { type: 'io2', status: '제한적', ok: false },
            { type: 'EFS', status: '별도 설치', ok: false },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.ok ? (
                <Check size={20} className="text-emerald-400" />
              ) : (
                <X size={20} className="text-rose-400" />
              )}
              <span className="text-gray-200 font-medium">{item.type}</span>
              <span className={`ml-auto ${item.ok ? 'text-emerald-400' : 'text-gray-500'}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </SlideWrapper>
  );
}
