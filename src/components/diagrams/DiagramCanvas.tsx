import * as React from "react"
import {
  ReactFlow,
  useReactFlow,
  useViewport,
  type Edge,
  type Node,
} from "@xyflow/react"

import {
  NODE_COLORS,
  DATA_FLOW_COLORS,
  buildDiagramScene,
  buildNodeDetailContext,
  getDescriptiveNodes,
  inferDataFlowType,
  type DiagramNode as DiagramNodeData,
  type DiagramScene,
  type DiagramView,
  type HealthcareStage,
} from "@/data/diagrams"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DiagramDetailSheet } from "@/components/diagrams/DiagramDetailSheet"
import {
  nodeTypes,
  type AgentNodeData,
} from "@/components/diagrams/flow-nodes"
import {
  edgeTypes,
  type AgentEdgeData,
} from "@/components/diagrams/flow-edges"
import { useMediaQuery } from "@/hooks/use-media-query"

interface DiagramCanvasProps {
  diagram: DiagramView
  healthcareStage: HealthcareStage
}

/* ─── Scene → React Flow adapter ─── */

/** Base delay before any entrance animation starts */
const ENTRANCE_BASE = 0.08
/** Stagger increment per node (seconds) */
const NODE_STAGGER = 0.06
/** Extra delay for edges — they start after nodes begin appearing */
const EDGE_OFFSET = 0.18

function buildFlowNodes(scene: DiagramScene): Node<AgentNodeData>[] {
  // Sort by x then y to compute left-to-right, top-to-bottom stagger
  const sorted = [...scene.nodes].sort((a, b) => a.x - b.x || a.y - b.y)
  const orderMap = new Map(sorted.map((n, i) => [n.id, i]))

  return scene.nodes.map((node) => ({
    id: node.id,
    type: "agentNode",
    position: { x: node.x, y: node.y },
    data: {
      label: node.label,
      nodeType: node.type,
      w: node.w,
      h: node.h,
      entranceDelay: ENTRANCE_BASE + (orderMap.get(node.id) ?? 0) * NODE_STAGGER,
    },
    draggable: false,
    selectable: false,
    focusable: false,
  }))
}

function buildFlowEdges(scene: DiagramScene): Edge<AgentEdgeData>[] {
  // Build node type lookup for data flow classification
  const nodeTypeMap = new Map(scene.nodes.map((n) => [n.id, n.type]))
  // Sort edges by the source node's x position so they draw left-to-right
  const nodeXMap = new Map(scene.nodes.map((n) => [n.id, n.x]))
  const sorted = [...scene.arrows].sort(
    (a, b) => (nodeXMap.get(a.from) ?? 0) - (nodeXMap.get(b.from) ?? 0)
  )
  const orderMap = new Map(sorted.map((a, i) => [a.id, i]))

  return scene.arrows.map((arrow) => {
    const sourceType = nodeTypeMap.get(arrow.from) ?? "io"
    const targetType = nodeTypeMap.get(arrow.to) ?? "io"
    const dashed = Boolean(arrow.dashed)
    const flowType = inferDataFlowType(sourceType, targetType, dashed)

    return {
      id: arrow.id,
      type: "agentEdge",
      source: arrow.from,
      target: arrow.to,
      data: {
        fromPoint: arrow.fromPoint,
        toPoint: arrow.toPoint,
        direction: arrow.direction,
        dashed,
        edgeLabel: arrow.label,
        entranceDelay:
          ENTRANCE_BASE +
          EDGE_OFFSET +
          (orderMap.get(arrow.id) ?? 0) * NODE_STAGGER,
        flowColor: DATA_FLOW_COLORS[flowType].dot,
      },
      selectable: false,
      focusable: false,
    }
  })
}

/* ─── Marker overlay (viewport-space buttons pinned to nodes) ─── */

