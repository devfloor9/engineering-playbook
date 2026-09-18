import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Icon from '@site/src/components/Icon';
import CopyButton from '@site/src/components/CopyButton';
import styles from './ai-docs.module.css';

export default function AiDocs() {
  const {siteConfig, i18n} = useDocusaurusContext();
  const ko = i18n.currentLocale === 'ko';
  const root = siteConfig.customFields.documentationBaseUrl;
  const title = ko ? 'AI용 문서 안내' : 'Documentation for AI tools';
  const endpoints = [
    {file: 'llms.txt', icon: 'book-open', label: ko ? '먼저 살펴보기' : 'Start here',
      description: ko ? '사이트의 범위와 주요 문서 경로를 파악하는 간결한 색인입니다.' : 'A concise index of the site scope and key documentation paths.'},
    {file: 'llm-wiki/index.md', icon: 'file-text', label: ko ? '주제별 문서 찾기' : 'Browse by topic',
      description: ko ? '주제별 목록에서 필요한 문서의 Markdown을 선택할 수 있습니다.' : 'Find individual Markdown documents in a directory grouped by topic.'},
    {file: 'llm-wiki/manifest.json', icon: 'terminal', label: ko ? '도구에 연결하기' : 'Connect a tool',
      description: ko ? '문서·Markdown URL, 태그, 수정일과 내보내기 범위를 조회하는 구조화된 목록입니다.' : 'A structured catalog of page and Markdown URLs, tags, revision dates, and export coverage.'},
    {file: 'llms-full.txt', icon: 'layers', label: ko ? '전체 원문 읽기' : 'Read the combined source',
      description: ko ? '기술 문서의 원문을 하나로 모았습니다. MDX import와 JSX가 포함될 수 있습니다.' : 'Technical source documents combined into one file. It may include MDX imports and JSX.'},
  ];
  const steps = ko ? [
    ['문서 링크 복사', '문서 상단의 작성일·수정일·읽기시간 뒤에 있는 링크 복사 버튼을 사용하세요.'],
    ['필요한 Markdown 선택', '아래 주제별 문서 목록에서 필요한 Markdown을 찾아 해당 주소를 AI 도구에 전달하세요.'],
    ['원문과 함께 확인', '시각적 배치나 대화형 동작이 중요하면 웹 문서도 함께 확인하세요.'],
  ] : [
    ['Copy the page link', 'Use Copy link beside the publication date, revision date, and reading estimate.'],
    ['Choose the Markdown', 'Use Browse by topic below to find the Markdown document and share its URL with your AI tool.'],
    ['Keep the web page nearby', 'Refer to the web page when visual layout or interactive behavior matters.'],
  ];
  return (
    <Layout title={title} description={ko ? '문서를 Markdown으로 읽고 AI 도구에 전달하는 방법' : 'Read and share the documentation as Markdown'}>
      <main className={styles.page} data-ep-theme="manual">
        <header className={styles.hero}>
          <span className={styles.eyebrow}><Icon name="book-open" size={18} /> AI DOCUMENTATION</span>
          <h1>{title}</h1>
          <p>{ko ? '한 편의 문서를 공유하거나, 필요한 자료를 찾아 도구에 연결하세요. Engineering Playbook은 웹 문서와 함께 읽을 수 있는 Markdown과 문서 목록을 제공합니다.' : 'Share a page, find the material you need, or connect a tool. Engineering Playbook provides Markdown and document catalogs alongside the web manual.'}</p>
        </header>
        <ol className={styles.steps} aria-label={ko ? '사용 순서' : 'How to use it'}>
          {steps.map(([heading, description], index) => <li key={heading}>
            <span className={styles.number} aria-hidden="true">0{index + 1}</span>
            <h2>{heading}</h2><p>{description}</p>
          </li>)}
        </ol>
        <section aria-labelledby="endpoints-title">
          <div className={styles.sectionHeading}>
            <span className={styles.eyebrow}>THE ENDPOINTS</span>
            <h2 id="endpoints-title">{ko ? '목적에 맞는 자료를 선택하세요.' : 'Choose the material you need.'}</h2>
          </div>
          <div className={styles.endpoints}>
            {endpoints.map(endpoint => <article className={styles.endpoint} key={endpoint.file}>
              <span className={styles.endpointIcon}><Icon name={endpoint.icon} size={24} /></span>
              <h3>{endpoint.label}</h3>
              <code>{endpoint.file}</code>
              <p>{endpoint.description}</p>
              <div className={styles.actions}>
                <a href={`${root}${endpoint.file}`} className={styles.open}
                  aria-label={`${endpoint.file} — ${ko ? '열기' : 'Open'}`}>
                  {ko ? '열기' : 'Open'} <Icon name="arrow-right" size={18} />
                </a>
                <CopyButton icon="link" label={ko ? '주소 복사' : 'Copy URL'}
                  ariaLabel={`${endpoint.file} — ${ko ? '주소 복사' : 'Copy URL'}`}
                  getText={() => new URL(`${root}${endpoint.file}`, siteConfig.url).href} />
              </div>
            </article>)}
          </div>
        </section>
        <section className={styles.coverage} aria-labelledby="coverage-title">
          <Icon name="info" size={20} />
          <div>
            <h2 id="coverage-title">{ko ? '제공 범위와 읽는 방법' : 'Coverage and interpretation'}</h2>
            <p>{ko ? 'LLM Wiki는 한국어 기술 문서와 시작 안내를 제공합니다. 영어 페이지, Industry Solutions, sales 문서는 내보내기 대상에 포함되지 않습니다.' : 'The LLM Wiki exports Korean technical documents and the introduction. English pages, Industry Solutions, and sales documents are outside its scope.'}</p>
            <p>{ko ? '지원되는 표·그림·탐색 요소는 저장소의 원본 데이터에서 내보냅니다. 변환하지 못한 요소는 Export note와 웹 문서 링크로 표시합니다.' : 'Supported tables, figures, and navigation are exported from repository sources. Unsupported elements have an Export note and a link to the web page.'}</p>
            <p>{ko ? 'manifest의 ' : 'Inspect '}<code>content_coverage</code>{ko ? '에서 변환·누락 항목과 출처를 확인하세요. 대화형 제어와 애니메이션은 Markdown에 재현되지 않습니다.' : ' in the manifest for serialized elements, omissions, and source provenance. Interactive controls and animations are not reproduced in Markdown.'}</p>
          </div>
        </section>
      </main>
    </Layout>
  );
}
