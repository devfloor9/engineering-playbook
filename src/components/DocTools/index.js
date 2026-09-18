import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import CopyButton from '../CopyButton';
import Icon from '@site/src/components/Icon';
import DocMeta from '@theme/DocMeta';
import {canonicalDocumentUrl} from './url';
import controlStyles from '../CopyButton/styles.module.css';
import styles from './styles.module.css';

export default function DocTools() {
  const {metadata} = useDoc();
  const {siteConfig, i18n} = useDocusaurusContext();
  const ko = i18n.currentLocale === 'ko';
  const helpUrl = useBaseUrl('/ai-docs');
  return (
    <section className={styles.tools} data-ep-theme="manual"
      aria-label={ko ? '문서 도구' : 'Document tools'}>
      <div className={styles.headerRow} role="group"
        aria-label={ko ? '문서 작업' : 'Document actions'}>
        <DocMeta />
        <div className={styles.actions}>
          <CopyButton icon="link" label={ko ? '링크 복사' : 'Copy link'}
            getText={() => canonicalDocumentUrl({
              permalink: metadata.permalink, siteUrl: siteConfig.url,
              trailingSlash: siteConfig.trailingSlash, hash: window.location.hash,
            })} />
          <Link data-ep-action="" className={controlStyles.button} to={helpUrl}>
            <Icon name="book-open" size={18} />
            <span>{ko ? 'AI용 문서 안내' : 'AI documentation guide'}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
