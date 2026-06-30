import React from 'react';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

// 문서 제목 아래에 "작성일 · 수정일 · 읽는 시간" 메타 라인을 렌더한다.
//
// - 데이터 출처: 각 문서의 frontmatter(created, last_update.date, reading_time). 컴포넌트는
//   로케일 공유이므로 ko/en/zh 콘텐츠 파일은 그대로 두고 라벨만 현재 로케일로 분기한다.
// - 수정일(last_update)은 작성일과 다를 때만 표시한다(동일 시 중복 노출 방지). 페이지 하단의
//   네이티브 last-updated 표시는 docusaurus.config.js에서 비활성화해 단일 메타 라인으로 통일한다.
// - scope:nav 문서(카테고리/index 네비게이션)는 메타 라인을 표시하지 않는다.

const LABELS = {
  ko: {
    published: (d) => `${d} 작성`,
    updated: (d) => `${d} 수정`,
    reading: (m) => `${m}분 읽기`,
  },
  en: {
    published: (d) => `Published ${d}`,
    updated: (d) => `Updated ${d}`,
    reading: (m) => `${m} min read`,
  },
  zh: {
    published: (d) => `${d} 发布`,
    updated: (d) => `${d} 更新`,
    reading: (m) => `${m} 分钟阅读`,
  },
};

// frontmatter의 created는 문자열("2026-02-05")이 기본이나, Date로 파싱된 경우도 방어한다.
function toDateStr(v) {
  if (!v) return '';
  if (v instanceof Date) {
    const z = (n) => String(n).padStart(2, '0');
    return `${v.getUTCFullYear()}-${z(v.getUTCMonth() + 1)}-${z(v.getUTCDate())}`;
  }
  return String(v).slice(0, 10);
}

export default function DocMeta() {
  const {frontMatter} = useDoc();
  const {
    i18n: {currentLocale},
  } = useDocusaurusContext();

  const tags = Array.isArray(frontMatter.tags) ? frontMatter.tags : [];
  if (tags.includes('scope:nav')) return null;

  const L = LABELS[currentLocale] || LABELS.ko;
  const created = toDateStr(frontMatter.created);
  const updated = toDateStr(frontMatter.last_update && frontMatter.last_update.date);
  const readingTime = frontMatter.reading_time;

  const items = [];
  if (created) items.push({icon: '📅', text: L.published(created)});
  // 수정일은 작성일과 실제로 다를 때만 표시한다(동일 날짜 중복 노출 방지).
  if (updated && updated !== created) items.push({icon: '🔄', text: L.updated(updated)});
  if (readingTime) items.push({icon: '⏱', text: L.reading(readingTime)});
  if (items.length === 0) return null;

  return (
    <div className={styles.docMeta}>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <span className={styles.divider} aria-hidden="true">
              ·
            </span>
          )}
          <span className={styles.item}>
            <span className={styles.icon} aria-hidden="true">
              {it.icon}
            </span>
            {it.text}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}
