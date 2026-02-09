// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Engineering Playbook',
  tagline: 'Cloud Native Architecture & Best Practices',
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
        searchBarPosition: 'right',
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

  //onBrokenLinks: 'throw',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'en'],
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
        debug: true,
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
          {
            type: 'localeDropdown',
            position: 'right',
          },
          {
            href: 'https://github.com/devfloor9/engineering-playbook',
            label: 'GitHub',
            position: 'right',
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
      /*
      // Algolia search configuration
      algolia: {
        appId: process.env.ALGOLIA_APP_ID || 'YOUR_APP_ID',
        apiKey: process.env.ALGOLIA_SEARCH_API_KEY || 'YOUR_SEARCH_API_KEY',
        indexName: process.env.ALGOLIA_INDEX_NAME || 'engineering-playbook',
        contextualSearch: true,
        searchParameters: {
          facetFilters: ['language:ko', 'language:en'],
          hitsPerPage: 10,
          attributesToRetrieve: [
            'hierarchy.lvl0',
            'hierarchy.lvl1', 
            'hierarchy.lvl2',
            'hierarchy.lvl3',
            'content',
            'type',
            'url'
          ],
          attributesToHighlight: [
            'hierarchy.lvl0',
            'hierarchy.lvl1',
            'hierarchy.lvl2', 
            'hierarchy.lvl3',
            'content'
          ],
          attributesToSnippet: ['content:10'],
          highlightPreTag: '<mark>',
          highlightPostTag: '</mark>',
        },
        searchPagePath: 'search',
        insights: true,
      },
      */
      metadata: [
        { name: 'keywords', content: 'Kubernetes, AWS, Cloud Native, DevOps, Architecture, Best Practices' },
        { name: 'description', content: 'Cloud Native Architecture & Best Practices - Engineering Playbook' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Engineering Playbook' },
      ],

    }),
};

export default config;
