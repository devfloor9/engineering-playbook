import React, {useEffect, useRef} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

function Item({heading, linkClassName, grouped, ko}) {
  const group = useRef(null);
  useEffect(() => {
    const node = group.current;
    if (!node) return undefined;
    const showActiveSection = () => {
      if (node.querySelector('.table-of-contents__link--active')) {
        node.open = true;
      }
    };
    showActiveSection();
    const observer = new MutationObserver(showActiveSection);
    observer.observe(node, {subtree: true, attributes: true, attributeFilter: ['class']});
    return () => observer.disconnect();
  }, []);

  const link = <Link to={`#${heading.id}`} className={linkClassName || undefined}
    dangerouslySetInnerHTML={{__html: heading.value}} />;
  const children = heading.children.length > 0 && (
    <Tree toc={heading.children} isChild linkClassName={linkClassName} />
  );
  return (
    <li>
      {grouped && children ? (
        <details ref={group} className={styles.group}>
          <summary>
            {link}
            <span className={styles.toggleLabel}>{ko ? '하위 섹션 펼치기' : 'Expand subsections'}</span>
          </summary>
          {children}
        </details>
      ) : <>{link}{children}</>}
    </li>
  );
}

function Tree({toc, className, linkClassName, isChild}) {
  const {i18n} = useDocusaurusContext();
  if (!toc.length) return null;
  const count = toc.reduce((total, heading) => total + 1 + heading.children.length, 0);
  const grouped = !isChild && count > 12;
  return (
    <ul className={isChild ? undefined : className}>
      {toc.map(heading => <Item key={heading.id} heading={heading}
        linkClassName={linkClassName} grouped={grouped} ko={i18n.currentLocale === 'ko'} />)}
    </ul>
  );
}

export default React.memo(Tree);
