import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const DistributedTrainingStack = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const solutions = [
    {
      name: 'NeMo',
      icon: '🧠',
      role: isKo ? '학습 프레임워크' : isZh ? '训练框架' : 'Training Framework',
      features: isKo ? 'LLM/멀티모달 학습, 모델 병렬화, 최적화 기법' : isZh ? 'LLM/多模态训练、模型并行化、优化技术' : 'LLM/multimodal training, model parallelism, optimization techniques'
    },
    {
      name: 'Kubeflow',
      icon: '⚙️',
      role: isKo ? 'ML 오케스트레이션' : isZh ? 'ML 编排' : 'ML Orchestration',
      features: isKo ? '파이프라인 관리, 실험 추적, 하이퍼파라미터 튜닝' : isZh ? '流水线管理、实验跟踪、超参数调优' : 'Pipeline management, experiment tracking, hyperparameter tuning'
    }
  ];

  return (
    <div style={{
      maxWidth: '760px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '15px',
      lineHeight: '1.6'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #5fa509 0%, #76b900 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '🎓 분산 학습 스택' : isZh ? '🎓 分布式训练堆栈' : '🎓 Distributed Training Stack'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '대규모 모델 학습 및 파이프라인 관리' : isZh ? '大规模模型训练和流水线管理' : 'Large-scale model training and pipeline management'}
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '24px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {solutions.map((solution, index) => (
            <div
              key={index}
              style={{
                background: 'linear-gradient(135deg, #f7fef0 0%, #e8f8d8 100%)',
                padding: '28px',
                borderRadius: '12px',
                border: '3px solid #76b900',
                boxShadow: '0 6px 12px rgba(118, 185, 0, 0.2)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '40px' }}>{solution.icon}</span>
                <div style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#5fa509',
                  textAlign: 'center'
                }}>
                  {solution.name}
                </div>
              </div>

              <div style={{
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'inline-block',
                  fontSize: '13px',
                  padding: '8px 16px',
                  background: '#76b900',
                  color: 'white',
                  borderRadius: '20px',
                  fontWeight: '600'
                }}>
                  {solution.role}
                </div>
              </div>

              <div style={{
                fontSize: '14px',
                color: '#2c3e50',
                lineHeight: '1.6',
                textAlign: 'center'
              }}>
                {solution.features}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DistributedTrainingStack;
