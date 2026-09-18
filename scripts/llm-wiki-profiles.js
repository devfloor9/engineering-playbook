const {element, StaticGap, native} = require('./llm-wiki-static');
const {openClaw, dataTable} = require('./llm-wiki-diagrams');

// These profiles are qualified by the actual source file, never by a tag name.
// They expand the complete static dataset; a default React render would hide it.
const expandedCategories = (_, scope) => Object.fromEntries(scope.get('categories').map(c => [c.id, true]));
const stateProfiles = {
  'src/components/GatewayApiTables/FeatureComparisonMatrix.js': {expanded: expandedCategories, allExpanded: true},
  'src/components/GatewayApiTables/SolutionOverviewMatrix.js': {expanded: expandedCategories, allExpanded: true},
  'src/components/EksDebugTables/ErrorQuickRefTable.js': {filter: 'all'},
};

const adapters = {
  'src/components/Icon/index.js': props => props.title || null,
  'src/components/Figure/index.js': (props, renderer) => element('figure', {}, [
    props.children,
    props.dataFallback,
    element('figcaption', {}, [
      props.title,
      props.description ? element('p', {}, [props.description]) : null,
      props.source != null ? element('p', {}, [renderer.locale === 'ko' ? '출처: ' : 'Source: ', props.source]) : null,
    ]),
  ]),
  'src/components/OpenClawArchitecture.js': openClaw,
  'src/components/AimlRelevanceChart.js': (props, renderer, file) => {
    const scope = renderer.componentScope(file, props);
    const t = scope.get('t');
    const fn = renderer.module(file).exports.get('default')();
    const returned = fn.node.body.body.find(s => s.type === 'ReturnStatement');
    return [
      renderer.evaluate(returned.argument, scope),
      element('p', {}, ['The following bar widths are the source illustration scale, not measured workload percentages.']),
      dataTable(['Workload', 'Relevance', 'Source bar width / 100'], t.workloads.map(w => [w.label, t.relevance[w.relevance], w.pct])),
    ];
  },
  // Search, sort and pagination are presentation controls. Export every row in
  // source order, including cells produced by the specialized table component.
  'src/components/tables/BaseTable.js': props => {
    if (!Array.isArray(props.headers) || !Array.isArray(props.rows)) throw new StaticGap('Table headers/rows are not static arrays');
    return [
      props.description != null ? element('p', {}, [props.description]) : null,
      element('table', {}, [
      (props.caption ?? props.title) != null
        ? element('caption', {}, [props.caption ?? props.title]) : null,
      element('thead', {}, [element('tr', {}, props.headers.map(h => element('th', {}, [h])))]),
      element('tbody', {}, props.rows.map(row => {
        if (!Array.isArray(row.cells) || row.cells.length !== props.headers.length) throw new StaticGap('Table row width does not match headers');
        return element('tr', {}, row.cells.map(c => element('td', {}, [c])));
      })),
    ])];
  },
  'src/components/tables/TroubleshootingTable.js': (props, renderer) => {
    if (!Array.isArray(props.issues)) throw new StaticGap('Troubleshooting issues are not a static array');
    const labels = renderer.locale === 'ko'
      ? {low: '낮음', medium: '중간', high: '높음', critical: '심각', cause: '원인', solution: '해결 방법'}
      : {low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical', cause: 'Cause', solution: 'Solution'};
    return props.issues.map(issue => {
      if (!['problem', 'cause', 'solution'].every(key => typeof issue[key] === 'string')) {
        throw new StaticGap('Troubleshooting issue fields are not static text');
      }
      return element('section', {}, [
        element('h4', {}, [issue.problem]),
        issue.severity ? element('p', {}, [labels[issue.severity]]) : null,
        element('p', {}, [element('strong', {}, [`${labels.cause}: `]), issue.cause]),
        element('p', {}, [element('strong', {}, [`${labels.solution}: `]), issue.solution]),
      ]);
    });
  },
  'src/components/DataTableFrame/index.js': props => element('figure', {}, [
    element('figcaption', {}, [props.title]),
    ...(props.description ? [element('p', {}, [props.description])] : []),
    props.children,
  ]),
  'src/components/LegacySectionLinks/index.js': (props, renderer) => {
    if (!props.sections || typeof props.basePath !== 'string') throw new StaticGap('Legacy sections are not static');
    return element('details', {}, [
      element('summary', {}, ['이전 섹션 링크로 찾기']),
      element('p', {}, ['기존에 공유한 섹션 링크는 해당 내용이 있는 문서로 연결됩니다.']),
      element('ul', {}, Object.entries(props.sections).map(([id, section]) =>
        element('li', {id}, [element('a', {href: `${props.basePath}/${section.path}#${encodeURIComponent(id)}`}, [section.title])]))),
    ]);
  },
  'src/components/GatewayApiTables/RoadmapTimeline.js': (props, renderer, file) => {
    const scope = renderer.componentScope(file, props);
    return element('section', {}, [
      element('h4', {}, [scope.get('lb').title]),
      ...scope.get('phases').map(phase => element('section', {}, [
        element('h5', {}, [phase.phase, ' — ', phase.period]),
        element('ul', {}, phase.items.map(item => element('li', {}, [item]))),
      ])),
    ]);
  },
  'src/components/GatewayApiTables/GammaSupportTable.js': (props, renderer, file) => {
    const scope = renderer.componentScope(file, props);
    const fl = scope.get('fl'), lb = scope.get('lb');
    const headers = ['구현체', '상태', lb.dataPlane, lb.sidecar, 'GAMMA', ...Object.values(fl), lb.overhead, lb.strength];
    return adapters['src/components/tables/BaseTable.js']({
      headers,
      rows: scope.get('items').map(item => ({cells: [
        item.name, item.status, item.dataPlane, item.sidecar, item.gamma,
        ...Object.keys(fl).map(key => item.features[key]), item.overhead, item.strength,
      ]})),
    });
  },
  'src/components/GatewayApiBenefits/index.js': (props, renderer, file) => {
    const scope = renderer.componentScope(file, props);
    return scope.get('benefits').map(benefit => element('section', {}, [
      element('h4', {}, [benefit.title[renderer.locale] || benefit.title.en]),
      benefit.diagram,
      element('pre', {className: 'yaml'}, [benefit.yaml]),
    ]));
  },
  'src/components/EastWestTrafficTables/LatencyCostComparison.js': (props, renderer, file) => {
    const scope = renderer.componentScope(file, props);
    // The UI encodes the score only in five coloured dots. Preserve the exact
    // source score as text, while rendering all other prose from the component.
    scope.set('renderScore', native(([score]) => `${score}/5`));
    const fn = renderer.module(file).exports.get('default')();
    const returned = fn.node.body.body.find(s => s.type === 'ReturnStatement');
    if (!returned) throw new StaticGap('Latency comparison adapter no longer matches source');
    return renderer.evaluate(returned.argument, scope);
  },
};

module.exports = {adapters, stateProfiles};
