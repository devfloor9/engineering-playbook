import type { ComponentProps } from 'react';
import { FlowDiagram as SharedFlowDiagram } from '@shared/components';

// Keep shared rendering intact; provide an equivalent text route and mobile scrolling.
export function FlowDiagram(props: ComponentProps<typeof SharedFlowDiagram>) {
  const describe = props.edges.map(edge => {
    const from = props.nodes.find(node => node.id === edge.from);
    const to = props.nodes.find(node => node.id === edge.to);
    return `${from?.label} → ${to?.label}${edge.label ? ` (${edge.label})` : ''}`;
  }).join(' · ');
  return (
    <figure className="diagram">
      <div className="diagram-viewport" data-slide-scroll tabIndex={0} role="group" aria-label="네트워크 흐름도, 좁은 화면에서 좌우 스크롤">
        <div aria-hidden="true"><SharedFlowDiagram {...props} /></div>
      </div>
      <figcaption className="sr-only">{describe}</figcaption>
    </figure>
  );
}
