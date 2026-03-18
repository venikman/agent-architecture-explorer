import {
  type DiagramArrowDefinition,
  type DiagramBand,
  type DiagramNodeDefinition,
  type DiagramView,
  type NodeType,
} from "@/data/diagram-core"

interface SharedHealthcareVariantConfig {
  ingress: string
  core: string
  egress: string
  oversight?: string
}

interface DiagramDefinition extends Omit<DiagramView, "variants"> {
  healthcare?: SharedHealthcareVariantConfig
}

type NodeInput = Omit<DiagramNodeDefinition, "type">

export function node(
  nodeDefinition: DiagramNodeDefinition
): DiagramNodeDefinition & { band: DiagramBand } {
  return {
    band: nodeDefinition.band ?? "primary",
    ...nodeDefinition,
  }
}

function typedNode(type: NodeType, nodeDefinition: NodeInput) {
  return node({
    ...nodeDefinition,
    type,
  })
}

export function ioNode(nodeDefinition: NodeInput) {
  return typedNode("io", nodeDefinition)
}

export function llmNode(nodeDefinition: NodeInput) {
  return typedNode("llm", nodeDefinition)
}

export function toolNode(nodeDefinition: NodeInput) {
  return typedNode("tool", nodeDefinition)
}

export function supportNode(type: Exclude<NodeType, "danger">, nodeDefinition: NodeInput) {
  return typedNode(type, {
    ...nodeDefinition,
    band: "support",
  })
}

export function arrow(
  arrowDefinition: DiagramArrowDefinition
): Required<Pick<DiagramArrowDefinition, "id">> & DiagramArrowDefinition {
  return {
    id: arrowDefinition.id ?? `${arrowDefinition.from}->${arrowDefinition.to}`,
    ...arrowDefinition,
  }
}

function createSharedHealthcareVariants({
  ingress,
  core,
  egress,
  oversight,
}: SharedHealthcareVariantConfig): DiagramView["variants"] {
  return {
    foundational: {
      note: "Foundational healthcare mode adds PHI minimization, audit trail coverage, minimum-necessary access, and provenance/source visibility.",
      nodes: [
        node({
          id: "minimum-access",
          label: "Minimum-\nNecessary Access",
          type: "danger",
          column: 1,
          band: "control",
          description:
            "Limits every handoff to the smallest PHI footprint required to complete the task.",
        }),
        node({
          id: "source-visibility",
          label: "Source\nVisibility",
          type: "danger",
          column: 3,
          band: "control",
          description:
            "Shows provenance and source context alongside model reasoning so clinicians can verify the basis of a recommendation.",
        }),
        node({
          id: "audit-trail",
          label: "Audit Trail",
          type: "danger",
          column: 5,
          band: "control",
          description:
            "Captures immutable logs for prompts, model outputs, actions, and release decisions.",
        }),
      ],
      arrows: [
        arrow({ from: ingress, to: "minimum-access", dashed: true }),
        arrow({ from: core, to: "source-visibility", dashed: true }),
        arrow({ from: egress, to: "audit-trail", dashed: true }),
      ],
    },
    regulated: {
      note: "Regulated healthcare mode adds policy gates, clinician approval, guideline grounding, and disclosure / transparency controls.",
      nodes: [
        node({
          id: "policy-gate",
          label: "Policy Gate",
          type: "danger",
          column: 2,
          band: "control",
          description:
            "Applies institutional policies, scope rules, and deployment guardrails before a response can move forward.",
        }),
        node({
          id: "clinician-approval",
          label: "Clinician\nApproval",
          type: "danger",
          column: 4,
          band: "control",
          description:
            "Requires a clinician approval step before regulated recommendations or actions can leave the system.",
        }),
        node({
          id: "disclosure",
          label: "Disclosure &\nTransparency",
          type: "danger",
          column: 6,
          band: "control",
          description:
            "Makes model involvement, confidence limits, and supporting evidence visible to downstream users.",
        }),
      ],
      arrows: [
        arrow({ from: core, to: "policy-gate", dashed: true }),
        arrow({
          from: "policy-gate",
          to: "clinician-approval",
          dashed: true,
        }),
        arrow({
          from: "clinician-approval",
          to: oversight ?? egress,
          dashed: true,
        }),
        arrow({ from: egress, to: "disclosure", dashed: true }),
      ],
    },
    highRisk: {
      note: "High-risk autonomy mode adds sandboxing, emergency halt controls, periodic human checkpoints, and incident / rollback controls.",
      nodes: [
        node({
          id: "sandbox",
          label: "Sandbox",
          type: "danger",
          column: 1,
          band: "control",
          lane: 1,
          description:
            "Routes actions through an isolated environment before any high-risk automation can touch production systems.",
        }),
        node({
          id: "checkpoint",
          label: "Periodic\nCheckpoint",
          type: "danger",
          column: 3,
          band: "control",
          lane: 1,
          description:
            "Forces periodic human checkpoints instead of allowing unbounded autonomous execution.",
        }),
        node({
          id: "kill-switch",
          label: "Kill Switch",
          type: "danger",
          column: 5,
          band: "control",
          lane: 1,
          description:
            "Lets authorized clinicians or operators halt the agent immediately when risk or drift is detected.",
        }),
        node({
          id: "incident-loop",
          label: "Incident /\nRollback",
          type: "danger",
          column: 7,
          band: "control",
          lane: 1,
          description:
            "Feeds incidents back into rollback, review, and remediation workflows when autonomy fails or drifts.",
        }),
      ],
      arrows: [
        arrow({ from: core, to: "sandbox", dashed: true }),
        arrow({ from: core, to: "checkpoint", dashed: true }),
        arrow({ from: egress, to: "kill-switch", dashed: true }),
        arrow({ from: egress, to: "incident-loop", dashed: true }),
      ],
    },
  }
}

export function defineDiagram({
  healthcare,
  ...diagram
}: DiagramDefinition): DiagramView {
  return {
    ...diagram,
    variants: healthcare ? createSharedHealthcareVariants(healthcare) : undefined,
  }
}
