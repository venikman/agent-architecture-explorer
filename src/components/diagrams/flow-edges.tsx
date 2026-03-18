import { type Edge, type EdgeProps } from "@xyflow/react"
import { motion, useReducedMotion } from "motion/react"

import {
  buildCurvedPath,
  getEdgeLabelPoint,
} from "@/components/diagrams/diagram-geometry"

export interface AgentEdgeData {
  [key: string]: unknown
  fromPoint: { x: number; y: number }
  toPoint: { x: number; y: number }
  direction: "horizontal" | "vertical"
  dashed: boolean
  edgeLabel?: string
}

type AgentEdgeType = Edge<AgentEdgeData, "agentEdge">

const TRANSITION_DURATION = 0.35

function AgentEdge({ data }: EdgeProps<AgentEdgeType>) {
  const reduceMotion = useReducedMotion()

  if (!data) return null

  const transition = reduceMotion
    ? { duration: 0 }
    : {
        type: "tween" as const,
        duration: TRANSITION_DURATION,
        ease: "easeInOut" as const,
      }

  const { dashed, direction, edgeLabel, fromPoint, toPoint } = data

  const path = buildCurvedPath({
    startX: fromPoint.x,
    startY: fromPoint.y,
    endX: toPoint.x,
    endY: toPoint.y,
    direction,
  })

  const labelPoint = edgeLabel
    ? getEdgeLabelPoint({
        startX: fromPoint.x,
        startY: fromPoint.y,
        endX: toPoint.x,
        endY: toPoint.y,
      })
    : null

  return (
    <g>
      <motion.path
        animate={{ d: path }}
        fill="none"
        initial={false}
        markerEnd="url(#diagram-arrow-marker)"
        stroke="var(--diagram-arrow)"
        strokeDasharray={dashed ? "7 5" : undefined}
        strokeLinecap="round"
        strokeWidth={1.6}
        transition={transition}
      />
      {edgeLabel && labelPoint ? (
        <motion.text
          animate={{ x: labelPoint.x, y: labelPoint.y - 8 }}
          fill="var(--diagram-arrow)"
          fontFamily="'Geist Variable', system-ui, sans-serif"
          fontSize={11}
          fontWeight={600}
          initial={false}
          textAnchor="middle"
          transition={transition}
        >
          {edgeLabel}
        </motion.text>
      ) : null}
    </g>
  )
}

export const edgeTypes = { agentEdge: AgentEdge } as const
