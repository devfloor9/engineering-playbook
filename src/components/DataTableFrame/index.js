import React, {createContext, useContext, useEffect, useId, useRef, useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {contextHeading, joinIds, nodeText} from './accessibility';
import styles from './styles.module.css';

// Nested BaseTable and Markdown tables share the enclosing frame's scroller.
const FrameContext = createContext(null);

export default function DataTableFrame({
  title, description, children, minWidth = '0', className = '',
  ariaLabel, scrollable = true,
  'aria-labelledby': labelledBy, 'aria-describedby': describedBy,
}) {
  const {i18n} = useDocusaurusContext();
  const parent = useContext(FrameContext);
  const id = useId();
  const scroller = useRef(null);
  const [overflow, setOverflow] = useState(false);
  const [context, setContext] = useState('');
  const titleId = title != null ? `${id}-title` : undefined;
  const descriptionIds = joinIds(describedBy, description != null && `${id}-description`);
  const nameIds = joinIds(labelledBy, titleId);
  let captionId;
  const headers = [];

  function associate(nodes) {
    return React.Children.map(nodes, child => {
      if (!React.isValidElement(child)) return child;
      if (child.type === 'th' && child.props.scope !== 'row') headers.push(nodeText(child));
      if (child.type === 'caption') {
        captionId = child.props.id || `${id}-caption`;
        return React.cloneElement(child, {id: captionId});
      }
      if (typeof child.type !== 'string' && child.type !== React.Fragment) return child;
      const content = associate(child.props.children);
      if (child.type !== 'table') return React.cloneElement(child, {}, content);
      return React.cloneElement(child, {
        'aria-labelledby': joinIds(child.props['aria-labelledby'], nameIds, parent?.nameIds),
        'aria-label': child.props['aria-label'] || (!captionId && !nameIds
          ? ariaLabel || context || headers.filter(Boolean).join(' · ') || undefined : undefined),
        'aria-describedby': joinIds(child.props['aria-describedby'], descriptionIds, parent?.descriptionIds),
      }, content);
    });
  }
  const content = associate(children);
  const name = ariaLabel || context || headers.filter(Boolean).join(' · ') ||
    (i18n.currentLocale === 'ko' ? '표' : 'Table');

  useEffect(() => {
    const node = scroller.current;
    if (!node) return undefined;
    setContext(contextHeading(node));
    const measure = () => setOverflow(scrollable && node.scrollWidth > node.clientWidth + 1);
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(node);
    for (const table of node.querySelectorAll('table')) observer?.observe(table);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [children, scrollable]);

  // Child components can render their own table. Fill in the outer metadata
  // without replacing authored captions, labels, IDs or cell associations.
  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    for (const table of node.querySelectorAll('table')) {
      const labels = joinIds(table.getAttribute('aria-labelledby'), nameIds);
      const descriptions = joinIds(table.getAttribute('aria-describedby'), descriptionIds);
      if (labels) table.setAttribute('aria-labelledby', labels);
      if (descriptions) table.setAttribute('aria-describedby', descriptions);
      if (!labels && !table.caption && !table.hasAttribute('aria-label')) table.setAttribute('aria-label', name);
    }
  }, [children, name, nameIds, descriptionIds]);

  if (parent) return <>
    {title != null && <div id={titleId} className={styles.caption}>{title}</div>}
    {description != null && <div id={`${id}-description`} className={styles.description}>{description}</div>}
    {content}
  </>;
  return (
    <FrameContext.Provider value={{nameIds, descriptionIds}}>
      <figure data-ep-theme="manual" className={`${styles.frame} ${className}`}
        style={{'--table-min-width': minWidth}} aria-labelledby={nameIds}>
        {title != null && <figcaption id={titleId} className={styles.caption}>{title}</figcaption>}
        {description != null && <div id={`${id}-description`} className={styles.description}>{description}</div>}
        {overflow && <p id={`${id}-hint`} className={styles.hint}>
          {i18n.currentLocale === 'ko'
            ? '좌우로 스크롤하여 나머지 열을 확인할 수 있습니다.'
            : 'Scroll horizontally to see the remaining columns.'}
        </p>}
        <div ref={scroller} className={scrollable ? styles.scroller : styles.content} role="region"
          tabIndex={overflow ? 0 : undefined}
          aria-labelledby={joinIds(nameIds, !nameIds && captionId)}
          aria-label={!nameIds && !captionId ? name : undefined}
          aria-describedby={joinIds(descriptionIds, overflow && `${id}-hint`)}>
          {content}
        </div>
      </figure>
    </FrameContext.Provider>
  );
}
