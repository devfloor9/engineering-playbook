import { motion } from 'framer-motion';

export interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color?: string;
  width?: number;
  height?: number;
  icon?: string;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  color?: string;
}

interface FlowDiagramProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  width?: number;
  height?: number;
}

const defaultColors: Record<string, string> = {
  blue: '#3b82f6',
  rose: '#ef4444',
  amber: '#f59e0b',
  emerald: '#10b981',
  purple: '#8b5cf6',
  orange: '#ff9900',
  gray: '#6b7280',
};

export function FlowDiagram({ nodes, edges, width = 900, height = 400 }: FlowDiagramProps) {
  const getNode = (id: string) => nodes.find(n => n.id === id);

  return (
    <motion.svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-5xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <defs>
        <marker id="arrow" viewBox="0 0 10 7" refX="9" refY="3.5"
          markerWidth="8" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 3.5 L 0 7 z" fill="#9ca3af" />
        </marker>
        {Object.entries(defaultColors).map(([name, color]) => (
          <marker key={name} id={`arrow-${name}`} viewBox="0 0 10 7" refX="9" refY="3.5"
            markerWidth="8" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 3.5 L 0 7 z" fill={color} />
          </marker>
        ))}
      </defs>

      {/* Edges */}
      {edges.map((edge, i) => {
        const from = getNode(edge.from);
        const to = getNode(edge.to);
        if (!from || !to) return null;
        const fw = from.width ?? 140;
        const fh = from.height ?? 50;
        const tw = to.width ?? 140;
        const th = to.height ?? 50;

        const fx = from.x + fw / 2;
        const fy = from.y + fh / 2;
        const tx = to.x + tw / 2;
        const ty = to.y + th / 2;

        // Simple direction-based edge connection
        let x1 = fx, y1 = fy, x2 = tx, y2 = ty;
        if (Math.abs(tx - fx) > Math.abs(ty - fy)) {
          // Horizontal
          x1 = tx > fx ? from.x + fw : from.x;
          x2 = tx > fx ? to.x : to.x + tw;
          y1 = fy; y2 = ty;
        } else {
          // Vertical
          y1 = ty > fy ? from.y + fh : from.y;
          y2 = ty > fy ? to.y : to.y + th;
          x1 = fx; x2 = tx;
        }

        const edgeColor = edge.color ? (defaultColors[edge.color] || edge.color) : '#6b7280';
        const markerId = edge.color && defaultColors[edge.color] ? `arrow-${edge.color}` : 'arrow';

        return (
          <g key={i}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={edgeColor}
              strokeWidth={2}
              strokeDasharray={edge.dashed ? '6 3' : undefined}
              markerEnd={`url(#${markerId})`}
            />
            {edge.label && (
              <text
                x={(x1 + x2) / 2}
                y={(y1 + y2) / 2 - 8}
                textAnchor="middle"
                className="text-xs fill-gray-400"
                fontSize={12}
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const w = node.width ?? 140;
        const h = node.height ?? 50;
        const color = node.color ? (defaultColors[node.color] || node.color) : defaultColors.blue;
        return (
          <g key={node.id}>
            <rect
              x={node.x} y={node.y}
              width={w} height={h}
              rx={8}
              fill={`${color}22`}
              stroke={color}
              strokeWidth={2}
            />
            {node.icon && (
              <text
                x={node.x + 12}
                y={node.y + h / 2 + 1}
                dominantBaseline="middle"
                fontSize={16}
              >
                {node.icon}
              </text>
            )}
            <text
              x={node.x + w / 2}
              y={node.y + h / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={14}
              fontWeight={600}
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </motion.svg>
  );
}