function DiagramMarkerOverlay({
  descriptiveNodes,
  selectedNodeId,
  setSelectedNodeId,
}: {
  descriptiveNodes: DiagramNodeData[]
  selectedNodeId: string | null
  setSelectedNodeId: (nodeId: string) => void
}) {
  const { x, y, zoom } = useViewport()

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {descriptiveNodes.map((node) => {
        const colors = NODE_COLORS[node.type]
        const isSelected = selectedNodeId === node.id
        const posX = (node.x + node.w - 14) * zoom + x
        const posY = (node.y - 10) * zoom + y

        return (
          <button
            aria-label={`Select ${node.label.replaceAll("\n", " ")}`}
            className="pointer-events-auto absolute flex size-7 items-center justify-center rounded-full border-2 bg-background/95 shadow-md transition-all hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            key={node.id}
            onClick={() => setSelectedNodeId(node.id)}
            style={{
              borderColor: isSelected ? colors.text : colors.border,
              color: colors.text,
              left: posX,
              top: posY,
              boxShadow: isSelected
                ? `0 0 0 3px ${colors.glow}, 0 2px 8px ${colors.glow}`
                : undefined,
            }}
            type="button"
          >
            {/* Pulse ring animation on non-selected markers */}
            {!isSelected ? (
              <span
                className="absolute inset-0 animate-ping rounded-full opacity-30"
                style={{ background: colors.border, animationDuration: "2.5s" }}
              />
            ) : null}
            <span
              className="relative size-2.5 rounded-full"
              style={{ background: isSelected ? colors.text : colors.border }}
            />
          </button>
        )
      })}
    </div>
  )
}

/* ─── Camera controls ─── */

function DiagramCameraControls() {
  const { zoomIn, zoomOut, fitView, setViewport } = useReactFlow()
  const { zoom } = useViewport()
  const zoomPercent = Math.round(zoom * 100)

  return (
    <div className="pointer-events-none absolute top-3 right-3 z-20 flex items-center gap-1.5">
      <Button
        aria-label="Zoom out"
        className="pointer-events-auto"
        onClick={() => zoomOut({ duration: 160 })}
        size="icon-sm"
        type="button"
        variant="outline"
      >
        -
      </Button>
      <Button
        aria-label="Reset zoom"
        className="pointer-events-auto min-w-[4rem] tabular-nums"
        onClick={() =>
          setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 160 })
        }
        size="sm"
        type="button"
        variant="outline"
      >
        {zoomPercent}%
      </Button>
      <Button
        aria-label="Zoom in"
        className="pointer-events-auto"
        onClick={() => zoomIn({ duration: 160 })}
        size="icon-sm"
        type="button"
        variant="outline"
      >
        +
      </Button>
      <Button
        aria-label="Fit diagram"
        className="pointer-events-auto"
        onClick={() => fitView({ padding: 0.05, duration: 180 })}
        size="sm"
        type="button"
        variant="outline"
      >
        Fit
      </Button>
    </div>
  )
}

/* ─── React Flow surface ─── */

