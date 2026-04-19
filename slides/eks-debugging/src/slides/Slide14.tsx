import { SlideWrapper } from '../components/SlideWrapper';
import { CodeBlock } from '../components/CodeBlock';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';

export default function Slide14() {
  return (
    <SlideWrapper accent="blue">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        EC2 레벨 진단 명령어
      </motion.h2>
      <p className="text-lg text-gray-400 mb-6">SSM / Serial Console을 통한 노드 직접 디버깅</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CodeBlock title="SSM 접속 및 kubelet 디버깅" language="bash" delay={0.1}>
{`# SSM 접속
aws ssm start-session --target <instance-id>

# kubelet 상태 및 로그
systemctl status kubelet
journalctl -u kubelet -n 100 -f

# containerd 상태
systemctl status containerd

# 컨테이너 런타임 확인
crictl pods
crictl ps -a`}
        </CodeBlock>

        <CodeBlock title="리소스 및 네트워크 확인" language="bash" delay={0.2}>
{`# 디스크 사용량
df -h

# 메모리 사용량
free -m

# PID 개수
ps aux | wc -l

# 미사용 이미지 정리
crictl rmi --prune

# 노드 네트워크 확인
ip addr show
ip route show`}
        </CodeBlock>

        <CodeBlock title="EKS Log Collector (AWS Support용)" language="bash" delay={0.3}>
{`# 로그 수집 스크립트 다운로드 및 실행
curl -O https://raw.githubusercontent.com/\\
awslabs/amazon-eks-ami/master/\\
log-collector-script/linux/eks-log-collector.sh
sudo bash eks-log-collector.sh

# S3에 직접 업로드
sudo bash eks-log-collector.sh \\
  --upload s3://my-bucket/`}
        </CodeBlock>

        <CodeBlock title="kubectl debug (SSM 없이)" language="bash" delay={0.4}>
{`# 노드 디버깅 (호스트 /host에 마운트)
kubectl debug node/<node-name> \\
  -it --image=ubuntu

# 호스트 파일시스템 접근
chroot /host

# 네트워크 디버깅
kubectl debug node/<node-name> \\
  -it --image=nicolaka/netshoot`}
        </CodeBlock>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-4 flex items-center gap-3 justify-center"
      >
        <Badge color="blue">Tip</Badge>
        <span className="text-base text-gray-400">
          AWS Support case 제출 시 EKS Log Collector 결과를 첨부하면 해결 시간 단축
        </span>
      </motion.div>
    </SlideWrapper>
  );
}
