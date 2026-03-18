import { motion } from 'motion/react';
import { ARROW_COLOR, type DiagramArrow as ArrowData, type DiagramNode } from '@/data/diagrams';

interface Props {
  arrow: ArrowData;
  nodes: DiagramNode[];
  index: number;
}

function getNodeCenter(node: DiagramNode): [number, number] {
  const w = node.w ?? 150;
  const h = node.h ?? 70;
  return [node.x + w / 2, node.y + h / 2];
}

function getNodeEdge(from: DiagramNode, to: DiagramNode): { x1: number; y1: number; x2: number; y2: number } {
  const [fx, fy] = getNodeCenter(from);
  const [tx, ty] = getNodeCenter(to);
  const fw = (from.w ?? 150) / 2;
  const fh = (from.h ?? 70) / 2;
  const tw = (to.w ?? 150) / 2;
  const th = (to.h ?? 70) / 2;

  const dx = tx - fx;
  const dy = ty - fy;
  const angle = Math.atan2(dy, dx);

  let x1: number, y1: number, x2: number, y2: number;

  if (Math.abs(dx) > Math.abs(dy)) {
    x1 = fx + (dx > 0 ? fw : -fw);
    y1 = fy;
    x2 = tx + (dx > 0 ? -tw : tw);
    y2 = ty;
  } else {
    x1 = fx;
    y1 = fy + (dy > 0 ? fh : -fh);
    x2 = tx;
    y2 = ty + (dy > 0 ? -th : th);
  }

  if (from.type === 'io') {
    x1 = fx + Math.cos(angle) * fw;
    y1 = fy + Math.sin(angle) * fh;
  }
  if (to.type === 'io') {
    x2 = tx - Math.cos(angle) * tw;
    y2 = ty - Math.sin(angle) * th;
  }

  return { x1, y1, x2, y2 };
}

export function DiagramArrow({ arrow, nodes, index }: Props) {
  const fromNode = nodes.find(n => n.id === arrow.from);
  const toNode = nodes.find(n => n.id === arrow.to);
  if (!fromNode || !toNode) return null;

  const { x1, y1, x2, y2 } = getNodeEdge(fromNode, toNode);
  const markerId = `ah-${arrow.from}-${arrow.to}`;
  const glowId = `glow-${arrow.from}-${arrow.to}`;

  let path: string;
  if (arrow.curve === 'curve-down') {
    const midY = Math.max(y1, y2) + 80;
    path = `M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`;
  } else if (arrow.curve === 'curve-up') {
    const midY = Math.min(y1, y2) - 50;
    path = `M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`;
  } else {
    path = `M${x1},${y1} L${x2},${y2}`;
  }

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const labelOffsetY = arrow.curve === 'curve-down' ? 50 : arrow.curve === 'curve-up' ? -25 : -12;

  return (
    <g>
      <defs>
        <marker id={markerId} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={ARROW_COLOR} />
        </marker>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glow trail — faint copy of the path */}
      <motion.path
        d={path}
        fill="none"
        stroke={ARROW_COLOR}
        strokeWidth={4}
        strokeOpacity={0.08}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.4 + index * 0.08, duration: 0.5 }}
      />

      {/* Main arrow path — draws itself */}
      <motion.path
        d={path}
        fill="none"
        stroke={ARROW_COLOR}
        strokeWidth={1.8}
        strokeDasharray={arrow.dashed ? '8 5' : undefined}
        markerEnd={`url(#${markerId})`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 0.4 + index * 0.08, duration: 0.5, ease: 'easeOut' }}
      />

      {/* Traveling data dot — LARGE and visible */}
      <motion.circle
        r={4.5}
        fill="#4CAF50"
        filter={`url(#${glowId})`}
        initial={{ offsetDistance: '0%', opacity: 0 }}
        animate={{
          offsetDistance: ['0%', '100%'],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          delay: 1.2 + index * 0.25,
          duration: 1.8,
          repeat: Infinity,
          repeatDelay: 2 + (index % 3) * 0.8,
          ease: 'easeInOut',
        }}
        style={{ offsetPath: `path('${path}')` } as React.CSSProperties}
      />

      {/* Second traveling dot — staggered for busier feel */}
      <motion.circle
        r={3}
        fill="#66BB6A"
        initial={{ offsetDistance: '0%', opacity: 0 }}
        animate={{
          offsetDistance: ['0%', '100%'],
          opacity: [0, 0.7, 0.7, 0],
        }}
        transition={{
          delay: 2.5 + index * 0.3,
          duration: 2.2,
          repeat: Infinity,
          repeatDelay: 3 + (index % 4) * 0.6,
          ease: 'easeInOut',
        }}
        style={{ offsetPath: `path('${path}')` } as React.CSSProperties}
      />

      {/* Label — LARGER and readable */}
      {arrow.label && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 + index * 0.1 }}
        >
          {/* Label background */}
          <rect
            x={midX - arrow.label.length * 3.5 - 4}
            y={midY + labelOffsetY - 9}
            width={arrow.label.length * 7 + 8}
            height={18}
            rx={2}
            fill="white"
            fillOpacity={0.85}
          />
          <text
            x={midX}
            y={midY + labelOffsetY}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#515151"
            fontSize={12}
            fontWeight={500}
            fontFamily="'Geist Variable', system-ui, sans-serif"
          >
            {arrow.label}
          </text>
        </motion.g>
      )}
    </g>
  );
}
