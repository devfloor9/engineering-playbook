import React, {useEffect, useRef, useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useLocation} from '@docusaurus/router';
import Icon from '@site/src/components/Icon';
import styles from './styles.module.css';

export default function CopyButton(props) {
  const {pathname} = useLocation();
  const {i18n} = useDocusaurusContext();
  return <CopyControl key={`${i18n.currentLocale}:${pathname}`} {...props} />;
}

function CopyControl({text, getText, label, ariaLabel, icon}) {
  const {i18n} = useDocusaurusContext();
  const ko = i18n.currentLocale === 'ko';
  const [status, setStatus] = useState('idle');
  const operation = useRef(0);
  const pending = useRef(false);
  useEffect(() => {
    return () => { operation.current += 1; };
  }, []);
  useEffect(() => {
    if (status !== 'success' && status !== 'error') return undefined;
    const timer = window.setTimeout(() => setStatus('idle'), 3000);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function copy() {
    if (pending.current) return;
    pending.current = true;
    const currentOperation = ++operation.current;
    setStatus('pending');
    try {
      const value = getText ? await getText() : text;
      if (currentOperation !== operation.current) return;
      if (typeof value !== 'string' || typeof navigator.clipboard?.writeText !== 'function') {
        throw new Error('Clipboard is unavailable');
      }
      await navigator.clipboard.writeText(value);
      if (currentOperation === operation.current) setStatus('success');
    } catch {
      if (currentOperation === operation.current) setStatus('error');
    } finally {
      if (currentOperation === operation.current) pending.current = false;
    }
  }

  const message = {
    idle: '',
    pending: ko ? '복사 중…' : 'Copying…',
    success: ko ? '복사했습니다.' : 'Copied.',
    error: ko ? '복사하지 못했습니다. 다시 시도하세요.' : 'Copy failed. Please try again.',
  }[status];

  const statusIcon = {pending: 'clock', success: 'check', error: 'x-circle'}[status];
  return (
    <span className={styles.control} data-ep-theme="manual" data-state={status}>
      <button type="button" className={styles.button} onClick={copy}
        disabled={status === 'pending'} aria-label={ariaLabel} aria-busy={status === 'pending'}>
        {(statusIcon || icon) && <Icon name={statusIcon || icon} size={18} />}
        <span>{label || (ko ? '복사' : 'Copy')}</span>
      </button>
      <span role="status" aria-live="polite" aria-atomic="true" className={styles.status}>
        {message && `${label || (ko ? '복사' : 'Copy')}: ${message}`}
      </span>
    </span>
  );
}
