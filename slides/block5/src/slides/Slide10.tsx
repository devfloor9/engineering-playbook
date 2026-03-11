import { SlideWrapper, CodeBlock } from '@shared/components';

export default function Slide10() {
  const nodejsCode = `const express = require('express');
const app = express();
const server = app.listen(8080);

let isShuttingDown = false;

app.get('/ready', (req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({ status: 'shutting_down' });
  }
  res.status(200).json({ status: 'ready' });
});

// Graceful Shutdown 처리
function gracefulShutdown(signal) {
  console.log(\`\${signal} received, starting graceful shutdown\`);
  isShuttingDown = true;

  server.close(() => {
    console.log('HTTP server closed');
    // db.close();  // DB 연결 종료
    process.exit(0);
  });

  // Timeout: SIGKILL 전에 완료
  setTimeout(() => {
    console.error('Graceful shutdown timeout, forcing exit');
    process.exit(1);
  }, 50000); // terminationGracePeriodSeconds - preStop - 여유 5초
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));`;

  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-6 text-emerald-400">Graceful Shutdown 패턴</h2>
      <p className="text-xl text-gray-300 mb-4">
        Node.js/Express 애플리케이션의 Graceful Shutdown 구현 예시
      </p>
      <CodeBlock code={nodejsCode} language="javascript" title="server.js" />
      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
          <p className="font-semibold text-blue-400 mb-1">1. 상태 플래그</p>
          <p className="text-gray-400">isShuttingDown으로 종료 중 표시</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3">
          <p className="font-semibold text-emerald-400 mb-1">2. 새 요청 거부</p>
          <p className="text-gray-400">server.close()로 연결 중단</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3">
          <p className="font-semibold text-amber-400 mb-1">3. 타임아웃</p>
          <p className="text-gray-400">50초 후 강제 종료</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
