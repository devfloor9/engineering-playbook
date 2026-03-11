interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  icon?: string;
  description?: string;
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  style?: 'solid' | 'dashed';
  color?: string;
}

interface FlowDiagramProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  width?: number;
  height?: number;
  title?: string;
}

const defaultColors: Record<string, string> = {
  blue: '#3B82F6',
  emerald: '#10B981',
  amber: '#F59E0B',
  purple: '#8B5CF6',
  rose: '#F43F5E',
  cyan: '#06B6D4',
  orange: '#F97316',
  gray: '#6B7280',
};

export function FlowDiagram({ nodes, edges, width = 800, height = 400, title }: FlowDiagramProps) {
  const getNode = (id: string) => nodes.find((n) => n.id === id);

  return (
    <div className="flex flex-col items-center">
      {title && <h3 className="text-lg font-semibold text-gray-300 mb-4">{title}</h3>}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-5xl">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
          </marker>
          {Object.entries(defaultColors).map(([name, color]) => (
            <marker key={name} id={`arrow-${name}`} markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill={color} />
            </marker>
          ))}
        </defs>

        {edges.map((edge, i) => {
          const from = getNode(edge.from);
          const to = getNode(edge.to);
          if (!from || !to) return null;

          const fromW = from.width || 140;
          const fromH = from.height || 50;
          const toW = to.width || 140;
          const toH = to.height || 50;

          const fromCx = from.x + fromW / 2;
          const fromCy = from.y + fromH / 2;
          const toCx = to.x + toW / 2;
          const toCy = to.y + toH / 2;

          const dx = toCx - fromCx;
          const dy = toCy - fromCy;
          const angle = Math.atan2(dy, dx);

          const intersectRect = (cx: number, cy: number, w: number, h: number, a: number) => {
            const hw = w / 2;
            const hh = h / 2;
            const absCos = Math.abs(Math.cos(a));
            const absSin = Math.abs(Math.sin(a));
            let d: number;
            if (hw * absSin <= hh * absCos) {
              d = hw / absCos;
            } else {
              d = hh / absSin;
            }
            return { x: cx + d * Math.cos(a), y: cy + d * Math.sin(a) };
          };

          const p1 = intersectRect(fromCx, fromCy, fromW, fromH, angle);
          const p2 = intersectRect(toCx, toCy, toW, toH, angle + Math.PI);

          const x1 = p1.x;
          const y1 = p1.y;
          const x2 = p2.x;
          const y2 = p2.y;

          const edgeColor = edge.color || 'gray';
          const strokeColor = defaultColors[edgeColor] || edgeColor;

          return (
            <g key={i}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={strokeColor}
                strokeWidth="2"
                strokeDasharray={edge.style === 'dashed' ? '6,4' : undefined}
                markerEnd={`url(#arrow-${edgeColor})`}
              />
              {edge.label && (
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 8}
                  textAnchor="middle"
                  fill="#9CA3AF"
                  fontSize="11"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {nodes.map((node) => {
          const w = node.width || 140;
          const h = node.height || 50;
          const fill = defaultColors[node.color || 'blue'] || node.color || defaultColors.blue;

          return (
            <g key={node.id}>
              <rect
                x={node.x} y={node.y}
                width={w} height={h}
                rx="8" ry="8"
                fill={`${fill}20`}
                stroke={fill}
                strokeWidth="2"
              />
              <text
                x={node.x + w / 2}
                y={node.y + h / 2 + (node.description ? -4 : 5)}
                textAnchor="middle"
                fill="white"
                fontSize="13"
                fontWeight="600"
              >
                {node.label}
              </text>
              {node.description && (
                <text
                  x={node.x + w / 2}
                  y={node.y + h / 2 + 14}
                  textAnchor="middle"
                  fill="#9CA3AF"
                  fontSize="10"
                >
                  {node.description}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
