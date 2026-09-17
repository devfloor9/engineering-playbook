import React, {useEffect, useState} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import CopyButton from '../CopyButton';
import styles from './styles.module.css';

const manifests = new Map();

function loadManifest(url) {
  if (!manifests.has(url)) {
    manifests.set(url, fetch(url).then(response => {
      if (!response.ok) throw new Error('Markdown index is unavailable');
      return response.json();
    }).catch(error => {
      manifests.delete(url);
      throw error;
    }));
  }
  return manifests.get(url);
}

export default function DocTools() {
  const {metadata} = useDoc();
  const {siteConfig, i18n} = useDocusaurusContext();
  const ko = i18n.currentLocale === 'ko';
  const root = siteConfig.customFields.documentationBaseUrl;
  const helpUrl = useBaseUrl('/ai-docs');
  const [markdownUrl, setMarkdownUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setMarkdownUrl(null);
    loadManifest(`${root}llm-wiki/manifest.json`).then(manifest => {
      if (cancelled || manifest.language !== i18n.currentLocale || !Array.isArray(manifest.docs)) return;
      const entry = manifest.docs.find(doc => {
        try { return new URL(doc.url).pathname === metadata.permalink; }
        catch { return false; }
      });
      if (!entry?.md_url) return;
      const url = new URL(entry.md_url);
      if (url.origin !== new URL(siteConfig.url).origin || !url.pathname.startsWith(`${root}llm-wiki/`)) return;
      setMarkdownUrl(url.pathname);
    }).catch(() => {
      // Link sharing and the endpoint guide remain available without the index.
    });
    return () => { cancelled = true; };
  }, [metadata.permalink, i18n.currentLocale, root, siteConfig.url]);

  async function markdownText() {
    const response = await fetch(markdownUrl);
    if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
      throw new Error('Markdown source is unavailable');
    }
    return response.text();
  }

  return (
    <details className={styles.tools} key={metadata.permalink}>
      <summary>{ko ? '문서 도구' : 'Document tools'}</summary>
      <div className={styles.actions}>
        <CopyButton label={ko ? '링크 복사' : 'Copy link'}
          getText={() => new URL(metadata.permalink, siteConfig.url).href + window.location.hash} />
        {markdownUrl && <>
          <a href={markdownUrl} target="_blank" rel="noopener noreferrer">{ko ? 'Markdown 보기' : 'View Markdown'}</a>
          <CopyButton label={ko ? 'Markdown 복사' : 'Copy Markdown'} getText={markdownText} />
        </>}
        <Link to={helpUrl}>{ko ? 'AI용 문서 안내' : 'AI documentation guide'}</Link>
      </div>
    </details>
  );
}
