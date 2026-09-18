import React, {createContext, useContext} from 'react';
import {MDXProvider} from '@mdx-js/react';

export const TestContext = createContext(null);
export const useDoc = () => useContext(TestContext).doc;
export const useDocusaurusContext = () => useContext(TestContext).site;
export const useLocation = () => ({pathname: useContext(TestContext).doc.metadata.permalink});
export const useBaseUrl = url => {
  const {site} = useContext(TestContext);
  return `${site.siteConfig.customFields.documentationBaseUrl}${site.i18n.currentLocale === 'ko' ? '' : 'en/'}${url.replace(/^\//, '')}`;
};
export const useBrokenLinks = () => ({collectAnchor() {}});
export const Link = ({to, ...props}) => <a href={to} {...props} />;
export const Head = ({children}) => <>{children}</>;
export const Heading = ({as: Tag, id, ...props}) => <Tag id={Tag === 'h1' ? undefined : id} {...props} />;
export const ThemeClassNames = {docs: {docMarkdown: 'theme-doc-markdown'}};
const components = {h1: props => <Heading as="h1" {...props} />};
export const MDXContent = ({children}) => <MDXProvider components={components}>{children}</MDXProvider>;
