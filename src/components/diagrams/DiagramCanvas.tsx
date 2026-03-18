import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DiagramNode } from './DiagramNode';
import { DiagramArrow } from './DiagramArrow';
import type { DiagramView, DiagramNode as NodeData } from '@/data/diagrams';

interface Props {
  diagram: DiagramView;
  healthcareMode: boolean;
}

function DetailPanel({ node, onClose }: { node: NodeData; onClose: () => void }) {
  const typeLabels = { llm: 'LLM Component', io: 'Input / Output', tool: 'Tool / Utility', danger: 'Non-Negotiable' };
  const typeColors = {
    llm: { bg: '#E6F4E6', text: '#2E7D32' },
    io: { bg: '#FDE8E4', text: '#C65D3E' },
    tool: { bg: '#E8E8F8', text: '#5050A0' },
    danger: { bg: '#FFEBEE', text: '#C62828' },
  };
  const c = typeColors[node.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="absolute top-4 right-4 w-80 bg-card border border-border shadow-lg z-10"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5" style={{ background: c.text }} />
          <span className="text-xs font-medium" style={{ color: c.text }}>
            {typeLabels[node.type]}
          </span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm cursor-pointer leading-none">
          ✕
        </button>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-2">{node.label}</h3>
        {node.description && (
          <p className="text-[13px] text-muted-foreground leading-relaxed">{node.description}</p>
        )}
        {node.type === 'danger' && (
          <div className="mt-3 p-2.5 text-[12px] font-medium" style={{ background: c.bg, color: c.text }}>
            This component is legally or architecturally required for healthcare deployment.
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function DiagramCanvas({ diagram, healthcareMode }: Props) {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);

  const allNodes = healthcareMode && diagram.healthcareNodes
    ? [...diagram.nodes, ...diagram.healthcareNodes]
    : diagram.nodes;

  const maxX = Math.max(...allNodes.map(n => n.x + (n.w ?? 150))) + 50;
  const maxY = Math.max(...allNodes.map(n => n.y + (n.h ?? 70))) + 50;

  const baseNodeCount = diagram.nodes.length;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <svg
        key={`${diagram.id}-${healthcareMode}`}
        viewBox={`0 0 ${maxX} ${maxY}`}
        className="w-full max-w-5xl"
        style={{ maxHeight: 'calc(100vh - 240px)' }}
      >
        {/* Base arrows */}
        {diagram.arrows.map((arrow, i) => (
          <DiagramArrow key={`${arrow.from}-${arrow.to}`} arrow={arrow} nodes={allNodes} index={i} />
        ))}

        {/* Healthcare separator line */}
        {healthcareMode && diagram.healthcareNodes && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <line
              x1={20}
              y1={390}
              x2={maxX - 20}
              y2={390}
              stroke="#EF9A9A"
              strokeWidth={1}
              strokeDasharray="6 4"
            />
            <text
              x={maxX / 2}
              y={382}
              textAnchor="middle"
              fill="#C62828"
              fontSize={11}
              fontWeight={600}
              fontFamily="'Geist Variable', system-ui, sans-serif"
            >
              HEALTHCARE NON-NEGOTIABLES
            </text>
          </motion.g>
        )}

        {/* Healthcare overlay arrows */}
        {healthcareMode && diagram.healthcareArrows?.map((arrow, i) => (
          <DiagramArrow
            key={`hc-${arrow.from}-${arrow.to}`}
            arrow={arrow}
            nodes={allNodes}
            index={diagram.arrows.length + i}
          />
        ))}

        {/* Base nodes */}
        {diagram.nodes.map((node, i) => (
          <DiagramNode
            key={node.id}
            node={node}
            index={i}
            isSelected={selectedNode?.id === node.id}
            onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
          />
        ))}

        {/* Healthcare overlay nodes */}
        {healthcareMode && diagram.healthcareNodes?.map((node, i) => (
          <DiagramNode
            key={`hc-${node.id}`}
            node={node}
            index={baseNodeCount + i}
            isSelected={selectedNode?.id === node.id}
            onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
          />
        ))}
      </svg>

      {/* Healthcare annotation */}
      {healthcareMode && diagram.healthcareNote && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-4 max-w-2xl text-center px-4 py-2.5 border border-destructive/20 bg-destructive/5"
        >
          <span className="text-[12px] text-destructive/80 font-medium">{diagram.healthcareNote}</span>
        </motion.div>
      )}

      {/* Detail panel */}
      <AnimatePresence>
        {selectedNode?.description && (
          <DetailPanel
            key={selectedNode.id}
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
