---
created: 2026-02-14
last_update:
  date: 2026-09-18
reading_time: 10
---
# Table Components Library

A collection of React table components for the Agentic AI Platform documentation, built with Docusaurus 3.9.2.

## Components

### BaseTable

The foundation component providing core table functionality.

**Features:**
- Sorting (ascending/descending)
- Search/filtering
- Pagination
- Responsive design
- Dark mode support
- Native table semantics and keyboard controls

**Usage:**

```jsx
import { BaseTable } from '@site/src/components/tables';

<BaseTable
  headers={['Name', 'Age', 'City']}
  rows={[
    { id: '1', cells: ['Alice', 30, 'Seoul'] },
    { id: '2', cells: ['Bob', 25, 'Busan'] }
  ]}
  sortable
  searchable
  paginated
  pageSize={10}
/>
```

### ComparisonTable

Specialized for comparing solutions, options, or alternatives.

**Features:**
- All BaseTable features
- Recommended option highlighting
- Hover effects
- Visual badges

**Usage:**

```jsx
import { ComparisonTable } from '@site/src/components/tables';

<ComparisonTable
  headers={['솔루션', '특징', '사용 사례']}
  rows={[
    { id: 'kagent', cells: ['Kagent', 'AI 에이전트 CRD', '멀티 에이전트'] },
    { id: 'kubeai', cells: ['KubeAI', '경량 LLM 서빙', '프로토타이핑'] }
  ]}
  recommendedId="kagent"
/>
```

### SpecificationTable

Designed for technical specifications and resource requirements.

**Features:**
- All BaseTable features
- Unit display (GB, CPU, etc.)
- Threshold indicators (normal/warning/danger)
- Color-coded values
- Status dots

**Usage:**

```jsx
import { SpecificationTable } from '@site/src/components/tables';

<SpecificationTable
  headers={['모델 크기', '최소 GPU', '메모리 요구']}
  rows={[
    { id: '1', cells: ['8B', '1x A100 80GB', 80] },
    { id: '2', cells: ['70B', '8x A100 80GB', 640] }
  ]}
  units={{ 2: 'GB' }}
  thresholds={{ 2: { warning: 500, danger: 600 } }}
/>
```

### TroubleshootingTable

Specialized for problem-cause-solution documentation.

**Features:**
- Expandable rows
- Severity indicators (low/medium/high/critical)
- Search functionality
- Color-coded severity levels
- Keyboard navigation

**Usage:**

```jsx
import { TroubleshootingTable } from '@site/src/components/tables';

<TroubleshootingTable
  issues={[
    {
      id: '1',
      problem: 'Pod CrashLoopBackOff',
      cause: 'API 키 오류, 메모리 부족',
      solution: '시크릿 확인, 리소스 증가',
      severity: 'high'
    }
  ]}
  searchable
/>
```

### MetricsTable

Designed for monitoring metrics with status indicators and thresholds.

**Features:**
- All BaseTable features
- Status indicator dots (normal/warning/critical)
- Threshold-based color coding
- Animated status changes
- Visual legend
- Accessibility support

**Usage:**

```jsx
import { MetricsTable } from '@site/src/components/tables';

<MetricsTable
  headers={['메트릭', '임계값 (경고)', '임계값 (위험)', '설명']}
  rows={[
    { id: '1', cells: ['CPU 사용률', '70%', '90%', 'CPU 사용률 모니터링'] },
    { id: '2', cells: ['메모리 사용률', '80%', '95%', '메모리 사용률 모니터링'] },
    { id: '3', cells: ['GPU 온도', '75°C', '85°C', 'GPU 온도 모니터링'] }
  ]}
  thresholds={{
    'CPU 사용률': { warning: 70, critical: 90 },
    '메모리 사용률': { warning: 80, critical: 95 },
    'GPU 온도': { warning: 75, critical: 85 }
  }}
  currentValues={{
    'CPU 사용률': 65,
    '메모리 사용률': 82,
    'GPU 온도': 88
  }}
  showLegend
/>
```

