import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function AiDocs() {
  const {siteConfig, i18n} = useDocusaurusContext();
  const ko = i18n.currentLocale === 'ko';
  const root = siteConfig.customFields.documentationBaseUrl;
  const title = ko ? 'AI용 문서 사용 안내' : 'Using the AI documentation endpoints';
  return (
    <Layout title={title} description={ko ? '문서를 Markdown으로 읽고 AI 도구에 전달하는 방법' : 'Read and share the documentation as Markdown'}>
      <main className="container margin-vert--lg">
        <article className="markdown">
          <h1>{title}</h1>
          <p>{ko ? '문서 상단의 “문서 도구”에서 현재 페이지의 링크를 복사할 수 있습니다. Markdown이 제공되는 문서는 원문을 열거나 복사하여 AI 도구에 전달할 수 있습니다.' : 'Open “Document tools” below a page title to copy its link. When a Markdown version is available, you can open or copy it for an AI tool.'}</p>
          <h2>{ko ? '필요한 자료 선택' : 'Choose an endpoint'}</h2>
          <ul>
            <li><a href={`${root}llms.txt`}>llms.txt</a> — {ko ? '사이트 범위와 주요 문서 경로를 파악하는 시작점' : 'A starting point for the site scope and key documentation paths'}</li>
            <li><a href={`${root}llm-wiki/index.md`}>LLM Wiki index</a> — {ko ? '주제별 Markdown 문서 목록' : 'Markdown documents grouped by topic'}</li>
            <li><a href={`${root}llm-wiki/manifest.json`}>Document manifest</a> — {ko ? '문서 URL, Markdown URL, 태그, 수정일을 조회하는 목록' : 'A machine-readable list of page URLs, Markdown URLs, tags, and update dates'}</li>
          </ul>
          <h2>{ko ? '제공 범위' : 'Coverage'}</h2>
          <p>{ko ? '현재 LLM Wiki는 한국어 기술 문서를 제공합니다. 영어 페이지와 Industry Solutions처럼 내보내기 대상이 아닌 문서에는 Markdown 버튼이 표시되지 않습니다. 표나 대화형 컴포넌트의 시각적 정보가 필요한 경우 웹 문서도 함께 확인하세요.' : 'The LLM Wiki currently exports Korean technical documentation. English pages and excluded topics such as Industry Solutions do not show Markdown buttons. Use the web page alongside Markdown when you need visual tables or interactive components.'}</p>
          <p>{ko ? 'CoreDNS 메트릭과 MoE 가중치 표는 웹과 같은 원본 데이터에서 내보냅니다. 아직 변환하지 못하는 컴포넌트는 본문에 Export note로 표시하고 웹 문서로 연결합니다. manifest의 content_coverage에서 serialized_components와 omitted_components를 확인하여 누락 여부를 판단하세요.' : 'CoreDNS metrics and MoE weight tables are exported from the same data as the website. Components without a serializer have an inline Export note linking to the web page. Inspect serialized_components and omitted_components under content_coverage in the manifest before treating an export as complete.'}</p>
        </article>
      </main>
    </Layout>
  );
}
