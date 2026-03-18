import {
  BaseBoxShapeUtil,
  Rectangle2d,
  SVGContainer,
  T,
  type RecordProps,
  type TLBaseShape,
} from "tldraw"

import { NODE_COLORS, type NodeType } from "@/data/diagrams"
import {
  buildCurvedPath,
  getEdgeLabelPoint,
} from "@/components/diagrams/diagram-geometry"

export const AGENT_NODE_SHAPE_TYPE = "agent-node"
export const AGENT_EDGE_SHAPE_TYPE = "agent-edge"

interface AgentNodeShapeProps {
  w: number
  h: number
  label: string
  nodeType: string
  isInteractive: boolean
}

interface AgentEdgeShapeProps {
  w: number
  h: number
  startX: number
  startY: number
  endX: number
  endY: number
  dashed: boolean
  label?: string
  direction: string
}

declare module "@tldraw/tlschema" {
  interface TLGlobalShapePropsMap {
    [AGENT_NODE_SHAPE_TYPE]: AgentNodeShapeProps
    [AGENT_EDGE_SHAPE_TYPE]: AgentEdgeShapeProps
  }
}

export type AgentNodeShape = TLBaseShape<
  typeof AGENT_NODE_SHAPE_TYPE,
  AgentNodeShapeProps
>

export type AgentEdgeShape = TLBaseShape<
  typeof AGENT_EDGE_SHAPE_TYPE,
  AgentEdgeShapeProps
>

function interpolateNumber(start: number, end: number, progress: number) {
  return start + (end - start) * progress
}

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

export class AgentNodeShapeUtil extends BaseBoxShapeUtil<AgentNodeShape> {
  static override type = AGENT_NODE_SHAPE_TYPE
  static override props: RecordProps<AgentNodeShape> = {
    w: T.number,
    h: T.number,
    label: T.string,
    nodeType: T.string,
    isInteractive: T.boolean,
  }

  override canBind() {
    return false
  }

  override canEdit() {
    return false
  }

  override canResize() {
    return false
  }

  override hideSelectionBoundsFg() {
    return true
  }

  override getDefaultProps(): AgentNodeShape["props"] {
    return {
      w: 210,
      h: 104,
      label: "Node",
      nodeType: "tool",
      isInteractive: false,
    }
  }

  component(shape: AgentNodeShape) {
    const { h, isInteractive, label, w } = shape.props
    const nodeType = shape.props.nodeType as NodeType
    const colors = NODE_COLORS[nodeType]
    const isIO = nodeType === "io"
    const isLLM = nodeType === "llm"
    const isDanger = nodeType === "danger"

    return (
      <SVGContainer>
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

        {isInteractive ? (
          <circle cx={w - 14} cy={14} fill={colors.text} r={4} />
        ) : null}
      </SVGContainer>
    )
  }

  indicator(shape: AgentNodeShape) {
    const { h, w } = shape.props
    const nodeType = shape.props.nodeType as NodeType
    const isIO = nodeType === "io"

    return <rect height={h} rx={isIO ? h / 2 : 18} width={w} x={0} y={0} />
  }
}

export class AgentEdgeShapeUtil extends BaseBoxShapeUtil<AgentEdgeShape> {
  static override type = AGENT_EDGE_SHAPE_TYPE
  static override props: RecordProps<AgentEdgeShape> = {
    w: T.number,
    h: T.number,
    startX: T.number,
    startY: T.number,
    endX: T.number,
    endY: T.number,
    dashed: T.boolean,
    label: T.string.optional(),
    direction: T.string,
  }

  override canBind() {
    return false
  }

  override canEdit() {
    return false
  }

  override canResize() {
    return false
  }

  override hideSelectionBoundsFg() {
    return true
  }

  override getDefaultProps(): AgentEdgeShape["props"] {
    return {
      w: 100,
      h: 100,
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 100,
      dashed: false,
      label: undefined,
      direction: "horizontal",
    }
  }

  override getInterpolatedProps(
    startShape: AgentEdgeShape,
    endShape: AgentEdgeShape,
    progress: number
  ): AgentEdgeShape["props"] {
    return {
      ...endShape.props,
      w: interpolateNumber(startShape.props.w, endShape.props.w, progress),
      h: interpolateNumber(startShape.props.h, endShape.props.h, progress),
      startX: interpolateNumber(
        startShape.props.startX,
        endShape.props.startX,
        progress
      ),
      startY: interpolateNumber(
        startShape.props.startY,
        endShape.props.startY,
        progress
      ),
      endX: interpolateNumber(
        startShape.props.endX,
        endShape.props.endX,
        progress
      ),
      endY: interpolateNumber(
        startShape.props.endY,
        endShape.props.endY,
        progress
      ),
    }
  }

  override getGeometry(shape: AgentEdgeShape) {
    return new Rectangle2d({
      width: Math.max(shape.props.w, 1),
      height: Math.max(shape.props.h, 1),
      isFilled: false,
    })
  }

  component(shape: AgentEdgeShape) {
    const { dashed, endX, endY, label, startX, startY } = shape.props
    const direction = shape.props.direction as "horizontal" | "vertical"
    const path = buildCurvedPath({
      startX,
      startY,
      endX,
      endY,
      direction,
    })
    const labelPoint = getEdgeLabelPoint({
      startX,
      startY,
      endX,
      endY,
    })
    const markerId = `${shape.id}-arrow`

    return (
      <SVGContainer>
        <defs>
          <marker
            id={markerId}
            markerHeight="8"
            markerUnits="userSpaceOnUse"
            markerWidth="8"
            orient="auto"
            refX="7"
            refY="3"
          >
            <path d="M 0 0 L 8 3 L 0 6 z" fill="var(--diagram-arrow)" />
          </marker>
        </defs>
        <path
          d={path}
          fill="none"
          markerEnd={`url(#${markerId})`}
          stroke="var(--diagram-arrow)"
          strokeDasharray={dashed ? "7 5" : undefined}
          strokeLinecap="round"
          strokeWidth={1.6}
        />
        {label ? (
          <text
            fill="var(--diagram-arrow)"
            fontFamily="'Geist Variable', system-ui, sans-serif"
            fontSize={11}
            fontWeight={600}
            textAnchor="middle"
            x={labelPoint.x}
            y={labelPoint.y - 8}
          >
            {label}
          </text>
        ) : null}
      </SVGContainer>
    )
  }

  indicator(shape: AgentEdgeShape) {
    const { endX, endY, startX, startY } = shape.props
    const direction = shape.props.direction as "horizontal" | "vertical"

    return (
      <path
        d={buildCurvedPath({
          startX,
          startY,
          endX,
          endY,
          direction,
        })}
      />
    )
  }
}

export const agentShapeUtils = [AgentNodeShapeUtil, AgentEdgeShapeUtil] as const
