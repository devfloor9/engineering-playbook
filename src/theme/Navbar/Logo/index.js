import React from 'react';
import Logo from '@theme/Logo';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

export default function NavbarLogo() {
  const {siteConfig} = useDocusaurusContext();
  return <Logo className={`navbar__brand ${styles.brand}`} imageClassName="navbar__logo"
    titleClassName={`navbar__title ${styles.title}`} aria-label={siteConfig.title} />;
}
