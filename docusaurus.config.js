// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'EKS Engineering Playbook',
  tagline: 'Comprehensive EKS Architecture Deep Dive',
  favicon: 'img/favicon.ico',

  // Enable Mermaid diagrams
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

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
        blog: {
          showReadingTime: true,
          readingTime: ({ content, defaultReadingTime }) =>
            defaultReadingTime({ content, options: { wordsPerMinute: 300 } }),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/devfloor9/engineering-playbook/tree/main/',
          blogSidebarTitle: 'Recent Posts',
          blogSidebarCount: 10,
          blogTitle: 'EKS Engineering Blog',
          blogDescription: 'Latest insights and updates on EKS engineering practices',
          postsPerPage: 'ALL',
          feedOptions: {
            type: 'all',
            copyright: `Copyright © ${new Date().getFullYear()} EKS Engineering Playbook.`,
          },
        },
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
            href: '/img/logo.svg',
          },
          {
            tagName: 'link',
            rel: 'manifest',
            href: '/manifest.json',
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
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'EKS Engineering Playbook',
        logo: {
          alt: 'EKS Engineering Playbook Logo',
          src: 'img/logo.svg',
        },
        items: [
          { to: '/docs/intro', label: 'Documentation', position: 'left' },
          {
            type: 'dropdown',
            label: 'Domains',
            position: 'left',
            items: [
              {
                to: '/docs/performance-networking',
                label: 'Performance & Networking',
              },
              {
                to: '/docs/observability-monitoring',
                label: 'Observability & Monitoring',
              },
              {
                to: '/docs/genai-aiml',
                label: 'GenAI & AI/ML',
              },
              {
                to: '/docs/hybrid-multicloud',
                label: 'Hybrid & Multi-Cloud',
              },
              {
                to: '/docs/security-compliance',
                label: 'Security & Compliance',
              },
            ],
          },
          { to: '/blog', label: 'Blog', position: 'left' },
          {
            type: 'search',
            position: 'right',
          },
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
                label: 'Performance & Networking',
                to: '/docs/performance-networking',
              },
              {
                label: 'Observability & Monitoring',
                to: '/docs/observability-monitoring',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GenAI & AI/ML',
                to: '/docs/genai-aiml',
              },
              {
                label: 'Hybrid & Multi-Cloud',
                to: '/docs/hybrid-multicloud',
              },
              {
                label: 'Security & Compliance',
                to: '/docs/security-compliance',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/devfloor9/engineering-playbook',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} EKS Engineering Playbook.`,
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
        { name: 'keywords', content: 'EKS, Kubernetes, AWS, DevOps, Cloud, Architecture' },
        { name: 'description', content: 'Comprehensive EKS Architecture Deep Dive - Engineering Playbook' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'EKS Engineering Playbook' },
      ],

    }),
};

export default config;
