# LLM Wiki static content export (#52)

`generate-llm-wiki.js` exports the included Korean technical corpus. It reads
Markdown, component source and local data; it does not build the site, load remote
pages, run application modules, or call models.

## Source resolution and coverage

The importer resolves the actual module and exported symbol, including barrels,
aliases, namespace imports, relative imports and JSON data. Component names are
not unique. `content_coverage.rendered_sources` records the binding, representation
method and source files for each occurrence. `component_coverage.supported_sources`
keeps source-qualified coverage alongside the legacy name lists.

`llm-wiki-static.js` interprets a bounded subset of the Babel AST: literal data,
local bindings/functions, destructuring, conditionals, arithmetic, bounded local
loops and allowlisted array/string/number operations. There is no `eval`,
`Function`, VM, application-module `require`, browser environment, network API or
prototype traversal. Unsupported semantic expressions reject the entire
component; partial renderings are not counted as success. CSS and event handlers
are presentation only. Unknown React state is never replaced by its initial
value to claim complete content.

Tables preserve cells, captions, units, recommendations, links and inline code.
Compatible CSS grid rows become Markdown tables only when a distinct header is
followed by mapped rows. Other groups retain their source order and text.
Row/column spans retain semantic HTML. Shared BaseTable export includes every
source row regardless of the UI search, sorting or pagination controls.

Specific source profiles in `llm-wiki-profiles.js` cover:

- Every category in FeatureComparisonMatrix and SolutionOverviewMatrix.
- Every ErrorQuickRefTable item; every RoadmapTimeline phase/detail.
- Every GammaSupportTable implementation and feature, including static fields
  that its collapsed view does not show.
- All six GatewayApiBenefits sections, diagrams and exact YAML bodies.
- LatencyCostComparison's five-dot scores as `score/5`.
- AimlRelevanceChart's original bar widths, explicitly identified as illustration
  scale rather than measured workload percentages.
- DataTableFrame captions/descriptions and LegacySectionLinks fragment targets.

Profiles refer to source data rather than duplicate technical datasets. A profile
is intentionally narrow and needs review when its component's data/control shape
changes. Isolated React parity and all-item source checks guard these contracts.

## Diagrams and navigation

- JSX/CSS diagrams retain source labels, grouping, arrows, legends and caveats.
  Mermaid fences remain unchanged.
- OpenClawArchitecture reads its 22 rectangle commands, 28 text commands and 11
  arrow polylines. The equivalent contains labels, bounding boxes, exact directed
  points and endpoint box IDs. It never runs roughjs or the browser effect.
- InferencePipelineDiagram uses the checked-in static HTML main content, including
  CSS-arrow direction and source flow order. Theme messaging and download/zoom
  controls do not contribute article content and are not reproduced.
- The architecture overview's previously uncounted lowercase draw.io iframe is
  resolved to its local uncompressed `.drawio` file. All 118 vertices and 34 edges
  retain IDs, labels, parent groups, endpoints and explicit arrow/dash styles.
  The remote viewer is never fetched. Compressed drawings, changed schemas and
  unknown external iframes remain explicit gaps.
- DocCard/Grid literals become links. DocCardList supports literal link arrays,
  its implicit sidebar category, and the source-qualified
  `useCurrentSidebarCategory().items` expression. The sidebar object is parsed
  statically; target titles/descriptions come from document frontmatter. Arbitrary
  expressions do not become guessed directory listings.

These are representations of the repository's source claims, not new validation
of benchmark numbers, costs or operational evidence. Source inconsistencies are
preserved rather than corrected or fabricated by the exporter.

## Preservation and honest limitations

Babel finds complete JSX and ESM boundaries; multiline props, nested elements and
trailing prose cannot consume the next paragraph/import. Markdown tab children,
fenced/indented code and inline-code examples remain intact. Markdown parsing
locates only real link destinations, including reference definitions; replacements
leave code examples, prose and link titles unchanged.

Unknown components, runtime props/state, effects without an explicit static
equivalent, unsupported SVG geometry and external embeds keep an inline export
note and `omission_details`. A malformed component boundary fails export rather
than silently deleting following content. Coverage reports static content, not
interactive behavior. Zero omissions applies to the checked source snapshot and
does not imply support for arbitrary MDX or future widgets.

## Verification and inventory

The existing entry point includes boundary/security tests, all-occurrence React
parity, source-data adapter checks and local diagram graph checks:

```bash
npm run test:llm-wiki
node scripts/generate-llm-wiki.js --out /tmp/llm-wiki-check
node scripts/audit-llm-wiki.js \
  --manifest /tmp/llm-wiki-check/llm-wiki/manifest.json \
  --out /tmp/llm-wiki-coverage.json
```

The React oracle compiles repository JSX into a temporary directory and uses the
already installed/locked Babel and React packages. It does not install packages
or mutate `node_modules`. Source profiles expand hidden categories in the
independent React rendering. Adapter tests inspect every source item/field,
including YAML, illustration values and diagram topology.

An existing Docusaurus build can additionally be used as read-only HTML fixtures:

```bash
LLM_WIKI_BASELINE_HTML=/path/to/existing/build npm run test:llm-wiki
```

The full-build fixture check is explicitly skipped when this variable is absent.
Committed compact HTML fixtures also retain selected baseline tables/navigation.
No test triggers a full site build or remote/paid evaluation.

`tests/fixtures/llm-wiki-52-baseline.json` preserves all 58 originally affected
pages and 169 distinct omitted names (222 documents; 43 technical / 15 navigation
pages). `llm-wiki-issue-52-inventory.json` maps every baseline occurrence to its
current source/method and lists any residual omissions. Recreate it with
`audit-llm-wiki.js`; `source-changed` and `page-missing` are distinct from successful
serialization so deleting a widget/page cannot masquerade as added support.
