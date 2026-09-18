// Compare every recorded baseline omission, not a hand-picked component batch.
const fs = require('node:fs');
const path = require('node:path');

function auditCoverage(baseline, manifest) {
  const pages = new Map(manifest.docs.map(doc => [doc.slug, doc]));
  const baselinePages = baseline.docs.filter(doc => doc.content_coverage.omitted_components.length);
  const inventory = baselinePages.map(doc => {
    const current = pages.get(doc.slug);
    return {
      slug: doc.slug,
      components: doc.content_coverage.omitted_components.map(component => {
        const evidence = current?.content_coverage.rendered_sources.filter(r =>
          r.component === component || r.name === component || r.names?.includes(component)) || [];
        const omitted = current?.content_coverage.omitted_components.includes(component);
        return {
          component,
          status: !current ? 'page-missing' : omitted ? 'omitted' : evidence.length ? 'serialized' : 'source-changed',
          sources: [...new Set(evidence.map(e => e.source))].sort(),
          methods: [...new Set(evidence.map(e => e.method))].sort(),
        };
      }),
    };
  });
  return {
    issue: 52,
    baseline: {
      doc_count: baseline.doc_count,
      docs_with_omissions: baseline.component_coverage.docs_with_omissions,
      docs_with_technical_omissions: baseline.component_coverage.docs_with_technical_omissions,
      docs_with_navigation_omissions: baseline.component_coverage.docs_with_navigation_omissions,
      omitted_component_count: baseline.component_coverage.omitted_component_count,
    },
    current: {
      doc_count: manifest.doc_count,
      docs_with_omissions: manifest.component_coverage.docs_with_omissions,
      docs_with_technical_omissions: manifest.component_coverage.docs_with_technical_omissions,
      docs_with_navigation_omissions: manifest.component_coverage.docs_with_navigation_omissions,
      omitted_component_count: manifest.component_coverage.omitted_component_count,
      serialized_occurrences: manifest.component_coverage.serialized_occurrences,
      supported_source_count: manifest.component_coverage.supported_sources.length,
    },
    inventory,
    remaining: manifest.docs.filter(d => d.content_coverage.omitted_components.length).map(d => ({
      slug: d.slug, components: d.content_coverage.omitted_components, details: d.content_coverage.omission_details,
    })),
  };
}

if (require.main === module) {
  const argument = (flag, fallback) => {
    const i = process.argv.indexOf(flag);
    return i === -1 ? fallback : process.argv[i + 1];
  };
  const baselineFile = argument('--baseline', path.join(__dirname, 'tests/fixtures/llm-wiki-52-baseline.json'));
  const manifestFile = argument('--manifest', path.resolve(__dirname, '../build/llm-wiki/manifest.json'));
  const output = argument('--out', null);
  const report = auditCoverage(JSON.parse(fs.readFileSync(baselineFile, 'utf8')), JSON.parse(fs.readFileSync(manifestFile, 'utf8')));
  const text = JSON.stringify(report, null, 2) + '\n';
  if (output) fs.writeFileSync(output, text);
  else process.stdout.write(text);
}

module.exports = {auditCoverage};
