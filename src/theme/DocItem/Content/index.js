import React from 'react';
import clsx from 'clsx';
import Head from '@docusaurus/Head';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import DocMeta from '@theme/DocMeta';

// Docusaurus 기본 DocItem/Content를 eject한다.
// 변경점:
// 1. 제목(header) 바로 아래에 작성일·읽는 시간 메타 라인(DocMeta)을 삽입한다.
// 2. LLM Wiki(/llm-wiki/)에 포함된 문서는 <link rel="alternate" type="text/markdown">으로
//    클린 마크다운 원본 URL을 노출해 AI 에이전트/크롤러가 발견할 수 있게 한다.
// 나머지는 원본과 동일하게 유지한다.

const SITE_URL = 'https://devfloor9.github.io/engineering-playbook';
// scripts/generate-llm-wiki.js의 INCLUDED_DOMAINS와 동기화 (industry-solutions·sales 제외)
const LLM_WIKI_DOMAINS = [
  'eks-best-practices',
  'agentic-ai-platform',
  'aidlc',
  'hybrid-infrastructure',
  'security-governance',
  'rosa',
  'benchmarks',
];

// 문서의 소스 경로(@site/docs/...)에서 llm-wiki md URL을 도출한다.
// ko 원본(docs/)만 대상 — i18n 미러(@site/i18n/...)와 제외 도메인은 null.
function useLlmWikiMdUrl() {
  const {metadata} = useDoc();
  const source = metadata && metadata.source;
  if (!source || !source.startsWith('@site/docs/')) return null;
  const rel = source.slice('@site/docs/'.length);
  const domain = rel.includes('/') ? rel.split('/')[0] : null;
  const isRootDoc = domain === null;
  if (!isRootDoc && !LLM_WIKI_DOMAINS.includes(domain)) return null;
  return `${SITE_URL}/llm-wiki/${rel.replace(/\.mdx$/, '.md')}`;
}

/**
 Title can be declared inside md content or declared through
 front matter and added manually. To make both cases consistent,
 the added title is added under the same div.markdown block
 See https://github.com/facebook/docusaurus/pull/4882#issuecomment-853021120

 We render a "synthetic title" if:
 - user doesn't ask to hide it with front matter
 - the markdown content does not already contain a top-level h1 heading
*/
function useSyntheticTitle() {
  const {metadata, frontMatter, contentTitle} = useDoc();
  const shouldRender =
    !frontMatter.hide_title && typeof contentTitle === 'undefined';
  if (!shouldRender) {
    return null;
  }
  return metadata.title;
}
export default function DocItemContent({children}) {
  const syntheticTitle = useSyntheticTitle();
  const llmWikiMdUrl = useLlmWikiMdUrl();
  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
      {llmWikiMdUrl && (
        <Head>
          <link rel="alternate" type="text/markdown" href={llmWikiMdUrl} />
        </Head>
      )}
      {syntheticTitle && (
        <header>
          <Heading as="h1">{syntheticTitle}</Heading>
        </header>
      )}
      <DocMeta />
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
