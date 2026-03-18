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
  buildDiagramScene,
  buildNodeDetailContext,
  getDescriptiveNodes,
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

function buildFlowNodes(scene: DiagramScene): Node<AgentNodeData>[] {
  return scene.nodes.map((node) => ({
    id: node.id,
    type: "agentNode",
    position: { x: node.x, y: node.y },
    data: {
      label: node.label,
      nodeType: node.type,
      w: node.w,
      h: node.h,
    },
    draggable: false,
    selectable: false,
    focusable: false,
  }))
}

function buildFlowEdges(scene: DiagramScene): Edge<AgentEdgeData>[] {
  return scene.arrows.map((arrow) => ({
    id: arrow.id,
    type: "agentEdge",
    source: arrow.from,
    target: arrow.to,
    data: {
      fromPoint: arrow.fromPoint,
      toPoint: arrow.toPoint,
      direction: arrow.direction,
      dashed: Boolean(arrow.dashed),
      edgeLabel: arrow.label,
    },
    selectable: false,
    focusable: false,
  }))
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
            className="pointer-events-auto absolute flex size-6 items-center justify-center rounded-full border bg-background/95 shadow-sm transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            key={node.id}
            onClick={() => setSelectedNodeId(node.id)}
            style={{
              borderColor: isSelected ? colors.text : colors.border,
              color: colors.text,
              left: posX,
              top: posY,
            }}
            type="button"
          >
            <span
              className="size-2 rounded-full"
              style={{ background: colors.text }}
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
    <div className="pointer-events-none absolute top-3 right-3 z-20 flex items-center gap-2">
      <Button
        aria-label="Zoom out"
        className="pointer-events-auto"
        onClick={() => zoomOut({ duration: 160 })}
        size="sm"
        type="button"
        variant="outline"
      >
        -
      </Button>
      <Button
        aria-label="Reset zoom"
        className="pointer-events-auto min-w-[4.5rem]"
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
        size="sm"
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
      {/* Shared arrow marker definition for all custom edges */}
      <svg className="absolute size-0">
        <defs>
          <marker
            id="diagram-arrow-marker"
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
                className="relative overflow-hidden rounded-[1.25rem] border border-border/60 bg-[var(--diagram-surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                style={{
                  height: scene.height,
                  minWidth: scene.width,
                  width: scene.width,
                }}
              >
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
