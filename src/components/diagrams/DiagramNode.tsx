import { motion } from 'motion/react';
import { NODE_COLORS, type DiagramNode as NodeData } from '@/data/diagrams';

interface Props {
  node: NodeData;
  index: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function DiagramNode({ node, index, isSelected, onClick }: Props) {
  const colors = NODE_COLORS[node.type];
  const w = node.w ?? 150;
  const h = node.h ?? 70;
  const isIO = node.type === 'io';
  const isDanger = node.type === 'danger';
  const isLLM = node.type === 'llm';

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onClick}
      className="cursor-pointer"
    >
      {/* Ambient glow behind node */}
      <motion.rect
        x={node.x - 6}
        y={node.y - 6}
        width={w + 12}
        height={h + 12}
        rx={isIO ? (h + 12) / 2 : 3}
        fill={colors.glow}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, delay: index * 0.4 }}
      />

      {/* Danger pulse ring */}
      {isDanger && (
        <motion.rect
          x={node.x - 4}
          y={node.y - 4}
          width={w + 8}
          height={h + 8}
          rx={2}
          fill="none"
          stroke={colors.border}
          strokeWidth={1.5}
          animate={{ opacity: [0.7, 0, 0.7], scale: [1, 1.04, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{ transformOrigin: `${node.x + w / 2}px ${node.y + h / 2}px` }}
        />
      )}

      {/* LLM breathing effect */}
      {isLLM && (
        <motion.rect
          x={node.x - 3}
          y={node.y - 3}
          width={w + 6}
          height={h + 6}
          rx={2}
          fill="none"
          stroke={colors.border}
          strokeWidth={1}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, delay: index * 0.3 }}
        />
      )}

      {/* Selection highlight */}
      {isSelected && (
        <rect
          x={node.x - 5}
          y={node.y - 5}
          width={w + 10}
          height={h + 10}
          rx={isIO ? (h + 10) / 2 : 2}
          fill="none"
          stroke={colors.text}
          strokeWidth={2.5}
          strokeDasharray="6 3"
        />
      )}

      {/* Main shape */}
      <rect
        x={node.x}
        y={node.y}
        width={w}
        height={h}
        rx={isIO ? h / 2 : 2}
        fill={colors.fill}
        stroke={colors.border}
        strokeWidth={1.5}
      />

      {/* Inner activity indicator for LLM nodes */}
      {isLLM && (
        <motion.rect
          x={node.x + 4}
          y={node.y + h - 6}
          height={2}
          rx={1}
          fill={colors.text}
          animate={{ width: [0, w - 8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
        />
      )}

      {/* Label — LARGE readable text */}
      <text
        x={node.x + w / 2}
        y={node.y + h / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={colors.text}
        fontSize={w > 150 ? 17 : w > 100 ? 15 : 14}
        fontWeight={600}
        fontFamily="'Geist Variable', system-ui, sans-serif"
      >
        {node.label}
      </text>

      {/* Clickable indicator dot */}
      {node.description && (
        <motion.circle
          cx={node.x + w - 8}
          cy={node.y + 8}
          r={3}
          fill={colors.text}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.g>
  );
}
