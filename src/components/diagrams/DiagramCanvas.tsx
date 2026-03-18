import * as React from "react"
import { createTLStore, Tldraw, useEditor, useValue, type Editor } from "tldraw"
import { useReducedMotion } from "motion/react"

import {
  NODE_COLORS,
  buildDiagramScene,
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
import { buildCurvedPath } from "@/components/diagrams/diagram-geometry"
import {
  buildCanvasShapes,
  type DiagramCanvasShapeRecord,
} from "@/components/diagrams/tldraw-adapter"
import { agentShapeUtils } from "@/components/diagrams/tldraw-shapes"
import { useMediaQuery } from "@/hooks/use-media-query"

interface DiagramCanvasProps {
  diagram: DiagramView
  healthcareStage: HealthcareStage
}

function renderStaticLabel(node: DiagramNodeData) {
  const lines = node.label.split("\n")
  const lineHeight = lines.length > 1 ? 18 : 0
  const firstLineY = node.y + node.h / 2 - ((lines.length - 1) * lineHeight) / 2

  return lines.map((line, index) => (
    <tspan
      key={`${node.id}-${line}-${index}`}
      x={node.x + node.w / 2}
      y={firstLineY + index * lineHeight}
    >
      {line}
    </tspan>
  ))
}

function StaticDiagramSurface({ scene }: { scene: DiagramScene }) {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 block"
      height={scene.height}
      viewBox={`0 0 ${scene.width} ${scene.height}`}
      width={scene.width}
    >
      <defs>
        {scene.arrows.map((arrow) => (
          <marker
            id={`static-arrow-${arrow.id}`}
            key={arrow.id}
            markerHeight="8"
            markerUnits="userSpaceOnUse"
            markerWidth="8"
            orient="auto"
            refX="7"
            refY="3"
          >
            <path d="M 0 0 L 8 3 L 0 6 z" fill="var(--diagram-arrow)" />
          </marker>
        ))}
      </defs>

      {scene.arrows.map((arrow) => {
        const path = buildCurvedPath({
          startX: arrow.fromPoint.x,
          startY: arrow.fromPoint.y,
          endX: arrow.toPoint.x,
          endY: arrow.toPoint.y,
          direction: arrow.direction,
        })

        return (
          <path
            d={path}
            fill="none"
            key={arrow.id}
            markerEnd={`url(#static-arrow-${arrow.id})`}
            stroke="var(--diagram-arrow)"
            strokeDasharray={arrow.dashed ? "7 5" : undefined}
            strokeLinecap="round"
            strokeWidth={1.6}
          />
        )
      })}

      {scene.nodes.map((node) => {
        const colors = NODE_COLORS[node.type]
        const isIO = node.type === "io"
        const isLLM = node.type === "llm"
        const isDanger = node.type === "danger"

        return (
          <g key={node.id}>
            {isDanger ? (
              <rect
                fill="none"
                height={node.h + 12}
                rx={isIO ? (node.h + 12) / 2 : 18}
                stroke={colors.border}
                strokeDasharray="8 5"
                strokeWidth={1.25}
                width={node.w + 12}
                x={node.x - 6}
                y={node.y - 6}
              />
            ) : null}

            <rect
              fill={colors.fill}
              height={node.h}
              rx={isIO ? node.h / 2 : 18}
              stroke={colors.border}
              strokeWidth={1.5}
              width={node.w}
              x={node.x}
              y={node.y}
            />

            {isLLM ? (
              <line
                stroke={colors.text}
                strokeLinecap="round"
                strokeWidth={2}
                x1={node.x + 14}
                x2={node.x + Math.max(node.w - 14, 14)}
                y1={node.y + node.h - 12}
                y2={node.y + node.h - 12}
              />
            ) : null}

            <text
              dominantBaseline="middle"
              fill={colors.text}
              fontFamily="'Geist Variable', system-ui, sans-serif"
              fontSize={node.w >= 180 ? 16 : 14}
              fontWeight={600}
              textAnchor="middle"
            >
              {renderStaticLabel(node)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function StaticDiagramMarkerOverlay({
  descriptiveNodes,
  selectedNodeId,
  setSelectedNodeId,
}: {
  descriptiveNodes: DiagramNodeData[]
  selectedNodeId: string | null
  setSelectedNodeId: (nodeId: string) => void
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {descriptiveNodes.map((node) => {
        const colors = NODE_COLORS[node.type]
        const isSelected = selectedNodeId === node.id

        return (
          <button
            aria-label={`Select ${node.label.replaceAll("\n", " ")}`}
            className="pointer-events-auto absolute flex size-6 items-center justify-center rounded-full border bg-background/95 shadow-sm transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            key={node.id}
            onClick={() => setSelectedNodeId(node.id)}
            style={{
              borderColor: isSelected ? colors.text : colors.border,
              color: colors.text,
              left: node.x + node.w - 14,
              top: node.y - 10,
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

function ReadOnlyTldrawSurface({
  descriptiveNodes,
  shapeRecords,
  selectedNodeId,
  setSelectedNodeId,
}: {
  descriptiveNodes: DiagramNodeData[]
  shapeRecords: DiagramCanvasShapeRecord[]
  selectedNodeId: string | null
  setSelectedNodeId: (nodeId: string) => void
}) {
  const reduceMotion = useReducedMotion()
  const editorRef = React.useRef<Editor | null>(null)
  const renderedShapeIdsRef = React.useRef<Set<DiagramCanvasShapeRecord["id"]>>(
    new Set()
  )

  const syncEditorScene = React.useCallback(
    (editor: Editor) => {
      const nextShapeIds = new Set(shapeRecords.map((shape) => shape.id))
      const currentShapeIds = renderedShapeIdsRef.current
      const existingShapeIds = new Set(currentShapeIds)
      const createQueue: DiagramCanvasShapeRecord[] = []
      const updateQueue: DiagramCanvasShapeRecord[] = []

      for (const shape of shapeRecords) {
        if (existingShapeIds.has(shape.id)) {
          updateQueue.push(shape)
        } else {
          createQueue.push(shape)
        }
      }

      const deleteQueue = [...existingShapeIds].filter(
        (shapeId) => !nextShapeIds.has(shapeId)
      )

      editor.setCameraOptions({ isLocked: false })
      editor.user.updateUserPreferences({
        animationSpeed: reduceMotion ? 0 : 1,
      })
      editor.updateInstanceState({ isReadonly: false })

      if (createQueue.length > 0) {
        editor.createShapes(createQueue)
      }

      if (updateQueue.length > 0) {
        editor.updateShapes(updateQueue)
      }

      if (deleteQueue.length > 0) {
        editor.deleteShapes(deleteQueue)
      }

      editor.setCamera(
        { x: 0, y: 0, z: 1 },
        { animation: { duration: reduceMotion ? 0 : 240 } }
      )
      editor.updateInstanceState({ isReadonly: true })
      editor.setCurrentTool("hand")
      renderedShapeIdsRef.current = nextShapeIds
    },
    [reduceMotion, shapeRecords]
  )

  const handleMount = React.useCallback(
    (editor: Editor) => {
      editorRef.current = editor
      syncEditorScene(editor)
    },
    [syncEditorScene]
  )

  React.useEffect(() => {
    if (editorRef.current) {
      syncEditorScene(editorRef.current)
    }
  }, [syncEditorScene])

  React.useEffect(
    () => () => {
      editorRef.current = null
    },
    []
  )

  const store = React.useMemo(
    () => createTLStore({ bindingUtils: [], shapeUtils: agentShapeUtils }),
    []
  )

  return (
    <div className="absolute inset-0">
      <Tldraw
        className="agent-tldraw-surface size-full"
        hideUi
        onMount={handleMount}
        shapeUtils={agentShapeUtils}
        store={store}
      >
        <DiagramMarkerOverlay
          descriptiveNodes={descriptiveNodes}
          selectedNodeId={selectedNodeId}
          setSelectedNodeId={setSelectedNodeId}
        />
        <DiagramCameraControls reduceMotion={reduceMotion} />
      </Tldraw>
    </div>
  )
}

function DiagramMarkerOverlay({
  descriptiveNodes,
  selectedNodeId,
  setSelectedNodeId,
}: {
  descriptiveNodes: DiagramNodeData[]
  selectedNodeId: string | null
  setSelectedNodeId: (nodeId: string) => void
}) {
  const editor = useEditor()
  const markerPositions = useValue(
    "diagram marker positions",
    () => {
      editor.getCamera()
      editor.getViewportScreenBounds()

      return descriptiveNodes.map((node) => ({
        id: node.id,
        label: node.label,
        type: node.type,
        point: editor.pageToViewport({
          x: node.x + node.w - 14,
          y: node.y - 10,
        }),
      }))
    },
    [descriptiveNodes, editor]
  )

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {markerPositions.map((marker) => {
        const colors = NODE_COLORS[marker.type]
        const isSelected = selectedNodeId === marker.id

        return (
          <button
            aria-label={`Select ${marker.label.replaceAll("\n", " ")}`}
            className="pointer-events-auto absolute flex size-6 items-center justify-center rounded-full border bg-background/95 shadow-sm transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            key={marker.id}
            onClick={() => setSelectedNodeId(marker.id)}
            style={{
              borderColor: isSelected ? colors.text : colors.border,
              color: colors.text,
              left: marker.point.x,
              top: marker.point.y,
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

function DiagramCameraControls({
  reduceMotion,
}: {
  reduceMotion: boolean | null
}) {
  const editor = useEditor()
  const zoomPercent = useValue(
    "diagram zoom percent",
    () => Math.round(editor.getZoomLevel() * 100),
    [editor]
  )

  const animationDuration = reduceMotion ? 0 : 160

  return (
    <div className="pointer-events-none absolute top-3 right-3 z-20 flex items-center gap-2">
      <Button
        aria-label="Zoom out"
        className="pointer-events-auto"
        onClick={() =>
          editor.zoomOut(editor.getViewportScreenCenter(), {
            animation: { duration: animationDuration },
          })
        }
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
          editor.resetZoom(editor.getViewportScreenCenter(), {
            animation: { duration: animationDuration },
          })
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
        onClick={() =>
          editor.zoomIn(editor.getViewportScreenCenter(), {
            animation: { duration: animationDuration },
          })
        }
        size="sm"
        type="button"
        variant="outline"
      >
        +
      </Button>
      <Button
        aria-label="Fit diagram"
        className="pointer-events-auto"
        onClick={() =>
          editor.zoomToFit({
            animation: { duration: reduceMotion ? 0 : 180 },
          })
        }
        size="sm"
        type="button"
        variant="outline"
      >
        Fit
      </Button>
    </div>
  )
}

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
  const shapeRecords = React.useMemo(() => buildCanvasShapes(scene), [scene])
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(
    null
  )
  const isMobile = useMediaQuery("(max-width: 1023px)")

  const selectedNode = React.useMemo(
    () => scene.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [scene.nodes, selectedNodeId]
  )
  const selectedNodeContext = React.useMemo(() => {
    if (!selectedNode) {
      return null
    }

    const nodeLabelMap = new Map(
      scene.nodes.map((node) => [node.id, node.label.replaceAll("\n", " ")])
    )

    return {
      band: selectedNode.band,
      incoming: scene.arrows
        .filter((arrow) => arrow.to === selectedNode.id)
        .map((arrow) => ({
          dashed: Boolean(arrow.dashed),
          label: nodeLabelMap.get(arrow.from) ?? arrow.from,
        })),
      outgoing: scene.arrows
        .filter((arrow) => arrow.from === selectedNode.id)
        .map((arrow) => ({
          dashed: Boolean(arrow.dashed),
          label: nodeLabelMap.get(arrow.to) ?? arrow.to,
        })),
      patternTitle: scene.title,
      stage: scene.stage,
    }
  }, [scene.arrows, scene.nodes, scene.stage, scene.title, selectedNode])

  React.useEffect(() => {
    setSelectedNodeId(null)
  }, [diagram.id])

  React.useEffect(() => {
    if (!selectedNodeId) {
      return
    }

    if (!scene.nodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(null)
    }
  }, [scene.nodes, selectedNodeId])

  const useStaticSurface =
    typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)

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
                {useStaticSurface ? (
                  <>
                    <StaticDiagramSurface scene={scene} />
                    <StaticDiagramMarkerOverlay
                      descriptiveNodes={descriptiveNodes}
                      selectedNodeId={selectedNodeId}
                      setSelectedNodeId={setSelectedNodeId}
                    />
                  </>
                ) : (
                  <ReadOnlyTldrawSurface
                    descriptiveNodes={descriptiveNodes}
                    selectedNodeId={selectedNodeId}
                    setSelectedNodeId={setSelectedNodeId}
                    shapeRecords={shapeRecords}
                  />
                )}
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
