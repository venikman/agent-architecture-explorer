import * as React from "react"
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
  /** Delay in seconds for draw-in entrance animation */
  entranceDelay: number
  /** CSS color for the flowing dot, derived from data flow type */
  flowColor: string
}

type AgentEdgeType = Edge<AgentEdgeData, "agentEdge">

const TRANSITION_DURATION = 0.35

/**
 * Unique id counter to ensure each flowing-dot animation gets
 * its own id for the SVG <animate> element, avoiding conflicts.
 */
let flowIdCounter = 0

function AgentEdge({ data, id }: EdgeProps<AgentEdgeType>) {
  const reduceMotion = useReducedMotion()
  const flowId = React.useMemo(() => `flow-${id}-${++flowIdCounter}`, [id])

  if (!data) return null

  const skipMotion = reduceMotion ?? false

  const morphTransition = skipMotion
    ? { duration: 0 }
    : {
        type: "tween" as const,
        duration: TRANSITION_DURATION,
        ease: "easeInOut" as const,
      }

  const {
    dashed,
    direction,
    edgeLabel,
    fromPoint,
    toPoint,
    entranceDelay,
    flowColor,
  } = data

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

  // Draw-in animation: stroke-dashoffset from full length → 0
  const drawTransition = skipMotion
    ? { duration: 0 }
    : {
        duration: 0.5,
        delay: entranceDelay,
        ease: [0.33, 1, 0.68, 1] as const, // ease-out-cubic
      }

  // Compute flow speed based on path length — longer paths take longer
  const dx = toPoint.x - fromPoint.x
  const dy = toPoint.y - fromPoint.y
  const approxLength = Math.sqrt(dx * dx + dy * dy)
  const flowDuration = Math.max(1.8, Math.min(approxLength / 80, 4))

  return (
    <g>
      {/* Invisible wider hit area */}
      <motion.path
        animate={{ d: path }}
        fill="none"
        initial={false}
        stroke="transparent"
        strokeWidth={12}
        transition={morphTransition}
      />

      {/* Visible edge with draw-in entrance */}
      <motion.path
        animate={{ d: path, pathLength: 1, opacity: 1 }}
        fill="none"
        id={flowId}
        initial={skipMotion ? false : { pathLength: 0, opacity: 0.3 }}
        markerEnd="url(#diagram-arrow-marker)"
        stroke="var(--diagram-arrow)"
        strokeDasharray={dashed ? "7 5" : undefined}
        strokeLinecap="round"
        strokeWidth={1.8}
        transition={drawTransition}
      />

      {/* Flowing data dot — color-coded by data flow type */}
      {!skipMotion ? (
        <circle r={3} fill={flowColor} opacity={0.65}>
          <animateMotion
            begin={`${entranceDelay + 0.6}s`}
            dur={`${flowDuration}s`}
            path={path}
            repeatCount="indefinite"
          />
          {/* Pulse the dot size gently */}
          <animate
            attributeName="r"
            begin={`${entranceDelay + 0.6}s`}
            dur="1.2s"
            repeatCount="indefinite"
            values="2.5;3.5;2.5"
          />
          <animate
            attributeName="opacity"
            begin={`${entranceDelay + 0.6}s`}
            dur={`${flowDuration}s`}
            repeatCount="indefinite"
            values="0;0.6;0.5;0.6;0"
          />
        </circle>
      ) : null}

      {edgeLabel && labelPoint ? (
        <motion.g
          initial={skipMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={
            skipMotion
              ? { duration: 0 }
              : { duration: 0.3, delay: entranceDelay + 0.35 }
          }
        >
          {/* Label background pill */}
          <motion.rect
            animate={{
              x: labelPoint.x - edgeLabel.length * 3.5 - 6,
              y: labelPoint.y - 18,
            }}
            fill="var(--diagram-surface, oklch(0.99 0 0))"
            height={16}
            initial={false}
            rx={4}
            transition={morphTransition}
            width={edgeLabel.length * 7 + 12}
          />
          <motion.text
            animate={{ x: labelPoint.x, y: labelPoint.y - 8 }}
            fill="var(--diagram-arrow)"
            fontFamily="'DM Sans', system-ui, sans-serif"
            fontSize={11}
            fontWeight={600}
            initial={false}
            textAnchor="middle"
            transition={morphTransition}
          >
            {edgeLabel}
          </motion.text>
        </motion.g>
      ) : null}
    </g>
  )
}

export const edgeTypes = { agentEdge: AgentEdge } as const
