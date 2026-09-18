import React from 'react';
import DataTableFrame from '@site/src/components/DataTableFrame';

// Preserve authored alignment, IDs, children and explicit header associations.
function headers(nodes, section) {
  return React.Children.map(nodes, node => {
    if (!React.isValidElement(node)) return node;
    const area = ['thead', 'tbody', 'tfoot'].includes(node.type) ? node.type : section;
    if (node.type === 'tr') {
      let column = 0;
      return React.cloneElement(node, {}, React.Children.map(node.props.children, cell => {
        if (!React.isValidElement(cell) || !['td', 'th'].includes(cell.type)) return cell;
        const first = column++ === 0;
        const isHeader = cell.type === 'th' || (area === 'tbody' && first);
        return React.createElement(isHeader ? 'th' : 'td', {
          ...cell.props,
          key: cell.key ?? column,
          ...(isHeader ? {scope: cell.props.scope || (area === 'thead' ? 'col' : 'row')} : {}),
        });
      }));
    }
    if (typeof node.type === 'string' || node.type === React.Fragment) {
      return React.cloneElement(node, {}, headers(node.props.children, area));
    }
    return node;
  });
}

export default function MarkdownTable({children, ...props}) {
  return <DataTableFrame ariaLabel={props['aria-label']}>
    <table {...props}>{headers(children)}</table>
  </DataTableFrame>;
}
