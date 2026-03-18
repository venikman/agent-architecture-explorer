import { diagrams } from "@/data/diagram-catalog"

export { diagramSections, diagrams } from "@/data/diagram-catalog"
export {
  ARROW_COLOR,
  HEALTHCARE_ACTIVE_STAGES,
  HEALTHCARE_STAGES,
  HEALTHCARE_STAGE_LABELS,
  NODE_COLORS,
  type DiagramArrow,
  type DiagramArrowDefinition,
  type DiagramBand,
  type DiagramCategory,
  type DiagramConnection,
  type DiagramConnectionGroups,
  type DiagramNode,
  type DiagramNodeDefinition,
  type DiagramNodeDetailContext,
  type DiagramScene,
  type DiagramStagePatch,
  type DiagramView,
  type HealthcareStage,
  type NodeType,
} from "@/data/diagram-core"
export {
  buildDiagramScene,
  buildNodeDetailContext,
  getDescriptiveNodes,
} from "@/data/diagram-scene"

export type DiagramId = (typeof diagrams)[number]["id"]

export const DEFAULT_DIAGRAM_ID: DiagramId = "augmented-llm"

const diagramMap = new Map(diagrams.map((diagram) => [diagram.id, diagram]))

export function isDiagramId(value: string): value is DiagramId {
  return diagramMap.has(value as DiagramId)
}

export function resolveDiagramId(value?: string | null): DiagramId {
  return value && isDiagramId(value) ? value : DEFAULT_DIAGRAM_ID
}

export function getDiagramById(value?: string | null) {
  return diagramMap.get(resolveDiagramId(value)) ?? diagrams[0]
}
