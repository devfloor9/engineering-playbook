import React, {useEffect, useId, useRef, useState} from 'react';
import Mermaid from '@theme-original/Mermaid';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

export default function MermaidViewer(props) {
  const {i18n} = useDocusaurusContext();
  const ko = i18n.currentLocale === 'ko';
  const titleId = useId();
  const preview = useRef(null);
  const dialog = useRef(null);
  const viewport = useRef(null);
  const trigger = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [width, setWidth] = useState(1000);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const node = preview.current;
    const measure = () => {
      const svg = node?.querySelector('svg');
      const naturalWidth = Number(svg?.getAttribute('viewBox')?.split(/\s+/)[2]);
      if (Number.isFinite(naturalWidth) && naturalWidth > 0) {
        setWidth(Math.min(16000, Math.max(100, naturalWidth)));
      }
    };
    measure();
    const observer = new MutationObserver(measure);
    if (node) observer.observe(node, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, [props.value]);

  useEffect(() => {
    if (!expanded) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
      trigger.current?.focus();
    };
  }, [expanded]);

  function open() {
    setZoom(1);
    setExpanded(true);
  }

  return (
    <figure className={styles.figure}>
      <div ref={preview} className={styles.preview}><Mermaid {...props} /></div>
      <figcaption className={styles.caption}>
        <span>{ko ? '글씨가 작으면 확대해서 확인할 수 있습니다.' : 'Expand the diagram to read labels and follow connections.'}</span>
        <button ref={trigger} type="button" onClick={open}>{ko ? '다이어그램 확대' : 'Expand diagram'}</button>
      </figcaption>
      {expanded && (
        <dialog ref={dialog} className={styles.dialog} aria-labelledby={titleId}
          onClose={() => setExpanded(false)}>
          <div className={styles.toolbar}>
            <h2 id={titleId}>{ko ? '다이어그램' : 'Diagram'}</h2>
            <div className={styles.controls}>
              <button type="button" aria-label={ko ? '축소' : 'Zoom out'}
                disabled={zoom <= 0.1} onClick={() => setZoom(value => Math.max(0.1, value - 0.25))}>−</button>
              <output aria-live="polite">{Math.round(zoom * 100)}%</output>
              <button type="button" aria-label={ko ? '확대' : 'Zoom in'}
                disabled={zoom >= 2} onClick={() => setZoom(value => Math.min(2, value + 0.25))}>+</button>
              <button type="button" onClick={() => setZoom(1)}>{ko ? '원래 크기' : 'Actual size'}</button>
              <button type="button" onClick={() => setZoom(Math.min(1, (viewport.current.clientWidth - 32) / width))}>
                {ko ? '화면에 맞춤' : 'Fit to screen'}
              </button>
              <button type="button" autoFocus onClick={() => dialog.current.close()}>{ko ? '닫기' : 'Close'}</button>
            </div>
          </div>
          <p className={styles.hint}>{ko ? '스크롤하여 그림을 이동할 수 있습니다. Esc 키로 닫습니다.' : 'Scroll to move around the diagram. Press Escape to close.'}</p>
          <div ref={viewport} className={styles.viewport} tabIndex={0}
            role="region" aria-label={ko ? '확대된 다이어그램' : 'Expanded diagram'}>
            <div className={styles.canvas} style={{width: `${width * zoom}px`}}>
              <Mermaid {...props} />
            </div>
          </div>
        </dialog>
      )}
    </figure>
  );
}