function ReactFlowSurface({
  descriptiveNodes,
  resetKey,
  scene,
  selectedNodeId,
  setSelectedNodeId,
}: {
  descriptiveNodes: DiagramNodeData[]
  resetKey: string
  scene: DiagramScene
  selectedNodeId: string | null
  setSelectedNodeId: (nodeId: string) => void
}) {
  const flowNodes = React.useMemo(() => buildFlowNodes(scene), [scene])
  const flowEdges = React.useMemo(() => buildFlowEdges(scene), [scene])

  return (
    <ReactFlow
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      edgeTypes={edgeTypes}
      edges={flowEdges}
      elementsSelectable={false}
      key={resetKey}
      nodeTypes={nodeTypes}
      nodes={flowNodes}
      nodesConnectable={false}
      nodesDraggable={false}
      panOnDrag
      panOnScroll
      preventScrolling
      proOptions={{ hideAttribution: true }}
      zoomOnPinch
      zoomOnScroll
    >
      {/* Shared SVG defs: arrow marker + dot grid pattern */}
      <svg className="absolute size-0">
        <defs>
          {/* Arrow marker — slightly larger, filled triangle */}
          <marker
            id="diagram-arrow-marker"
            markerHeight="10"
            markerUnits="userSpaceOnUse"
            markerWidth="10"
            orient="auto"
            refX="8"
            refY="4"
          >
            <path d="M 1 0.5 L 9 4 L 1 7.5 Q 2.5 4 1 0.5 Z" fill="var(--diagram-arrow)" />
          </marker>
          {/* Dot grid pattern */}
          <pattern id="diagram-dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.7" fill="var(--diagram-dot-muted)" />
          </pattern>
        </defs>
      </svg>
      <DiagramMarkerOverlay
        descriptiveNodes={descriptiveNodes}
        selectedNodeId={selectedNodeId}
        setSelectedNodeId={setSelectedNodeId}
      />
      <DiagramCameraControls />
    </ReactFlow>
  )
}

/* ─── Public component ─── */

export function DiagramCanvas({
  diagram,
  healthcareStage,
}: DiagramCanvasProps) {
  const scene = React.useMemo(
    () => buildDiagramScene(diagram, healthcareStage),
    [diagram, healthcareStage]
  )
  const descriptiveNodes = React.useMemo(
    () => getDescriptiveNodes(scene),
    [scene]
  )
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(
    null
  )
  const isMobile = useMediaQuery("(max-width: 1023px)")

  const selectedNode = React.useMemo(
    () => scene.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [scene.nodes, selectedNodeId]
  )
  const selectedNodeContext = React.useMemo(
    () =>
      selectedNodeId ? buildNodeDetailContext(scene, selectedNodeId) : null,
    [scene, selectedNodeId]
  )

  React.useEffect(() => {
    setSelectedNodeId(null)
  }, [diagram.id])

  React.useEffect(() => {
    if (!selectedNodeId) return
    if (!scene.nodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(null)
    }
  }, [scene.nodes, selectedNodeId])

  return (
    <div className="flex flex-col gap-4">
      <Card className="border border-border/70 bg-card/40">
        <CardContent className="p-0">
          <div className="overflow-auto">
            <div className="flex min-w-fit justify-center px-3 py-4 sm:px-6 sm:py-6">
              <div
                className="relative overflow-hidden rounded-2xl border border-border/50"
                style={{
                  height: scene.height,
                  minWidth: scene.width,
                  width: scene.width,
                  background: "var(--diagram-surface)",
                }}
              >
                {/* Dot grid overlay */}
                <svg className="pointer-events-none absolute inset-0 size-full">
                  <rect width="100%" height="100%" fill="url(#diagram-dot-grid)" />
                </svg>
                <ReactFlowSurface
                  descriptiveNodes={descriptiveNodes}
                  resetKey={diagram.id}
                  scene={scene}
                  selectedNodeId={selectedNodeId}
                  setSelectedNodeId={setSelectedNodeId}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="ui-detail-copy p-0">{scene.note}</CardContent>
      </Card>

      {isMobile ? (
        <Card size="sm">
          <CardHeader className="gap-2">
            <CardTitle>Pattern Notes</CardTitle>
            <CardDescription>
              Text-first fallback for smaller screens and keyboard users.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {descriptiveNodes.map((node) => (
              <div className="flex flex-col gap-1" key={node.id}>
                <div className="flex items-center gap-2">
                  <Badge
                    className="w-fit"
                    style={{
                      background: "transparent",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                    variant="outline"
                  >
                    {node.label}
                  </Badge>
                </div>
                <p className="text-sm/7 text-muted-foreground">
                  {node.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <DiagramDetailSheet
        context={selectedNodeContext}
        node={selectedNode}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedNodeId(null)
          }
        }}
      />
    </div>
  )
}
