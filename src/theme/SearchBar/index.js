import React, {useEffect, useId, useRef, useState} from 'react';
import SearchBar from '@theme-original/SearchBar';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

export default function ResponsiveSearchBar(props) {
  const {i18n} = useDocusaurusContext();
  const ko = i18n.currentLocale === 'ko';
  const {pathname} = useLocation();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef(null);
  const panel = useRef(null);
  const trigger = useRef(null);
  const mobile = () => window.matchMedia('(max-width: 996px)').matches;

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const input = panel.current?.querySelector('input');
    input?.setAttribute('aria-label', ko ? '문서 검색' : 'Search docs');
    if (open && mobile()) input?.focus();
  }, [open, ko]);

  useEffect(() => {
    const shortcut = event => {
      if (mobile() && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
        panel.current?.querySelector('input')?.focus();
      }
    };
    const outside = event => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', shortcut);
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('keydown', shortcut);
      document.removeEventListener('pointerdown', outside);
    };
  }, []);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <div ref={root} className={styles.root} onKeyDownCapture={event => {
      if (open && mobile() && event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    }}>
      <button ref={trigger} type="button" className={styles.trigger}
        aria-label={ko ? '문서 검색 열기' : 'Open document search'}
        aria-controls={panelId} aria-expanded={open} onClick={() => setOpen(value => !value)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
          <path d="m16 16 5 5" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      <div ref={panel} id={panelId} className={`${styles.panel} ${open ? styles.open : ''}`}>
        <div className={styles.mobileHeading}>
          <strong>{ko ? '문서 검색' : 'Search docs'}</strong>
          <button type="button" onClick={close}>{ko ? '닫기' : 'Close'}</button>
        </div>
        <SearchBar {...props} />
      </div>
    </div>
  );
}
