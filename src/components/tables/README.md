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
- Accessibility (WCAG 2.1 AA)

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
| `headers` | `string[]` | required | Array of column headers |
| `rows` | `Row[]` | required | Array of row objects |
| `sortable` | `boolean` | `false` | Enable column sorting |
| `searchable` | `boolean` | `false` | Enable search functionality |
| `paginated` | `boolean` | `false` | Enable pagination |
| `pageSize` | `number` | `10` | Rows per page |
| `className` | `string` | `''` | Additional CSS class |
| `responsive` | `boolean` | `true` | Enable responsive wrapper |
| `ariaLabel` | `string` | `'Data table'` | ARIA label for accessibility |

**Row Object:**
```typescript
{
  id: string;              // Unique identifier
  cells: React.Node[];     // Array of cell content
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
| `headers` | `string[]` | required | Array of column headers |
| `rows` | `Row[]` | required | Array of row objects |
| `thresholds` | `object` | `{}` | Thresholds `{metricName: {warning, critical}}` |
| `currentValues` | `object` | `{}` | Current values `{metricName: number}` |
| `showLegend` | `boolean` | `true` | Display status legend |
| `sortable` | `boolean` | `true` | Enable sorting |
| `searchable` | `boolean` | `false` | Enable search |
| `paginated` | `boolean` | `false` | Enable pagination |
| `pageSize` | `number` | `10` | Rows per page |
| `className` | `string` | `''` | Additional CSS class |
| `ariaLabel` | `string` | `'Metrics table'` | ARIA label |

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
