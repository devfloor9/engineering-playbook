import React from 'react';
import Figure from './Figure';
import Icon from './Icon';
import ManualTable from './ArchitectureTables/ManualTable';
import styles from './ThroughputChart.module.css';

const i18n = {
  en: {
    title: 'Inference Throughput', unit: 'tokens/sec', higherBetter: 'Higher is better',
    scoutLabel: 'Llama 4 Scout', maverickLabel: 'Llama 4 Maverick', best: 'Best',
    description: 'Inference throughput by model and instance. Both charts use a 0–5,000 tokens/sec scale. Best marks the highest value within each model.',
    dataTitle: 'Inference Throughput Data', model: 'Model', scenario: 'Scenario', status: 'Comparison', other: 'Other result',
  },
  ko: {
    title: '추론 처리량', unit: 'tokens/sec', higherBetter: '높을수록 좋음',
    scoutLabel: 'Llama 4 Scout', maverickLabel: 'Llama 4 Maverick', best: '최적',
    description: '모델과 인스턴스별 추론 처리량입니다. 두 차트의 눈금 범위는 0–5,000 tokens/sec입니다. 최적 표시는 각 모델의 최댓값을 의미합니다.',
    dataTitle: '추론 처리량 원본 데이터', model: '모델', scenario: '시나리오', status: '비교', other: '기타 결과',
  },
};
const scoutData = [
  { id: 'A', label: 'p5/H100', color: 'var(--ep-chart-1)', value: 4200 },
  { id: 'B', label: 'p4d/A100', color: 'var(--ep-chart-2)', value: 1800 },
  { id: 'C', label: 'g6e/L40S', color: 'var(--ep-chart-3)', value: 1400 },
  { id: 'D', label: 'trn2', color: 'var(--ep-chart-4)', value: 3500 },
  { id: 'E', label: 'inf2', color: 'var(--ep-chart-5)', value: 2800 },
];
const maverickData = [
  { id: 'A', label: 'p5/H100', color: 'var(--ep-chart-1)', value: 2800 },
  { id: 'D', label: 'trn2', color: 'var(--ep-chart-4)', value: 2200 },
];
const maxValue = 5000;

function Bar({value, color, label, scenarioId, isBest, bestLabel, unit, locale}) {
  return <div className={styles.row}>
    <div className={styles.label}>{scenarioId}: {label}</div>
    <div className={styles.value}>{value.toLocaleString(locale)} {unit}</div>
    <div className={styles.track} aria-hidden="true">
      <div className={styles.bar} style={{width: `${(value / maxValue) * 100}%`, backgroundColor: color}} />
    </div>
    {isBest && <div className={styles.status} data-status="success"><Icon name="check" size={16} /> {bestLabel}</div>}
  </div>;
}

export default function InferenceThroughputChart({locale = 'en'}) {
  const t = i18n[locale] || i18n.en;
  const numberLocale = locale === 'ko' ? 'ko-KR' : 'en-US';
  const highestScout = Math.max(...scoutData.map(s => s.value));
  const highestMaverick = Math.max(...maverickData.map(s => s.value));
  return <div data-ep-theme="manual" className={styles.root}>
    <Figure title={t.title} description={t.description}
      dataFallback={<ManualTable title={t.dataTitle}
        headers={[`${t.model} / ${t.scenario}`, t.unit, t.status]}
        rows={scoutData.map(s => [`${t.scoutLabel} — ${s.id}: ${s.label}`, s.value.toLocaleString(numberLocale), s.value === highestScout ? t.best : t.other])
          .concat(maverickData.map(s => [`${t.maverickLabel} — ${s.id}: ${s.label}`, s.value.toLocaleString(numberLocale), s.value === highestMaverick ? t.best : t.other]))}
        numericColumns={[1]} />}
    >
      <section className={styles.section} aria-label={t.scoutLabel}>
        <p className={styles.sectionTitle}>{t.scoutLabel}</p>
        <p className={styles.note}>{t.higherBetter}</p>
        {scoutData.map(s => <Bar key={`scout-${s.id}`} value={s.value} color={s.color} label={s.label} scenarioId={s.id}
          isBest={s.value === highestScout} bestLabel={t.best} unit={t.unit} locale={numberLocale} />)}
      </section>
      <section className={styles.section} aria-label={t.maverickLabel}>
        <p className={styles.sectionTitle}>{t.maverickLabel}</p>
        <p className={styles.note}>{t.higherBetter}</p>
        {maverickData.map(s => <Bar key={`maverick-${s.id}`} value={s.value} color={s.color} label={s.label} scenarioId={s.id}
          isBest={s.value === highestMaverick} bestLabel={t.best} unit={t.unit} locale={numberLocale} />)}
      </section>
    </Figure>
  </div>;
}
