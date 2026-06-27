import React from 'react';
import Head from '@docusaurus/Head';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import OriginalMetadata from '@theme-original/DocItem/Metadata';

// Docusaurus 기본 DocItem/Metadata를 감싸, 문서 페이지에 schema.org TechArticle JSON-LD를 주입한다.
//
// 주의: BreadcrumbList JSON-LD는 Docusaurus 테마(DocBreadcrumbs/StructuredData)가
// 이미 네이티브로 발행하므로 여기서 추가하지 않는다 (중복 방지).
export default function MetadataWrapper(props) {
  const {metadata, frontMatter, assets} = useDoc();
  const {siteConfig} = useDocusaurusContext();

  const siteUrl = siteConfig.url + siteConfig.baseUrl.replace(/\/$/, '');
  const pageUrl = siteConfig.url + metadata.permalink;

  // 날짜: frontmatter의 created / last_update.date 우선, 없으면 생략
  const datePublished = frontMatter.created || undefined;
  const dateModified =
    (frontMatter.last_update && frontMatter.last_update.date) ||
    frontMatter.created ||
    undefined;
  const authorName =
    (frontMatter.last_update && frontMatter.last_update.author) ||
    frontMatter.author ||
    'devfloor9';

  // 이미지: frontmatter image > 전역 소셜 카드
  const image = assets.image || frontMatter.image || `${siteUrl}/img/docusaurus-social-card.jpg`;

  const techArticle = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: metadata.title,
    description: metadata.description,
    inLanguage: siteConfig.i18n.defaultLocale,
    image,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.title,
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/img/logo.svg`,
      },
    },
  };
  if (datePublished) techArticle.datePublished = datePublished;
  if (dateModified) techArticle.dateModified = dateModified;

  // AEO(Answer Engine Optimization): frontmatter에 faq 배열을 선언한 문서만
  // FAQPage JSON-LD를 발행한다. 헤딩 자동 추출은 부정확한 마크업을 만들 수 있어
  // opt-in 방식으로 제한한다(구글 FAQ 가이드라인 준수).
  //   faq:
  //     - q: 질문
  //       a: 답변(평문)
  const faqItems = Array.isArray(frontMatter.faq) ? frontMatter.faq : [];
  const validFaq = faqItems.filter(
    (item) => item && typeof item.q === 'string' && typeof item.a === 'string'
  );
  const faqPage =
    validFaq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          inLanguage: siteConfig.i18n.defaultLocale,
          mainEntity: validFaq.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.a,
            },
          })),
        }
      : null;

  return (
    <>
      <OriginalMetadata {...props} />
      <Head>
        <script type="application/ld+json">{JSON.stringify(techArticle)}</script>
        {faqPage && (
          <script type="application/ld+json">{JSON.stringify(faqPage)}</script>
        )}
      </Head>
    </>
  );
}
