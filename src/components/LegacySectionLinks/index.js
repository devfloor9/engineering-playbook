import React, {useEffect} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {useHistory, useLocation} from '@docusaurus/router';

export default function LegacySectionLinks({sections, basePath}) {
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
      <summary>이전 섹션 링크로 찾기</summary>
      <p>기존에 공유한 섹션 링크는 해당 내용이 있는 문서로 연결됩니다.</p>
      <ul>
        {Object.entries(sections).map(([id, section]) => (
          <li key={id} id={id}>
            <Link to={`${baseUrl}/${section.path}#${encodeURIComponent(id)}`}>
              {section.title}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
