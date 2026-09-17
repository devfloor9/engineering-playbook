import React, {useEffect, useRef, useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

export default function CopyButton({text, getText, label, ariaLabel}) {
  const {i18n} = useDocusaurusContext();
  const ko = i18n.currentLocale === 'ko';
  const [status, setStatus] = useState('idle');
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (status !== 'success' && status !== 'error') return undefined;
    const timer = window.setTimeout(() => setStatus('idle'), 3000);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function copy() {
    setStatus('pending');
    try {
      const value = getText ? await getText() : text;
      if (typeof value !== 'string' || !navigator.clipboard) {
        throw new Error('Clipboard is unavailable');
      }
      await navigator.clipboard.writeText(value);
      if (mounted.current) setStatus('success');
    } catch {
      if (mounted.current) setStatus('error');
    }
  }

  const message = {
    idle: '',
    pending: ko ? '복사 중…' : 'Copying…',
    success: ko ? '복사했습니다.' : 'Copied.',
    error: ko ? '복사하지 못했습니다. 다시 시도하세요.' : 'Copy failed. Please try again.',
  }[status];

  return (
    <span className={styles.control}>
      <button type="button" className={styles.button} onClick={copy}
        disabled={status === 'pending'} aria-label={ariaLabel}>
        {label || (ko ? '복사' : 'Copy')}
      </button>
      <span role="status" className={styles.status}>{message}</span>
    </span>
  );
}
