export type NodeType = "llm" | "io" | "tool" | "danger"
export type DiagramCategory = "healthcare" | "control" | "core"
export type HealthcareStage = "off" | "foundational" | "regulated" | "highRisk"
export type DiagramBand = "primary" | "support" | "control"

export interface DiagramNodeDefinition {
  id: string
  label: string
  type: NodeType
  column: number
  lane?: number
  band?: DiagramBand
  w?: number
  h?: number
  description?: string
}

export interface DiagramArrowDefinition {
  id?: string
  from: string
  to: string
  label?: string
  dashed?: boolean
}

export interface DiagramStagePatch {
  note?: string
  nodes?: DiagramNodeDefinition[]
  arrows?: DiagramArrowDefinition[]
  nodeOverrides?: Record<string, Partial<Omit<DiagramNodeDefinition, "id">>>
}

export interface DiagramView {
  id: string
  category: DiagramCategory
  title: string
  subtitle: string
  summary: string
  nodes: DiagramNodeDefinition[]
  arrows: DiagramArrowDefinition[]
  variants?: Partial<Record<Exclude<HealthcareStage, "off">, DiagramStagePatch>>
}

export interface DiagramNode {
  id: string
  label: string
  type: NodeType
  x: number
  y: number
  w: number
  h: number
  band: DiagramBand
  description?: string
}

export interface DiagramArrow {
  id: string
  from: string
  to: string
  label?: string
  dashed?: boolean
  fromPoint: { x: number; y: number }
  toPoint: { x: number; y: number }
  direction: "horizontal" | "vertical"
}

export interface DiagramScene {
  id: string
  title: string
  subtitle: string
  category: DiagramCategory
  stage: HealthcareStage
  note: string
  nodes: DiagramNode[]
  arrows: DiagramArrow[]
  width: number
  height: number
}

export interface DiagramConnection {
  dashed: boolean
  label: string
}

export interface DiagramConnectionGroups {
  primary: DiagramConnection[]
  conditional: DiagramConnection[]
}

export interface DiagramNodeDetailContext {
  band: DiagramNode["band"]
  incoming: DiagramConnectionGroups
  outgoing: DiagramConnectionGroups
  patternTitle: string
  stage: HealthcareStage
}

export const HEALTHCARE_STAGES = [
  "off",
  "foundational",
  "regulated",
  "highRisk",
] as const satisfies readonly HealthcareStage[]

export const HEALTHCARE_STAGE_LABELS: Record<HealthcareStage, string> = {
  off: "Off",
  foundational: "Foundational",
  regulated: "Regulated",
  highRisk: "High-Risk Autonomy",
}

export const HEALTHCARE_ACTIVE_STAGES: Exclude<HealthcareStage, "off">[] =
  HEALTHCARE_STAGES.filter(
    (stage): stage is Exclude<HealthcareStage, "off"> => stage !== "off"
  )

export const NODE_COLORS = {
  llm: {
    fill: "var(--diagram-llm-fill)",
    border: "var(--diagram-llm-border)",
    text: "var(--diagram-llm-text)",
    glow: "var(--diagram-llm-glow)",
  },
  io: {
    fill: "var(--diagram-io-fill)",
    border: "var(--diagram-io-border)",
    text: "var(--diagram-io-text)",
    glow: "var(--diagram-io-glow)",
  },
  tool: {
    fill: "var(--diagram-tool-fill)",
    border: "var(--diagram-tool-border)",
    text: "var(--diagram-tool-text)",
    glow: "var(--diagram-tool-glow)",
  },
  danger: {
    fill: "var(--diagram-danger-fill)",
    border: "var(--diagram-danger-border)",
    text: "var(--diagram-danger-text)",
    glow: "var(--diagram-danger-glow)",
  },
} as const satisfies Record<
  NodeType,
  { fill: string; border: string; text: string; glow: string }
>

export const ARROW_COLOR = "var(--diagram-arrow)"
