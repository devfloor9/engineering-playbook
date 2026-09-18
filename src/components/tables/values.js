import {nodeText} from '@site/src/components/DataTableFrame/accessibility';

export function numericValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const text = nodeText(value).trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

export function rowValue(row, column) {
  return row.sortValues?.[column] ?? row.cells[column];
}

export function compareValues(a, b, collator) {
  const aNumber = numericValue(a), bNumber = numericValue(b);
  if (aNumber !== null && bNumber !== null) return aNumber - bNumber;
  return collator.compare(nodeText(a), nodeText(b));
}
