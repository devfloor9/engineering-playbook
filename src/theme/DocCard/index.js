import React from 'react';
import {
  useDocById,
  findFirstSidebarItemLink,
} from '@docusaurus/plugin-content-docs/client';
import {usePluralForm} from '@docusaurus/theme-common';
import isInternalUrl from '@docusaurus/isInternalUrl';
import {translate} from '@docusaurus/Translate';
import {DocCardLink, resolveDocCardIcon} from '@site/src/components/DocCards';

function CardCategory({item}) {
  const href = findFirstSidebarItemLink(item);
  const {selectMessage} = usePluralForm();
  if (!href) return null;
  const count = item.items.length;
  const description = item.description ?? selectMessage(count, translate({
    id: 'theme.docs.DocCard.categoryDescription.plurals',
    message: '1 item|{count} items',
    description: 'The number of items in a generated category card',
  }, {count}));
  return <DocCardLink href={href} title={item.label} titleAs="h2"
    description={description} className={item.className}
    icon={resolveDocCardIcon(undefined, href, 'book-open')} />;
}

function CardLink({item}) {
  const doc = useDocById(item.docId ?? undefined);
  return <DocCardLink href={item.href} title={item.label} titleAs="h2"
    description={item.description ?? doc?.description} className={item.className}
    icon={isInternalUrl(item.href)
      ? resolveDocCardIcon(undefined, item.href)
      : 'external-link'} />;
}

export default function DocCard({item}) {
  switch (item.type) {
    case 'link': return <CardLink item={item} />;
    case 'category': return <CardCategory item={item} />;
    default: throw new Error(`Unknown DocCard item type: ${item.type}`);
  }
}
