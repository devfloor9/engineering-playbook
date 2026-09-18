// Only the upstream graph renderer is substituted. The real viewer, effects,
// native dialog, keyboard handling, controls and shared Figure are exercised.
import React, {useId} from 'react';
import {mermaidMetadata} from '../../../theme/Mermaid/metadata';
export default function OriginalMermaid({value}) {
  const id = useId();
  const metadata = mermaidMetadata(value);
  return <div className="docusaurus-mermaid-container"><svg viewBox="0 0 1000 200" role="img"
    aria-labelledby={metadata.title ? `${id}-title` : undefined}
    aria-describedby={metadata.description ? `${id}-description` : undefined}>
    {metadata.title && <title id={`${id}-title`}>{metadata.title}</title>}
    {metadata.description && <desc id={`${id}-description`}>{metadata.description}</desc>}
    <rect x="10" y="10" width="400" height="100" fill="var(--ep-chart-1)" />
    <rect x="550" y="10" width="400" height="100" fill="var(--ep-chart-2)" />
    <text x="10" y="180" fill="var(--ep-on-surface)">A → B</text>
  </svg></div>;
}
