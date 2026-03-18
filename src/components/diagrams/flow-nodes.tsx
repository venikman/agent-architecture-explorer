import { Handle, Position, type Node, type NodeProps } from "@xyflow/react"

import { NODE_COLORS, type NodeType } from "@/data/diagrams"

export interface AgentNodeData {
  [key: string]: unknown
  label: string
  nodeType: NodeType
  w: number
  h: number
}

type AgentNodeType = Node<AgentNodeData, "agentNode">

function renderLabel(label: string, width: number, height: number) {
  const lines = label.split("\n")
  const lineHeight = lines.length > 1 ? 18 : 0
  const firstLineY = height / 2 - ((lines.length - 1) * lineHeight) / 2

  return lines.map((line, index) => (
    <tspan
      key={`${line}-${index}`}
      x={width / 2}
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

function AgentNode({ data }: NodeProps<AgentNodeType>) {
  const { h, label, nodeType, w } = data
  const colors = NODE_COLORS[nodeType]
  const isIO = nodeType === "io"
  const isLLM = nodeType === "llm"
  const isDanger = nodeType === "danger"

  return (
    <>
      <Handle position={Position.Left} style={HIDDEN_HANDLE} type="target" />
      <svg height={h} style={{ overflow: "visible" }} width={w}>
        {isDanger ? (
          <rect
            fill="none"
            height={h + 12}
            rx={isIO ? (h + 12) / 2 : 18}
            stroke={colors.border}
            strokeDasharray="8 5"
            strokeWidth={1.25}
            width={w + 12}
            x={-6}
            y={-6}
          />
        ) : null}

        <rect
          fill={colors.fill}
          height={h}
          rx={isIO ? h / 2 : 18}
          stroke={colors.border}
          strokeWidth={1.5}
          width={w}
        />

        {isLLM ? (
          <line
            stroke={colors.text}
            strokeLinecap="round"
            strokeWidth={2}
            x1={14}
            x2={Math.max(w - 14, 14)}
            y1={h - 12}
            y2={h - 12}
          />
        ) : null}

        <text
          dominantBaseline="middle"
          fill={colors.text}
          fontFamily="'Geist Variable', system-ui, sans-serif"
          fontSize={w >= 180 ? 16 : 14}
          fontWeight={600}
          textAnchor="middle"
        >
          {renderLabel(label, w, h)}
        </text>
      </svg>
      <Handle position={Position.Right} style={HIDDEN_HANDLE} type="source" />
    </>
  )
}

export const nodeTypes = { agentNode: AgentNode } as const
