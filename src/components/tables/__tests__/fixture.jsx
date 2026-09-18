import React from 'react';
import {createRoot} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
import BaseTable from '../BaseTable';
import ComparisonTable from '../ComparisonTable';
import SpecificationTable from '../SpecificationTable';
import MetricsTable from '../MetricsTable';
import TroubleshootingTable from '../TroubleshootingTable';
import DataTableFrame from '../../DataTableFrame';
import Figure from '../../Figure';
import Mermaid from '../../../theme/Mermaid';
import MDXComponents from '../../../theme/MDXComponents';
import OriginalMDXComponents from '@theme-original/MDXComponents';
import {compareValues, numericValue} from '../values';
import {mermaidMetadata} from '../../../theme/Mermaid/metadata';
const MarkdownTable = MDXComponents.table;
window.h1Preserved = MDXComponents.h1 === OriginalMDXComponents.h1;
window.compareValues = compareValues;
window.numericValue = numericValue;
window.mermaidMetadata = mermaidMetadata;
function Opaque({value}) { return <code>{value}</code>; }
const rows = [
  {id: 'a', cells: [<strong>Beta</strong>, 10, <Opaque value="ten" />], sortValues: [undefined, 10, 10]},
  {id: 'b', cells: [<em>Alpha</em>, '2', <Opaque value="two" />], sortValues: [undefined, 2, 2]},
  {id: 'c', cells: [<span>Gamma</span>, -1, <Opaque value="minus one" />], sortValues: [undefined, -1, -1]},
];
window.originalRows = rows;
const captioned = <DataTableFrame title="Frame caption" description="Provided description">
  <table><thead><tr><th scope="col">Name</th><th scope="col">Value</th></tr></thead><tbody><tr><th scope="row">Alpha</th><td>12</td></tr></tbody></table>
</DataTableFrame>;
window.ssr = renderToStaticMarkup(captioned);
function Fixture() {
  return <article className="markdown">
    <h1>Shared data primitives</h1>
    <section id="short"><h2>Small data</h2><MarkdownTable id="markdown-short"><thead><tr><th>Key</th><th align="right">Value</th></tr></thead><tbody><tr><td>A</td><td align="right">12</td></tr></tbody></MarkdownTable></section>
    <section id="frame">{captioned}</section>
    <section id="wide"><DataTableFrame title="Wide data" description="All columns remain available." minWidth="58rem">
      <table><thead><tr>{Array.from({length: 8}, (_, i) => <th key={i} scope="col">Column {i}</th>)}</tr></thead><tbody><tr><th scope="row">Row identity</th>{Array.from({length: 7}, (_, i) => <td key={i}>{i + 1}</td>)}</tr></tbody></table>
    </DataTableFrame></section>
    <section id="sort"><BaseTable caption="Sortable values" description="Numbers and React nodes" headers={['Name', 'Count', 'Custom']} rows={rows} sortable searchable paginated pageSize={2} /></section>
    <section id="all"><BaseTable title="All rows" headers={['Name', 'Count', 'Custom']} rows={rows} /></section>
    <section id="nested"><DataTableFrame title="Outer caption" description="Outer description"><BaseTable title="Inner caption" headers={['Name', 'Count']} rows={[{id: 'x', cells: ['X', 1]}]} /></DataTableFrame></section>
    <section id="comparison"><ComparisonTable title="Comparison" headers={['Option', 'Value']} rows={[{id: 'a', cells: ['A', 10], recommended: true}, {id: 'b', cells: ['B', 2]}]} /></section>
    <section id="spec"><SpecificationTable title="Requirements" headers={['Model', 'Memory']} data={[[<strong key="a">Small</strong>, 2], ['Medium', 10], ['Large', 20]]} units={{1: 'GB'}} thresholds={{1: {warning: 10, danger: 20}}} sortable /></section>
    <section id="spec-node"><SpecificationTable headers={['Metric', 'Value']} data={[[<strong key="a">Opaque</strong>, <code key="b">12</code>]]} units={{1: 'GB'}} /></section>
    <section id="metrics"><MetricsTable headers={['Metric', 'Value']} rows={[{id: 'cpu', cells: ['CPU', 95]}]} currentValues={{CPU: 95}} thresholds={{CPU: {warning: 70, critical: 90}}} /></section>
    <section id="troubleshooting"><TroubleshootingTable issues={[{id: 'one', problem: 'Example problem', cause: 'Original cause', solution: 'Original solution', severity: 'high'}]} /></section>
    <section id="figure"><Figure title="Sample figure" description="Author description" source={<a href="#source">Source label</a>} dataFallback={<BaseTable headers={['Series', 'Value']} rows={[{id: 'one', cells: ['A', 12]}]} />}><svg viewBox="0 0 120 40" role="img" aria-label="Sample graphic"><text x="4" y="20" fill="var(--ep-on-surface)">Sample graphic</text></svg></Figure></section>
    <section id="iframe"><Figure title="Embedded diagram" source={<a href="#source">Original diagram</a>}><iframe title="Embedded diagram" height="480" srcDoc="<p>Local diagram placeholder</p>" /></Figure></section>
    <section id="mermaid"><h2>Request path</h2><Mermaid value={'flowchart LR\nA-->B'} /></section>
    <section id="authored"><Mermaid value={'flowchart LR\naccTitle: Provided graph title\naccDescr {\nProvided graph description.\nSecond line.\n}\nA-->B'} /></section>
  </article>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
