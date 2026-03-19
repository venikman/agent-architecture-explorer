import { Handle, Position, type Node, type NodeProps } from "@xyflow/react"
import { motion, useReducedMotion } from "motion/react"

import { NODE_COLORS, type NodeType } from "@/data/diagrams"

export interface AgentNodeData {
  [key: string]: unknown
  label: string
  nodeType: NodeType
  w: number
  h: number
  /** Delay in seconds for staggered entrance animation */
  entranceDelay: number
}

type AgentNodeType = Node<AgentNodeData, "agentNode">

function renderLabel(label: string, width: number, height: number, hasIcon: boolean) {
  const lines = label.split("\n")
  const lineHeight = lines.length > 1 ? 18 : 0
  // Shift text right to make room for icon
  const textX = hasIcon ? width / 2 + 10 : width / 2
  const firstLineY = height / 2 - ((lines.length - 1) * lineHeight) / 2

  return lines.map((line, index) => (
    <tspan
      key={`${line}-${index}`}
      x={textX}
      y={firstLineY + index * lineHeight}
    >
      {line}
    </tspan>
  ))
}

const HIDDEN_HANDLE: React.CSSProperties = {
  opacity: 0,
  width: 0,
  height: 0,
  minWidth: 0,
  minHeight: 0,
}

/* ─── Node type icons (18×18 SVG paths) ─── */

function NodeIcon({ type, x, y, color }: { type: NodeType; x: number; y: number; color: string }) {
  const size = 18
  const tx = x - size / 2
  const ty = y - size / 2

  switch (type) {
    case "llm":
      // Brain / AI chip icon
      return (
        <g transform={`translate(${tx}, ${ty})`}>
          <rect x={2} y={2} width={14} height={14} rx={3} fill="none" stroke={color} strokeWidth={1.4} />
          <circle cx={6.5} cy={7} r={1.3} fill={color} />
          <circle cx={11.5} cy={7} r={1.3} fill={color} />
          <path d="M6.5 11.5 Q9 13 11.5 11.5" fill="none" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
          <line x1={0} y1={9} x2={2} y2={9} stroke={color} strokeWidth={1.2} strokeLinecap="round" />
          <line x1={16} y1={9} x2={18} y2={9} stroke={color} strokeWidth={1.2} strokeLinecap="round" />
          <line x1={9} y1={0} x2={9} y2={2} stroke={color} strokeWidth={1.2} strokeLinecap="round" />
        </g>
      )
    case "io":
      // Person / user icon
      return (
        <g transform={`translate(${tx}, ${ty})`}>
          <circle cx={9} cy={5.5} r={3} fill="none" stroke={color} strokeWidth={1.4} />
          <path d="M2.5 16.5 Q2.5 11 9 11 Q15.5 11 15.5 16.5" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
        </g>
      )
    case "tool":
      // Wrench icon
      return (
        <g transform={`translate(${tx}, ${ty})`}>
          <path
            d="M11.5 2.5 Q15.5 2 16 6 L12.5 9.5 Q11 11 9.5 9.5 L6 6 Q5.5 2.5 9.5 2 L11 3.5 Z"
            fill="none"
            stroke={color}
            strokeWidth={1.3}
            strokeLinejoin="round"
          />
          <line x1={8} y1={10} x2={3} y2={15} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
          <line x1={3} y1={13} x2={5} y2={15} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
        </g>
      )
    case "danger":
      // Shield icon
      return (
        <g transform={`translate(${tx}, ${ty})`}>
          <path
            d="M9 1.5 L15.5 4.5 L15.5 9 Q15.5 14 9 17 Q2.5 14 2.5 9 L2.5 4.5 Z"
            fill="none"
            stroke={color}
            strokeWidth={1.4}
            strokeLinejoin="round"
          />
          <line x1={9} y1={7} x2={9} y2={10.5} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <circle cx={9} cy={13} r={0.9} fill={color} />
        </g>
      )
  }
}

function AgentNode({ data }: NodeProps<AgentNodeType>) {
  const { h, label, nodeType, w, entranceDelay } = data
  const reduceMotion = useReducedMotion()
  const colors = NODE_COLORS[nodeType]
  const isIO = nodeType === "io"
  const isLLM = nodeType === "llm"
  const isDanger = nodeType === "danger"
  const rx = isIO ? h / 2 : 14

  // Icon is placed left-of-center inside the node
  const showIcon = w >= 100
  const iconX = showIcon ? 24 : w / 2
  const iconY = h / 2

  const skipMotion = reduceMotion ?? false

  return (
    <>
      <Handle position={Position.Left} style={HIDDEN_HANDLE} type="target" />
      <motion.div
        initial={skipMotion ? false : { opacity: 0, scale: 0.82, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={
          skipMotion
            ? { duration: 0 }
            : {
                duration: 0.45,
                delay: entranceDelay,
                ease: [0.23, 1, 0.32, 1], // custom ease-out
              }
        }
      >
        <svg height={h} style={{ overflow: "visible" }} width={w}>
          <defs>
            {/* Drop shadow filter */}
            <filter id={`shadow-${nodeType}`} x="-12%" y="-12%" width="130%" height="140%">
              <feDropShadow dx={0} dy={2} stdDeviation={3.5} floodColor={colors.border} floodOpacity={0.18} />
            </filter>
          </defs>

          {/* Danger halo — outer dashed ring */}
          {isDanger ? (
            <rect
              fill="none"
              height={h + 14}
              rx={rx + 4}
              stroke={colors.border}
              strokeDasharray="8 5"
              strokeOpacity={0.5}
              strokeWidth={1.25}
              width={w + 14}
              x={-7}
              y={-7}
            />
          ) : null}

          {/* Main node body */}
          <rect
            fill={colors.fill}
            filter={`url(#shadow-${nodeType})`}
            height={h}
            rx={rx}
            stroke={colors.border}
            strokeWidth={1.8}
            width={w}
          />

          {/* LLM accent bar near bottom */}
          {isLLM ? (
            <line
              stroke={colors.text}
              strokeLinecap="round"
              strokeOpacity={0.35}
              strokeWidth={2}
              x1={14}
              x2={Math.max(w - 14, 14)}
              y1={h - 10}
              y2={h - 10}
            />
          ) : null}

          {/* Node icon */}
          {showIcon ? (
            <NodeIcon color={colors.text} type={nodeType} x={iconX} y={iconY} />
          ) : null}

          {/* Label text */}
          <text
            dominantBaseline="middle"
            fill={colors.text}
            fontFamily="'Public Sans Variable', 'Geist Variable', system-ui, sans-serif"
            fontSize={w >= 180 ? 15 : 13}
            fontWeight={600}
            textAnchor="middle"
          >
            {renderLabel(label, w, h, showIcon)}
          </text>
        </svg>
      </motion.div>
      <Handle position={Position.Right} style={HIDDEN_HANDLE} type="source" />
    </>
  )
}

export const nodeTypes = { agentNode: AgentNode } as const
