import React, {useEffect, useId, useRef, useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

export default function DataTableFrame({title, description, children, minWidth = '42rem'}) {
  const {i18n} = useDocusaurusContext();
  const titleId = useId();
  const hintId = useId();
  const scroller = useRef(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const node = scroller.current;
    const measure = () => setOverflow(node.scrollWidth > node.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    return () => observer.disconnect();
  }, []);
  return (
    <figure className={styles.frame} style={{'--table-min-width': minWidth}}>
      <figcaption id={titleId}>{title}</figcaption>
      {description && <p className={styles.description}>{description}</p>}
      {overflow && <p id={hintId} className={styles.hint}>
        {i18n.currentLocale === 'ko' ? '좌우로 스크롤하여 나머지 열을 확인할 수 있습니다.' : 'Scroll horizontally to see the remaining columns.'}
      </p>}
      <div ref={scroller} className={styles.scroller} role="region"
        tabIndex={overflow ? 0 : undefined} aria-labelledby={titleId}
        aria-describedby={overflow ? hintId : undefined}>
        {children}
      </div>
    </figure>
  );
}
