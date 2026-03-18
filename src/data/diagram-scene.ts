import {
  type DiagramArrow,
  type DiagramArrowDefinition,
  type DiagramBand,
  type DiagramConnection,
  type DiagramConnectionGroups,
  type DiagramNode,
  type DiagramNodeDefinition,
  type DiagramNodeDetailContext,
  type DiagramScene,
  type DiagramView,
  type HealthcareStage,
  type NodeType,
} from "@/data/diagram-core"

const STAGE_PROGRESSIONS = {
  off: [],
  foundational: ["foundational"],
  regulated: ["foundational", "regulated"],
  highRisk: ["foundational", "regulated", "highRisk"],
} as const satisfies Record<
  HealthcareStage,
  readonly Exclude<HealthcareStage, "off">[]
>

const DEFAULT_NODE_SIZE: Record<NodeType, { w: number; h: number }> = {
  llm: { w: 210, h: 104 },
  io: { w: 116, h: 56 },
  tool: { w: 164, h: 72 },
  danger: { w: 182, h: 70 },
}

function normalizeNodeDefinition(
  node: DiagramNodeDefinition
): DiagramNodeDefinition & { band: DiagramBand } {
  return {
    ...node,
    band: node.band ?? "primary",
  }
}

function normalizeArrowDefinition(
  arrow: DiagramArrowDefinition
): Required<Pick<DiagramArrowDefinition, "id">> & DiagramArrowDefinition {
  return {
    id: arrow.id ?? `${arrow.from}->${arrow.to}`,
    ...arrow,
  }
}

function mergeNodeDefinitions(
  diagram: DiagramView,
  stage: HealthcareStage
): Array<DiagramNodeDefinition & { band: DiagramBand }> {
  const nodes = new Map(
    diagram.nodes.map((node) => [node.id, normalizeNodeDefinition(node)])
  )

  for (const stageKey of STAGE_PROGRESSIONS[stage]) {
    const patch = diagram.variants?.[stageKey]

    if (!patch) {
      continue
    }

    for (const node of patch.nodes ?? []) {
      nodes.set(node.id, normalizeNodeDefinition(node))
    }

    for (const [nodeId, override] of Object.entries(
      patch.nodeOverrides ?? {}
    )) {
      const existing = nodes.get(nodeId)

      if (!existing) {
        continue
      }

      nodes.set(nodeId, {
        ...existing,
        ...override,
        band: override.band ?? existing.band,
      })
    }
  }

  return [...nodes.values()]
}

function mergeArrowDefinitions(diagram: DiagramView, stage: HealthcareStage) {
  const arrows = diagram.arrows.map(normalizeArrowDefinition)

  for (const stageKey of STAGE_PROGRESSIONS[stage]) {
    const patch = diagram.variants?.[stageKey]

    if (!patch) {
      continue
    }

    for (const arrow of patch.arrows ?? []) {
      arrows.push(normalizeArrowDefinition(arrow))
    }
  }

  return arrows
}

function getStageNote(diagram: DiagramView, stage: HealthcareStage) {
  if (stage === "off") {
    return diagram.summary
  }

  return diagram.variants?.[stage]?.note ?? diagram.summary
}

function layoutNodes(
  definitions: Array<DiagramNodeDefinition & { band: DiagramBand }>
) {
  const primaryNodes = definitions.filter((node) => node.band === "primary")
  const supportNodes = definitions.filter((node) => node.band === "support")
  const controlNodes = definitions.filter((node) => node.band === "control")

  const primaryHeight = Math.max(
    ...primaryNodes.map((node) => node.h ?? DEFAULT_NODE_SIZE[node.type].h),
    0
  )

  const columnStep = 170
  const bandInset = 64
  const laneGap = 26
  const supportBandDepth =
    supportNodes.length > 0
      ? Math.max(
          ...supportNodes.map((node) => {
            const nodeHeight = node.h ?? DEFAULT_NODE_SIZE[node.type].h
            const lane = node.lane ?? 0

            return lane * (nodeHeight + laneGap) + nodeHeight
          })
        )
      : 0
  const primaryTop = 84
  const supportTop = primaryTop + primaryHeight + 96
  const controlTop =
    supportTop +
    (supportNodes.length > 0 ? supportBandDepth + 96 : 72)

  const bandTops: Record<DiagramBand, number> = {
    primary: primaryTop,
    support: supportTop,
    control: controlTop,
  }

  // Layout primary and support bands using the column grid
  const mainNodes = definitions
    .filter((node) => node.band !== "control")
    .map<DiagramNode>((definition) => {
      const size = DEFAULT_NODE_SIZE[definition.type]
      const w = definition.w ?? size.w
      const h = definition.h ?? size.h
      const lane = definition.lane ?? 0
      const y = bandTops[definition.band] + lane * (h + laneGap)

      return {
        id: definition.id,
        label: definition.label,
        type: definition.type,
        x: bandInset + definition.column * columnStep,
        y,
        w,
        h,
        band: definition.band,
        description: definition.description,
      }
    })

  if (controlNodes.length === 0) {
    return mainNodes
  }

  // Distribute control nodes evenly within the main canvas width
  const mainMaxRight = Math.max(
    ...mainNodes.map((node) => node.x + node.w),
    720
  )
  const availableWidth = mainMaxRight - bandInset

  // Group by lane, sort by column within each lane
  const controlByLane = new Map<
    number,
    Array<DiagramNodeDefinition & { band: DiagramBand }>
  >()

  for (const node of controlNodes) {
    const lane = node.lane ?? 0
    if (!controlByLane.has(lane)) controlByLane.set(lane, [])
    controlByLane.get(lane)!.push(node)
  }

  const controlLayoutNodes: DiagramNode[] = []

  for (const [lane, laneNodes] of controlByLane) {
    const sorted = [...laneNodes].sort((a, b) => a.column - b.column)
    const widths = sorted.map(
      (n) => n.w ?? DEFAULT_NODE_SIZE[n.type].w
    )
    const heights = sorted.map(
      (n) => n.h ?? DEFAULT_NODE_SIZE[n.type].h
    )
    const totalNodeWidth = widths.reduce((sum, w) => sum + w, 0)
    const gap = Math.max(
      12,
      (availableWidth - totalNodeWidth) / (sorted.length + 1)
    )

    let x = bandInset + gap

    for (let i = 0; i < sorted.length; i++) {
      const def = sorted[i]
      controlLayoutNodes.push({
        id: def.id,
        label: def.label,
        type: def.type,
        x,
        y: controlTop + lane * (heights[i] + laneGap),
        w: widths[i],
        h: heights[i],
        band: def.band,
        description: def.description,
      })
      x += widths[i] + gap
    }
  }

  return [...mainNodes, ...controlLayoutNodes]
}

