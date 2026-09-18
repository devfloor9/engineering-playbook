import React, {useEffect, useId, useState} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import CopyButton from '../CopyButton';
import Icon from '@site/src/components/Icon';
import {forgetManifest, loadManifest, loadMarkdownText, markdownUrlFromManifest} from './manifest';
import controlStyles from '../CopyButton/styles.module.css';
import styles from './styles.module.css';

export default function DocTools() {
  const {metadata} = useDoc();
  const {siteConfig, i18n} = useDocusaurusContext();
  // Remount all action state immediately on document or locale navigation.
  return <DocumentTools key={`${i18n.currentLocale}:${metadata.permalink}`}
    metadata={metadata} siteConfig={siteConfig} i18n={i18n} />;
}

function DocumentTools({metadata, siteConfig, i18n}) {
  const ko = i18n.currentLocale === 'ko';
  const root = siteConfig.customFields.documentationBaseUrl;
  const helpUrl = useBaseUrl('/ai-docs');
  const statusId = useId();
  const manifestUrl = `${root}llm-wiki/manifest.json`;
  const [markdown, setMarkdown] = useState({status: 'loading', url: null});
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setMarkdown({status: 'loading', url: null});
    loadManifest(manifestUrl).then(manifest => {
      const url = markdownUrlFromManifest(manifest, {
        locale: i18n.currentLocale, permalink: metadata.permalink, root, siteUrl: siteConfig.url,
      });
      if (!cancelled) setMarkdown({status: url ? 'supported' : 'unsupported', url});
    }).catch(() => {
      if (!cancelled) setMarkdown({status: 'error', url: null});
    });
    return () => { cancelled = true; };
  }, [metadata.permalink, i18n.currentLocale, root, siteConfig.url, manifestUrl, attempt]);

  const message = {
    loading: ko ? 'Markdown 지원 여부를 확인하고 있습니다.' : 'Checking Markdown availability.',
    supported: ko ? '이 문서의 Markdown을 사용할 수 있습니다.' : 'Markdown is available for this document.',
    unsupported: ko ? '이 문서는 Markdown 내보내기를 제공하지 않습니다.' : 'Markdown export is not available for this document.',
    error: ko ? 'Markdown 정보를 불러오지 못했습니다.' : 'Could not load Markdown information.',
  }[markdown.status];
  return (
    <section className={styles.tools} data-ep-theme="manual"
      aria-label={ko ? '문서 도구' : 'Document tools'}>
      <div className={styles.actions} role="group"
        aria-label={ko ? '문서 작업' : 'Document actions'} aria-describedby={statusId}>
        <CopyButton icon="link" label={ko ? '링크 복사' : 'Copy link'}
          getText={() => new URL(metadata.permalink, siteConfig.url).href + window.location.hash} />
        {markdown.status === 'supported' && <>
          <a data-ep-action="" className={controlStyles.button} href={markdown.url} target="_blank" rel="noopener noreferrer">
            <Icon name="file-text" size={18} />
            <span>{ko ? 'Markdown 보기' : 'View Markdown'}</span>
            <span className={styles.srOnly}>{ko ? ' (새 탭에서 열림)' : ' (opens in a new tab)'}</span>
          </a>
          <CopyButton icon="copy" label={ko ? 'Markdown 복사' : 'Copy Markdown'}
            getText={() => loadMarkdownText(markdown.url)} />
        </>}
        <Link data-ep-action="" className={controlStyles.button} to={helpUrl}>
          <Icon name="book-open" size={18} />
          <span>{ko ? 'AI용 문서 안내' : 'AI documentation guide'}</span>
        </Link>
      </div>
      <div className={styles.feedback} data-state={markdown.status}>
        <p id={statusId} role="status" aria-live="polite" aria-atomic="true" className={styles.status}>
          <Icon name={markdown.status === 'error' ? 'alert-triangle' : markdown.status === 'supported' ? 'check' : 'info'} size={16} />
          <span>{message}</span>
        </p>
        {markdown.status === 'error' && (
          <button type="button" className={controlStyles.button} onClick={() => {
            forgetManifest(manifestUrl);
            setMarkdown({status: 'loading', url: null});
            setAttempt(value => value + 1);
          }}>
            <Icon name="refresh" size={18} />
            <span>{ko ? '다시 시도' : 'Retry'}</span>
          </button>
        )}
      </div>
    </section>
  );
}