## Props Reference

### BaseTable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `headers` | `ReactNode[]` | required | Array of column headers |
| `rows` | `Row[]` | required | Array of row objects |
| `sortable` | `boolean` | `false` | Enable column sorting |
| `searchable` | `boolean` | `false` | Enable search functionality |
| `paginated` | `boolean` | `false` | Enable pagination |
| `pageSize` | `number` | `10` | Rows per page |
| `className` | `string` | `''` | Additional CSS class |
| `responsive` | `boolean` | `true` | Enable responsive wrapper |
| `ariaLabel` | `string` | section or column labels | Explicit accessible name override |
| `title` / `caption` | `ReactNode` | - | Native caption; `caption` takes precedence |
| `description` | `ReactNode` | - | Description associated with the table and scroll region |
| `minWidth` | `string` | no minimum | Explicit minimum for wide tables only |
| `rowHeaderColumn` | `number` or `null` | `0` | Identity column rendered as a row header; `null` opts out |
| `columnAlignments` | `Array<left/center/right>` | numeric inference | Explicit column alignment |

**Row Object:**
```typescript
{
  id: string | number;     // Unique identifier
  cells: React.ReactNode[]; // Complete display values, including units/status
  sortValues?: (string | number | null)[]; // Optional primitive keys for opaque cells
  searchValues?: string[]; // Optional searchable text for opaque cells
  recommended?: boolean;  // ComparisonTable also accepts row-level recommendations
  className?: string;      // Optional CSS class
  highlighted?: boolean;   // Highlight the row
}
```

### ComparisonTable Props

Extends BaseTable props with:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `recommendedId` | `string` | - | ID of recommended row |
| `highlightOnHover` | `boolean` | `true` | Enable hover highlighting |

### SpecificationTable Props

Extends BaseTable props with:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `units` | `object` | `{}` | Column units `{columnIndex: 'unit'}` |
| `thresholds` | `object` | `{}` | Thresholds `{columnIndex: {warning, danger}}` |

### TroubleshootingTable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `issues` | `Issue[]` | required | Array of issue objects |
| `searchable` | `boolean` | `true` | Enable search |
| `defaultExpanded` | `boolean` | `false` | Expand all by default |

**Issue Object:**
```typescript
{
  id: string;
  problem: string;
  cause: string;
  solution: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}
```

### MetricsTable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `headers` | `ReactNode[]` | required | Array of column headers |
| `rows` | `Row[]` | required | Array of row objects |
| `thresholds` | `object` | `{}` | Thresholds `{metricName: {warning, critical}}` |
| `currentValues` | `object` | `{}` | Current values `{metricName: number}` |
| `showLegend` | `boolean` | `true` | Display status legend |
| `sortable` | `boolean` | `false` | Enable sorting |
| `searchable` | `boolean` | `false` | Enable search |
| `paginated` | `boolean` | `false` | Enable pagination |
| `pageSize` | `number` | `10` | Rows per page |
| `className` | `string` | `''` | Additional CSS class |
| `ariaLabel` | `string` | section or column labels | Explicit accessible name override |

## Styling

All components use CSS Modules for scoped styling and support:
- Docusaurus theme variables
- Dark mode (automatic)
- Responsive breakpoints
- Print styles
- Custom CSS classes

## Accessibility

All components follow WCAG 2.1 AA guidelines:
- Semantic HTML
- ARIA labels and roles
- Keyboard navigation
- Focus indicators
- Screen reader support

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Migration from Markdown Tables

### Before (Markdown):

```markdown
| 솔루션 | 특징 | 사용 사례 |
| --- | --- | --- |
| Kagent | AI 에이전트 CRD | 멀티 에이전트 |
| KubeAI | 경량 LLM 서빙 | 프로토타이핑 |
```

### After (MDX):