function getConnectorPoints(from: DiagramNode, to: DiagramNode) {
  const fromCenter = { x: from.x + from.w / 2, y: from.y + from.h / 2 }
  const toCenter = { x: to.x + to.w / 2, y: to.y + to.h / 2 }
  const dx = toCenter.x - fromCenter.x
  const dy = toCenter.y - fromCenter.y

  if (Math.abs(dx) >= Math.abs(dy)) {
    return {
      direction: "horizontal" as const,
      fromPoint: {
        x: dx >= 0 ? from.x + from.w : from.x,
        y: fromCenter.y,
      },
      toPoint: {
        x: dx >= 0 ? to.x : to.x + to.w,
        y: toCenter.y,
      },
    }
  }

  return {
    direction: "vertical" as const,
    fromPoint: {
      x: fromCenter.x,
      y: dy >= 0 ? from.y + from.h : from.y,
    },
    toPoint: {
      x: toCenter.x,
      y: dy >= 0 ? to.y : to.y + to.h,
    },
  }
}

function groupConnections(
  connections: DiagramConnection[]
): DiagramConnectionGroups {
  return {
    primary: connections.filter((connection) => !connection.dashed),
    conditional: connections.filter((connection) => connection.dashed),
  }
}

export function buildDiagramScene(
  diagram: DiagramView,
  stage: HealthcareStage = "off"
): DiagramScene {
  const nodes = layoutNodes(mergeNodeDefinitions(diagram, stage))
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const arrows: DiagramArrow[] = []

  for (const arrow of mergeArrowDefinitions(diagram, stage)) {
    const from = nodeMap.get(arrow.from)
    const to = nodeMap.get(arrow.to)

    if (!from || !to) {
      continue
    }

    const { fromPoint, toPoint, direction } = getConnectorPoints(from, to)

    arrows.push({
      id: arrow.id,
      from: arrow.from,
      to: arrow.to,
      label: arrow.label,
      dashed: arrow.dashed,
      fromPoint,
      toPoint,
      direction,
    })
  }

  const width = Math.max(...nodes.map((node) => node.x + node.w), 720) + 72
  const height = Math.max(...nodes.map((node) => node.y + node.h), 320) + 72

  return {
    id: diagram.id,
    title: diagram.title,
    subtitle: diagram.subtitle,
    category: diagram.category,
    stage,
    note: getStageNote(diagram, stage),
    nodes,
    arrows,
    width,
    height,
  }
}

export function getDescriptiveNodes(scene: DiagramScene) {
  return scene.nodes.filter((node) => node.description)
}

export function buildNodeDetailContext(
  scene: DiagramScene,
  nodeId: string
): DiagramNodeDetailContext | null {
  const node = scene.nodes.find((candidate) => candidate.id === nodeId)

  if (!node) {
    return null
  }

  const nodeLabelMap = new Map(
    scene.nodes.map((candidate) => [
      candidate.id,
      candidate.label.replaceAll("\n", " "),
    ])
  )

  const incoming = scene.arrows
    .filter((arrow) => arrow.to === node.id)
    .map<DiagramConnection>((arrow) => ({
      dashed: Boolean(arrow.dashed),
      label: nodeLabelMap.get(arrow.from) ?? arrow.from,
    }))
  const outgoing = scene.arrows
    .filter((arrow) => arrow.from === node.id)
    .map<DiagramConnection>((arrow) => ({
      dashed: Boolean(arrow.dashed),
      label: nodeLabelMap.get(arrow.to) ?? arrow.to,
    }))

  return {
    band: node.band,
    incoming: groupConnections(incoming),
    outgoing: groupConnections(outgoing),
    patternTitle: scene.title,
    stage: scene.stage,
  }
}
