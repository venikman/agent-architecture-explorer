import { type DiagramCategory, type DiagramView } from "@/data/diagram-core"
import { controlDiagrams } from "@/data/diagram-control-catalog"
import { coreDiagrams } from "@/data/diagram-core-catalog"
import { healthcareDiagrams } from "@/data/diagram-healthcare-catalog"

export const diagrams = [
  ...healthcareDiagrams,
  ...controlDiagrams,
  ...coreDiagrams,
] as const satisfies readonly DiagramView[]

export const diagramSections = [
  { label: "Healthcare Exemplars", category: "healthcare" },
  { label: "Control Patterns", category: "control" },
  { label: "Core Agentic Patterns", category: "core" },
] as const satisfies ReadonlyArray<{
  label: string
  category: DiagramCategory
}>
