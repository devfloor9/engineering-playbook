import React from 'react';

export function joinIds(...values) {
  return [...new Set(values.filter(Boolean).join(' ').split(/\s+/).filter(Boolean))].join(' ') || undefined;
}

// Never stringify React elements or execute opaque custom components.
export function nodeText(value) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') return String(value);
  if (Array.isArray(value)) return value.map(nodeText).join('');
  if (React.isValidElement(value)) return nodeText(value.props.children);
  return '';
}

export function contextHeading(node) {
  const root = node?.closest('article, main, .markdown') || node?.ownerDocument?.body;
  if (!root) return '';
  const preceding = [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .filter(heading => !node.contains(heading) && (heading.compareDocumentPosition(node) & 4));
  const heading = preceding[preceding.length - 1]?.cloneNode(true);
  heading?.querySelectorAll('a.hash-link, [aria-hidden="true"]').forEach(child => child.remove());
  return heading?.textContent?.trim() || '';
}
