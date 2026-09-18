import React from 'react';
import DataTableFrame from '../DataTableFrame';
import Icon from '../Icon';
import styles from './manual.module.css';

// Authored cells remain plain text or React nodes. The bounded exporter can
// evaluate these finite branches without interpreting Markdown or browser state.
export function ManualCell({value}) {
  if (typeof value !== 'string') return value;
  if (value.startsWith('**') && value.endsWith('**')) {
    return <strong><ManualCell value={value.slice(2, -2)} /></strong>;
  }
  if (value.startsWith('\u2705 ')) {
    return <span className={styles.status} data-status="success">
      <Icon name="check" size={16} /> {value.slice(2)}
    </span>;
  }
  return value;
}

export default function ManualTable({
  title, description, headers, rows, icon, numericColumns = [], numericRows = [],
}) {
  return (
    <div data-ep-theme="manual" className={styles.root}>
      <DataTableFrame
        title={icon ? <><Icon name={icon} size={18} /> {title}</> : title}
        description={description}
        minWidth="0">
        <table aria-label={title}>
          <thead>
            <tr>{headers.map((header, index) =>
              <th key={index} scope="col" data-numeric={numericColumns.includes(index) ? 'true' : undefined}>
                {header}
              </th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) =>
              <tr key={rowIndex}>
                <th scope="row"><ManualCell value={row[0]} /></th>
                {row.slice(1).map((cell, index) =>
                  <td key={index} data-numeric={numericColumns.includes(index + 1) || numericRows.includes(rowIndex) ? 'true' : undefined}>
                    <ManualCell value={cell} />
                  </td>)}
              </tr>)}
          </tbody>
        </table>
      </DataTableFrame>
    </div>
  );
}
