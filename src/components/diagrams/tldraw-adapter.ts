import { createShapeId } from "tldraw"

import { type DiagramScene } from "@/data/diagrams"
import {
  AGENT_EDGE_SHAPE_TYPE,
  AGENT_NODE_SHAPE_TYPE,
  type AgentEdgeShape,
  type AgentNodeShape,
} from "@/components/diagrams/tldraw-shapes"

export function getCanvasNodeShapeId(diagramId: string, nodeId: string) {
  return createShapeId(`${diagramId}:node:${nodeId}`)
}

function getCanvasEdgeShapeId(diagramId: string, edgeId: string) {
  return createShapeId(`${diagramId}:edge:${edgeId}`)
}

export type DiagramCanvasShapeRecord =
  | Pick<AgentNodeShape, "id" | "type" | "x" | "y" | "props">
  | Pick<AgentEdgeShape, "id" | "type" | "x" | "y" | "props">

export function buildCanvasShapes(
  scene: DiagramScene
): DiagramCanvasShapeRecord[] {
  const nodeShapes = scene.nodes.map<DiagramCanvasShapeRecord>((node) => ({
    id: getCanvasNodeShapeId(scene.id, node.id),
    type: AGENT_NODE_SHAPE_TYPE,
    x: node.x,
    y: node.y,
    props: {
      w: node.w,
      h: node.h,
      label: node.label,
      nodeType: node.type,
      isInteractive: Boolean(node.description),
    },
  }))

  const edgeShapes = scene.arrows.map<DiagramCanvasShapeRecord>((arrow) => {
    const padding = 28
    const x = Math.min(arrow.fromPoint.x, arrow.toPoint.x) - padding
    const y = Math.min(arrow.fromPoint.y, arrow.toPoint.y) - padding
    const w =
      Math.max(Math.abs(arrow.toPoint.x - arrow.fromPoint.x), 1) + padding * 2
    const h =
      Math.max(Math.abs(arrow.toPoint.y - arrow.fromPoint.y), 1) + padding * 2

    return {
      id: getCanvasEdgeShapeId(scene.id, arrow.id),
      type: AGENT_EDGE_SHAPE_TYPE,
      x,
      y,
      props: {
        w,
        h,
        startX: arrow.fromPoint.x - x,
        startY: arrow.fromPoint.y - y,
        endX: arrow.toPoint.x - x,
        endY: arrow.toPoint.y - y,
        dashed: Boolean(arrow.dashed),
        label: arrow.label,
        direction: arrow.direction,
      },
    }
  })

  return [...edgeShapes, ...nodeShapes]
}
