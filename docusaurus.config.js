// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Engineering Playbook',
  tagline: 'Cloud Native Architecture Engineering Playbook & Benchmark Reports',
  favicon: 'img/favicon.ico',

  // Enable Mermaid diagrams
  markdown: {
    mermaid: true,
  },
  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['ko', 'en'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        docsRouteBasePath: '/docs',
        indexBlog: false,
        searchBarShortcutHint: true,
        searchBarPosition: 'left',
      },
    ],
  ],

  // Set the production url of your site here
  url: 'https://devfloor9.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/engineering-playbook/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'devfloor9', // Usually your GitHub org/user name.
  projectName: 'engineering-playbook', // Usually your repo name.
  deploymentBranch: 'gh-pages', // The branch of your docs repo that you are publishing to GitHub pages
  trailingSlash: false, // GitHub Pages adds a trailing slash to Docusaurus URLs by default

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Leadfeeder(Dealfront) 트래커 — 방문 기업(B2B) 식별
  // 공식 인라인 스니펫(ldfdr 부트스트랩 포함)으로 설치해야 Leadfeeder 감지기가 인식한다.
  headTags: [
    {
      tagName: 'script',
      attributes: {
        type: 'text/javascript',
      },
      innerHTML:
        "(function(ss,ex){ window.ldfdr=window.ldfdr||function(){(ldfdr._q=ldfdr._q||[]).push([].slice.call(arguments));}; (function(d,s){ fs=d.getElementsByTagName(s)[0]; function ce(src){ var cs=d.createElement(s); cs.src=src; cs.async=1; fs.parentNode.insertBefore(cs,fs); }; ce('https://sc.lfeeder.com/lftracker_v1_'+ss+(ex?'_'+ex:'')+'.js'); })(document,'script'); })('kn9Eq4R2Yor4RlvP');",
    },
  ],

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang.
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'en'],
    localeConfigs: {
      ko: { label: '한국어' },
      en: { label: 'English' },
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/devfloor9/engineering-playbook/tree/main/',
          // 작성일·수정일·읽는 시간은 제목 아래 DocMeta(src/theme/DocMeta) 단일 라인으로 통일한다.
          // 페이지 하단 네이티브 last-updated 표시는 중복이므로 비활성화한다.
          showLastUpdateAuthor: false,
          showLastUpdateTime: false,
          breadcrumbs: true,
          // Configure sidebar routing
          routeBasePath: 'docs',
          path: 'docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        // Google Analytics 4 — 방문 지역/언어/브라우저/인기 페이지/체류시간 분석
        gtag: {
          trackingID: 'G-GGY1689V3E',
          anonymizeIP: true,
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
        },
      }),
    ],
  ],

  plugins: [
    // 문서별 OG 이미지 동적 생성 (postBuild) — 제목/카테고리 기반 1200x630 PNG
    './plugins/og-image-plugin.js',
    [
      '@docusaurus/plugin-ideal-image',
      {
        quality: 70,
        max: 1030,
        min: 640,
        steps: 2,
        disableInDev: false,
      },
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        // 추론 게이트웨이 개념 문서 4종을 model-serving/inference-routing 으로 이동(2026-06-25)
        redirects: [
          // GAMMA Initiative 문서를 service-mesh 카테고리로 이동 (2026-07)
          {
            from: '/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide/gamma-initiative',
            to: '/docs/eks-best-practices/networking-performance/service-mesh/gamma-initiative',
          },
          {
            from: '/docs/agentic-ai-platform/reference-architecture/inference-gateway/tiered-gateway-architecture',
            to: '/docs/agentic-ai-platform/model-serving/inference-routing/tiered-gateway-architecture',
          },
          {
            from: '/docs/agentic-ai-platform/reference-architecture/inference-gateway/routing-strategy',
            to: '/docs/agentic-ai-platform/model-serving/inference-routing/routing-strategy',
          },
          {
            from: '/docs/agentic-ai-platform/reference-architecture/inference-gateway/cascade-routing-tuning',
            to: '/docs/agentic-ai-platform/model-serving/inference-routing/cascade-routing-tuning',
          },
          {
            from: '/docs/agentic-ai-platform/reference-architecture/inference-gateway/openclaw-example',
            to: '/docs/agentic-ai-platform/model-serving/inference-routing/openclaw-example',
          },
          // Semantic Caching 전략 문서를 model-serving/inference-optimization 으로 이동(2026-07-04, #13)
          {
            from: '/docs/agentic-ai-platform/design-architecture/advanced-patterns/semantic-caching-strategy',
            to: '/docs/agentic-ai-platform/model-serving/inference-optimization/semantic-caching-strategy',
          },
          // 추론 인프라 개요 문서를 model-serving/index.md 로 병합(2026-07-15, #18)
          {
            from: '/docs/agentic-ai-platform/model-serving/inference-infrastructure-overview',
            to: '/docs/agentic-ai-platform/model-serving',
          },
        ],
      },
    ],
    // PWA plugin disabled — causes @theme/PwaReloadPopup resolution error
    // [
    //   '@docusaurus/plugin-pwa',
    //   {
    //     debug: false,
    //     offlineModeActivationStrategies: ['appInstalled', 'standalone', 'queryString'],
    //     pwaHead: [
    //       { tagName: 'link', rel: 'icon', href: '/engineering-playbook/img/logo.svg' },
    //       { tagName: 'link', rel: 'manifest', href: '/engineering-playbook/manifest.json' },
    //       { tagName: 'meta', name: 'theme-color', content: 'rgb(37, 194, 160)' },
    //     ],
    //   },
    // ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Mermaid theme for light/dark mode
      mermaid: {
        theme: {
          light: 'neutral',
          dark: 'dark',
        },
        options: {
          themeVariables: {
            darkMode: true,
            primaryColor: '#2C3038',
            primaryTextColor: '#ECEEF4',
            primaryBorderColor: '#9AA0AD',
            lineColor: '#9AA0AD',
            secondaryColor: '#22262D',
            tertiaryColor: '#1B1F25',
            noteBkgColor: '#22262D',
            noteTextColor: '#B4BAC8',
            fontFamily: 'Inter, sans-serif',
          },
        },
      },
      // Enable hideable sidebar for focus reading mode
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'Engineering Playbook',
        logo: {
          alt: 'Engineering Playbook Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'dropdown',
            label: 'Documentation',
            position: 'left',
            items: [
              { to: '/docs/intro', label: 'Getting Started' },
              { to: '/docs/eks-best-practices', label: 'EKS Best Practices' },
              { to: '/docs/agentic-ai-platform', label: 'Agentic AI Platform' },
              { to: '/docs/aidlc', label: 'AIDLC' },
              { to: '/docs/hybrid-infrastructure', label: 'Hybrid Infrastructure' },
              { to: '/docs/security-governance', label: 'Security & Governance' },
              { to: '/docs/rosa', label: 'ROSA' },
            ],
          },
          { to: '/docs/benchmarks', label: 'Benchmarks', position: 'left' },
          { to: '/slides', label: 'Slides', position: 'left' },
          {
            type: 'html',
            position: 'right',
            value: '<a href="https://github.com/devfloor9/engineering-playbook" target="_blank" rel="noopener noreferrer" class="header-star-button" aria-label="Star on GitHub"><svg viewBox="0 0 16 16" width="16" height="16" class="star-icon"><path fill="currentColor" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"></path></svg> Star</a>',
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
          {
            href: 'https://github.com/devfloor9/engineering-playbook',
            position: 'right',
            className: 'header-github-link',
            'aria-label': 'GitHub repository',
          },
        ],
      },
      footer: {
        style: 'light',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Getting Started',
                to: '/docs/intro',
              },
              {
                label: 'EKS Best Practices',
                to: '/docs/eks-best-practices',
              },
              {
                label: 'Agentic AI Platform',
                to: '/docs/agentic-ai-platform',
              },
              {
                label: 'AIDLC',
                to: '/docs/aidlc',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Hybrid Infrastructure',
                to: '/docs/hybrid-infrastructure',
              },
              {
                label: 'Security & Governance',
                to: '/docs/security-governance',
              },
              {
                label: 'ROSA',
                to: '/docs/rosa',
              },
              {
                label: 'Benchmarks',
                to: '/docs/benchmarks',
              },
              {
                label: 'Slides',
                to: '/slides',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/devfloor9/engineering-playbook',
              },
            ],
          },
          {
            title: 'For AI Agents',
            items: [
              {
                label: 'llms.txt',
                href: 'https://devfloor9.github.io/engineering-playbook/llms.txt',
              },
              {
                label: 'LLM Wiki (manifest.json)',
                href: 'https://devfloor9.github.io/engineering-playbook/llm-wiki/manifest.json',
              },
              {
                label: 'LLM Wiki (index.md)',
                href: 'https://devfloor9.github.io/engineering-playbook/llm-wiki/index.md',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Engineering Playbook.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'yaml', 'json', 'docker', 'hcl', 'python'],
      },
      metadata: [
        { name: 'keywords', content: 'Kubernetes, AWS, Cloud Native, DevOps, Architecture, Best Practices' },
        { name: 'description', content: 'Cloud Native Architecture & Best Practices - Engineering Playbook' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Engineering Playbook' },
      ],

    }),
};

export default config;
