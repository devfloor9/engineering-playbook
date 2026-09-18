import React, {useEffect, useId, useRef, useState} from 'react';
import Mermaid from '@theme-original/Mermaid';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Figure from '@site/src/components/Figure';
import Icon from '@site/src/components/Icon';
import {contextHeading} from '@site/src/components/DataTableFrame/accessibility';
import {mermaidMetadata} from './metadata';
import styles from './styles.module.css';

export default function MermaidViewer(props) {
  const {i18n} = useDocusaurusContext();
  const ko = i18n.currentLocale === 'ko';
  const id = useId();
  const preview = useRef(null);
  const dialog = useRef(null);
  const viewport = useRef(null);
  const trigger = useRef(null);
  const closeButton = useRef(null);
  const [context, setContext] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [width, setWidth] = useState(1000);
  const [zoom, setZoom] = useState(1);
  const metadata = mermaidMetadata(props.value);
  const title = metadata.title || (context ? `${context} — ${ko ? '다이어그램' : 'diagram'}` : ko ? '다이어그램' : 'Diagram');

  useEffect(() => {
    const node = preview.current;
    setContext(contextHeading(node));
    const measure = () => {
      const svg = node?.querySelector('svg');
      const naturalWidth = Number(svg?.getAttribute('viewBox')?.split(/[\s,]+/)[2]);
      if (Number.isFinite(naturalWidth) && naturalWidth > 0) setWidth(Math.min(16000, Math.max(100, naturalWidth)));
    };
    measure();
    const observer = new MutationObserver(measure);
    if (node) observer.observe(node, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, [props.value]);

  // Mermaid retains its own SVG title/description when supplied in the source.
  // Otherwise the surrounding section names both copies without inventing prose.
  useEffect(() => {
    const roots = [preview.current, viewport.current].filter(Boolean);
    const label = () => roots.forEach(root => root.querySelectorAll('svg').forEach(svg => {
      if (!metadata.title && !svg.querySelector('title')) svg.setAttribute('aria-label', title);
    }));
    label();
    const observer = new MutationObserver(label);
    roots.forEach(root => observer.observe(root, {childList: true, subtree: true}));
    return () => observer.disconnect();
  }, [title, metadata.title, expanded]);

  useEffect(() => {
    if (!expanded) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current.showModal();
    setZoom(Math.max(0.1, Math.min(1, (viewport.current.clientWidth - 32) / width)));
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      trigger.current?.focus();
    };
  }, [expanded]);

  return (
    <Figure title={title} description={metadata.description} className={styles.figure}>
      <div ref={preview} className={styles.preview} tabIndex={0} role="region" aria-label={title}>
        <Mermaid {...props} />
      </div>
      <div className={styles.actions}>
        <span>{ko ? '글씨가 작으면 확대해서 확인할 수 있습니다.' : 'Expand the diagram to read labels and follow connections.'}</span>
        <button ref={trigger} type="button" onClick={() => { setZoom(1); setExpanded(true); }}
          aria-label={ko ? `${title} 확대` : `Expand ${title}`}>
          <Icon name="expand" size={18} />{ko ? '다이어그램 확대' : 'Expand diagram'}
        </button>
      </div>
      {expanded && <dialog ref={dialog} data-ep-theme="manual" className={styles.dialog}
        aria-labelledby={`${id}-title`} aria-describedby={`${id}-hint`} onClose={() => setExpanded(false)}>
        <div className={styles.toolbar}>
          <h2 id={`${id}-title`}>{title}</h2>
          <div className={styles.controls} role="group" aria-label={ko ? '다이어그램 보기' : 'Diagram view'}>
            <button type="button" disabled={zoom <= 0.1} onClick={() => setZoom(value => Math.max(0.1, value - 0.25))}>
              <Icon name="minus" size={18} />{ko ? '축소' : 'Zoom out'}
            </button>
            <output aria-live="polite" aria-label={ko ? '확대 비율' : 'Zoom level'}>{Math.round(zoom * 100)}%</output>
            <button type="button" disabled={zoom >= 2} onClick={() => setZoom(value => Math.min(2, value + 0.25))}>
              <Icon name="plus" size={18} />{ko ? '확대' : 'Zoom in'}
            </button>
            <button type="button" onClick={() => setZoom(1)}><Icon name="refresh" size={18} />{ko ? '원래 크기' : 'Actual size'}</button>
            <button type="button" onClick={() => setZoom(Math.max(0.1, Math.min(1, (viewport.current.clientWidth - 32) / width)))}>
              <Icon name="expand" size={18} />{ko ? '화면에 맞춤' : 'Fit to screen'}
            </button>
            <button ref={closeButton} type="button" autoFocus onClick={() => dialog.current.close()}>
              <Icon name="x" size={18} />{ko ? '닫기' : 'Close'}
            </button>
          </div>
        </div>
        <p id={`${id}-hint`} className={styles.hint}>{ko ? '스크롤하여 그림을 이동할 수 있습니다. Esc 키로 닫습니다.' : 'Scroll to move around the diagram. Press Escape to close.'}</p>
        <div ref={viewport} className={styles.viewport} tabIndex={0} role="region"
          aria-label={ko ? `${title} 확대 보기` : `Expanded view: ${title}`}>
          <div className={styles.canvas} style={{width: `${width * zoom}px`}}><Mermaid {...props} /></div>
        </div>
      </dialog>}
    </Figure>
  );
}