```mdx
import { ComparisonTable } from '@site/src/components/tables';

<ComparisonTable
  headers={['솔루션', '특징', '사용 사례']}
  rows={[
    { id: 'kagent', cells: ['Kagent', 'AI 에이전트 CRD', '멀티 에이전트'] },
    { id: 'kubeai', cells: ['KubeAI', '경량 LLM 서빙', '프로토타이핑'] }
  ]}
  recommendedId="kagent"
/>

{/* Original table preserved for reference
| 솔루션 | 특징 | 사용 사례 |
| --- | --- | --- |
| Kagent | AI 에이전트 CRD | 멀티 에이전트 |
| KubeAI | 경량 LLM 서빙 | 프로토타이핑 |
*/}
```

## Performance

- Components use React.memo() for optimization
- Search is debounced to reduce re-renders
- Virtual scrolling for large datasets (100+ rows)
- Code splitting support
- Minimal bundle size impact

## Testing

Run tests with:

```bash
npm test
```

Components include:
- Unit tests (Jest + React Testing Library)
- Accessibility tests
- Snapshot tests

## Contributing

When adding new table components:

1. Extend BaseTable when possible
2. Follow existing naming conventions
3. Add PropTypes validation
4. Include CSS Module for styles
5. Write comprehensive tests
6. Update this README
7. Add usage examples

## License

Part of the engineering-playbook project.


## Shared data and figure contract (#65)

`DataTableFrame` is the single caption/overflow boundary. Existing
`title`, `description`, `children`, and `minWidth` props remain supported.
It additionally accepts `className`, `ariaLabel`, `aria-labelledby`,
`aria-describedby`, and `scrollable` (default true). The default minimum width
is now zero; pass `minWidth="42rem"` or another explicit width only for a wide
comparison. Nested frames share the outer scroll region. Set the width on that
outer frame when nesting. Native captions, IDs, header scopes, and authored
ARIA references remain intact. Short tables do not enter the tab order; an
actually overflowing region has a tab stop and localized scroll guidance.

BaseTable uses the frame and a native `caption`, with the first column rendered
as `th scope="row"`. Sorting is opt-in across the shared table family. Existing
`sortable`, `searchable`, pagination, row classes and highlighting remain
supported. `responsive={false}` retains the explicit non-scrolling presentation.
Finite numeric values and numeric strings sort numerically. React element
children supply plain text without `String(element)` coercion; opaque components
should provide `row.sortValues` and optionally `row.searchValues`. Units and
status markup remain in `row.cells`. Sort and search never mutate source rows.

ComparisonTable supports both `recommendedId` and `row.recommended === true`.
Recommendation labels are visible in Korean and English. SpecificationTable
supports both `rows` and its existing `data` matrix; its `title` is now a caption.
Its normal/warning/danger labels and units stay visible in either locale.
MetricsTable shows per-metric status text as well as its optional legend.
TroubleshootingTable retains search/expand props and uses native buttons with
unique controlled-panel IDs. Collapsed panels remain in the DOM, and print
styles expose their complete content.

Only `src/theme/MDXComponents/index.js` maps Markdown `table` to `Table.js`,
which uses DataTableFrame and preserves all original mappings, including `h1`.
Existing table attributes/alignment are forwarded. Body first-column cells
become row headers; explicit authored scopes are preserved. Without a caption,
the closest preceding section supplies the hydrated table/region name; column
labels provide an SSR fallback. No document source is rewritten.

### Figure

```jsx
import Figure from '@site/src/components/Figure';

<Figure
  title="Author-provided title"
  description="Author-provided explanation"
  source={<a href={sourceUrl}>Original diagram</a>}
  dataFallback={<BaseTable headers={headers} rows={rows} />}
>
  <iframe src={sourceUrl} title="Diagram title" height="480" loading="lazy" />
</Figure>
```

