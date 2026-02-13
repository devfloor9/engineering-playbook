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

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'en', 'zh'],
    localeConfigs: {
      ko: { label: '한국어' },
      en: { label: 'English' },
      zh: { label: '中文' },
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
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          breadcrumbs: true,
          // Configure sidebar routing
          routeBasePath: 'docs',
          path: 'docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
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
      '@docusaurus/plugin-pwa',
      {
        debug: false,
        offlineModeActivationStrategies: [
          'appInstalled',
          'standalone',
          'queryString',
        ],
        pwaHead: [
          {
            tagName: 'link',
            rel: 'icon',
            href: '/engineering-playbook/img/logo.svg',
          },
          {
            tagName: 'link',
            rel: 'manifest',
            href: '/engineering-playbook/manifest.json',
          },
          {
            tagName: 'meta',
            name: 'theme-color',
            content: 'rgb(37, 194, 160)',
          },
        ],
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
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
          { to: '/docs/intro', label: 'Documentation', position: 'left' },
          { to: '/docs/benchmarks', label: 'Benchmark Reports', position: 'left' },
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
                label: 'Infrastructure Optimization',
                to: '/docs/infrastructure-optimization',
              },
              {
                label: 'Operations & Observability',
                to: '/docs/operations-observability',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Agentic AI Platform',
                to: '/docs/agentic-ai-platform',
              },
              {
                label: 'Hybrid Infrastructure',
                to: '/docs/hybrid-infrastructure',
              },
              {
                label: 'Security & Governance',
                to: '/docs/security-governance',
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
