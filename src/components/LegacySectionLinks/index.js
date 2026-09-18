import React, {useEffect} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {useHistory, useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function LegacySectionLinks({sections, basePath, sectionTitles}) {
  const {i18n} = useDocusaurusContext();
  const ko = i18n.currentLocale === 'ko';
  const history = useHistory();
  const {hash} = useLocation();
  const baseUrl = useBaseUrl(basePath);

  useEffect(() => {
    let id;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      return;
    }
    const section = Object.prototype.hasOwnProperty.call(sections, id) ? sections[id] : null;
    if (section) {
      history.replace(`${baseUrl}/${section.path}#${encodeURIComponent(id)}`);
    }
  }, [hash, sections, baseUrl, history]);

  return (
    <details>
      <summary>{ko ? '이전 섹션 링크로 찾기' : 'Find a previous section'}</summary>
      <p>{ko ? '기존에 공유한 섹션 링크는 해당 내용이 있는 문서로 연결됩니다.' : 'Previously shared section links open the chapter that contains the corresponding content.'}</p>
      <ul>
        {Object.entries(sections).map(([id, section]) => (
          <li key={id} id={id}>
            <Link to={`${baseUrl}/${section.path}#${encodeURIComponent(id)}`}>
              {sectionTitles?.[id] || section.title}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