All five content props (`title`, `description`, `source`, `children`,
`dataFallback`) accept ReactNodes; `className` is optional. Source is a ReactNode,
so supply an anchor for a clickable URL. The shell invents no title, description,
units or data. It renders a native figure with its figcaption last and visible
fallback data before the caption. Direct iframe children retain their `src` and
attributes, with scoped 100% inline size, 480px block size, 32rem maximum block
size and no border. No inline document style is necessary.

Mermaid uses this figure shell. Source `accTitle` and single/multiline `accDescr`
are preserved as text. When no title exists, the surrounding section supplies a
contextual name only; no technical description is generated. The native dialog,
Escape close, focus return, 10–200% zoom, actual size and fit controls remain.
Shared SVG icons always have adjacent visible localized control labels.

### Exporter handoff (coordinator-owned; exporter files unchanged)

The current source-qualified BaseTable profile bypasses React rendering and
already exports every `props.rows` item in source order. Extend it to emit
`props.caption ?? props.title` as a native caption and `props.description` as
prose. Continue using **every `row.cells` item**, never `sortValues`, `searchValues`,
filtered rows or the current page. `headers` and `cells` can be ReactNodes.
`rowHeaderColumn` changes semantics only; no row/column/value is omitted.

The DataTableFrame profile still consumes `title`, `description`, and `children`;
keep all three and nested native captions. New layout/ARIA props carry no
additional export content. The Figure profile must preserve title, description,
source, children and dataFallback; a source-qualified iframe child must retain
the existing draw.io source serializer. **The current static evaluator rejects
iframe during JSX/props evaluation, before a normal Figure adapter receives
children** (`scripts/llm-wiki-static.js`). Intercept that embedded child using
its actual source rather than treating the figure as unsupported or dropping it.

The shared Icon needs a source-qualified decorative adapter returning no content.
ComparisonTable/SpecificationTable then statically evaluate their display cells:
visible localized status/recommendation labels and units are already plain text
in those cells. `recommendedId` and row-level `recommended` must both survive.
No new adapter is necessary for these two specialized tables.

MetricsTable's `Number.isFinite` requires a safe static intrinsic, or a
source-qualified MetricsTable adapter preserving all rows, threshold status and
optional legend. TroubleshootingTable needs an exhaustive profile/adapter for
all `issues` (problem, severity, cause, solution), independent of search or expand
state. Both were probed; the unmodified exporter reports these as unsupported
instead of silently returning complete output. The present three production
manuals importing shared tables use ComparisonTable/SpecificationTable, not
MetricsTable/TroubleshootingTable.

### Scoped verification

```sh
EP_TEST_DEPS=/absolute/path/to/node_modules \
EP_FOUNDATION_ROOT=/absolute/path/to/foundation-checkout \
node --test src/components/tables/__tests__/data-primitives.test.cjs
node --test src/components/tables/__tests__/export-contract.test.cjs
```

The harness bundles only the fixture and its component imports, reads Foundation
Icon/CSS through an external source alias, and starts its own headless Chrome
profile. It neither copies shared implementation nor installs dependencies.
It reads the installed Infima CSS, supplies locale context and substitutes only
the upstream Mermaid SVG renderer. The real wrapper/dialog/focus/zoom code runs.
`CHROME_BIN` selects another Chromium binary; `EP_KEEP_TEST_ARTIFACTS=1` retains
screenshots and the temporary bundle. The coordinator must still run integrated
Docusaurus/Mermaid and export parity checks after merging profiles and content.

The export contract test injects example profiles and the `Number.isFinite`
intrinsic into an isolated renderer in memory. It verifies all 30 shared-table
occurrences in the existing three Korean/English manual pairs with no omissions,
as well as captions, descriptions, recommendation flags, threshold labels and
rows beyond the visible page. These examples are handoff material, not installed
production adapters. The unmodified exporter suite in this isolated worktree
currently reports 55 passing tests, 3 failures and 1 skip because the external
Foundation Icon is not present in its normal source resolver. Integrate the
Foundation and source-qualified profiles before rerunning that complete suite.
