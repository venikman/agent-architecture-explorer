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

/* ─── Data flow types ─── */

export type DataFlowType =
  | "query"       // IO → LLM: user input, requests
  | "response"    // LLM → IO, Tool → IO: answers, assembled output
  | "tool-assist" // LLM → Tool (dashed), Tool → LLM: tool calls & results
  | "structured"  // LLM → Tool (solid), LLM → LLM, Tool → Tool: handoffs, routing
  | "approval"    // IO → Tool: human review / approval signals
  | "control"     // * → Danger, Danger → *: safety/compliance

export const DATA_FLOW_COLORS: Record<DataFlowType, { dot: string; label: string }> = {
  query:       { dot: "var(--diagram-llm-border)",    label: "Query / input" },
  response:    { dot: "var(--diagram-io-border)",     label: "Response / output" },
  "tool-assist": { dot: "var(--diagram-tool-border)", label: "Tool call / result" },
  structured:  { dot: "var(--diagram-llm-text)",      label: "Structured data" },
  approval:    { dot: "var(--diagram-io-text)",        label: "Approval signal" },
  control:     { dot: "var(--diagram-danger-border)",  label: "Safety control" },
}

/** Infer data flow type from source/target node types */
export function inferDataFlowType(
  sourceType: NodeType,
  targetType: NodeType,
  dashed: boolean
): DataFlowType {
  // Any edge involving a danger node = control
  if (sourceType === "danger" || targetType === "danger") return "control"
  // IO → LLM = query
  if (sourceType === "io" && targetType === "llm") return "query"
  // LLM → IO or Tool → IO = response
  if (targetType === "io") return "response"
  // IO → Tool = approval
  if (sourceType === "io" && targetType === "tool") return "approval"
  // LLM → Tool dashed or Tool → LLM = tool-assist
  if (
    (sourceType === "llm" && targetType === "tool" && dashed) ||
    (sourceType === "tool" && targetType === "llm")
  )
    return "tool-assist"
  // Everything else (LLM→Tool solid, LLM→LLM, Tool→Tool) = structured
  return "structured"
}
