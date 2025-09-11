// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'EKS Engineering Playbook',
  tagline: 'Comprehensive EKS Architecture Deep Dive',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://devfloor9.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/engineering-playbook/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'devfloor9', // Usually your GitHub org/user name.
  projectName: 'engineering-playbook', // Usually your repo name.

  onBrokenLinks: 'throw',
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
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/devfloor9/engineering-playbook/tree/main/',
          blogSidebarTitle: 'All posts',
          blogSidebarCount: 'ALL',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
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
          {
            to: '/docs/performance-networking',
            label: 'Performance & Networking',
            position: 'left',
          },
          {
            to: '/docs/observability-monitoring',
            label: 'Observability',
            position: 'left',
          },
          {
            to: '/docs/genai-aiml',
            label: 'GenAI & AI/ML',
            position: 'left',
          },
          {
            to: '/docs/hybrid-multicloud',
            label: 'Hybrid & Multi-Cloud',
            position: 'left',
          },
          {
            to: '/docs/security-compliance',
            label: 'Security',
            position: 'left',
          },
          {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/devfloor9/engineering-playbook',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Technical Domains',
            items: [
              {
                label: 'Performance & Networking',
                to: '/docs/performance-networking',
              },
              {
                label: 'Observability & Monitoring',
                to: '/docs/observability-monitoring',
              },
              {
                label: 'GenAI & AI/ML',
                to: '/docs/genai-aiml',
              },
            ],
          },
          {
            title: 'More Domains',
            items: [
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
        copyright: `Copyright © ${new Date().getFullYear()} EKS Engineering Playbook. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'yaml', 'json'],
      },
    }),
};

export default config;