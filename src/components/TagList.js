import React from 'react';
import Link from '@docusaurus/Link';
import {tagPageRoute} from './TagList/routes';

const TagList = ({tags, showCount = false}) => {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className="tag-list">
      {tags.map((tag, index) => (
        <Link
          key={index}
          to={tagPageRoute(tag)}
          className="tag-item"
        >
          #{tag}
          {showCount && (
            <span className="tag-count" style={{marginLeft: '0.25rem', opacity: 0.8}}>
              ({/* 태그 개수는 별도 로직으로 계산 */})
            </span>
          )}
        </Link>
      ))}
    </div>
  );
};

export default TagList;
