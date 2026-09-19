import React from 'react';
import {scenarios} from './CniBenchmarkData';
import styles from './ThroughputChart.module.css';

export default function CniMetricPanel({title, metric, unit, maximum, digits = 2, note}) {
  return (
    <section className={styles.section} aria-label={title}>
      <p className={styles.sectionTitle}>{title}</p>
      <p className={styles.note}>0–{maximum} {unit}</p>
      {scenarios.map(scenario => (
        <div className={styles.row} key={scenario.id}>
          <div className={styles.label}>{scenario.id}: {scenario.label}</div>
          <div className={styles.value}>{scenario[metric].toFixed(digits)} {unit}</div>
          <div className={styles.track} aria-hidden="true">
            <div className={styles.bar}
              style={{width: `${scenario[metric] / maximum * 100}%`, backgroundColor: scenario.color}} />
          </div>
        </div>
      ))}
      {note && <p className={styles.note}>{note}</p>}
    </section>
  );
}
