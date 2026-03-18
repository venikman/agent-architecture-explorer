export type NodeType = "llm" | "io" | "tool" | "danger"
export type DiagramCategory = "healthcare" | "control" | "core"
export type HealthcareStage = "off" | "foundational" | "regulated" | "highRisk"

type DiagramBand = "primary" | "support" | "control"

interface DiagramNodeDefinition {
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

interface DiagramArrowDefinition {
  id?: string
  from: string
  to: string
  label?: string
  dashed?: boolean
}

interface DiagramStagePatch {
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

const STAGE_PROGRESSIONS = {
  off: [],
  foundational: ["foundational"],
  regulated: ["foundational", "regulated"],
  highRisk: ["foundational", "regulated", "highRisk"],
} as const satisfies Record<
  HealthcareStage,
  readonly Exclude<HealthcareStage, "off">[]
>

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

const DEFAULT_NODE_SIZE: Record<NodeType, { w: number; h: number }> = {
  llm: { w: 210, h: 104 },
  io: { w: 116, h: 56 },
  tool: { w: 164, h: 72 },
  danger: { w: 182, h: 70 },
}

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

function createNode(
  node: DiagramNodeDefinition
): DiagramNodeDefinition & { band: DiagramBand } {
  return {
    band: node.band ?? "primary",
    ...node,
  }
}

function createArrow(
  arrow: DiagramArrowDefinition
): Required<Pick<DiagramArrowDefinition, "id">> & DiagramArrowDefinition {
  return {
    id: arrow.id ?? `${arrow.from}->${arrow.to}`,
    ...arrow,
  }
}

function createSharedHealthcareVariants({
  ingress,
  core,
  egress,
  oversight,
}: {
  ingress: string
  core: string
  egress: string
  oversight?: string
}): DiagramView["variants"] {
  return {
    foundational: {
      note: "Foundational healthcare mode adds PHI minimization, audit trail coverage, minimum-necessary access, and provenance/source visibility.",
      nodes: [
        createNode({
          id: "minimum-access",
          label: "Minimum-\nNecessary Access",
          type: "danger",
          column: 1,
          band: "control",
          description:
            "Limits every handoff to the smallest PHI footprint required to complete the task.",
        }),
        createNode({
          id: "source-visibility",
          label: "Source\nVisibility",
          type: "danger",
          column: 3,
          band: "control",
          description:
            "Shows provenance and source context alongside model reasoning so clinicians can verify the basis of a recommendation.",
        }),
        createNode({
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
        createArrow({ from: ingress, to: "minimum-access", dashed: true }),
        createArrow({ from: core, to: "source-visibility", dashed: true }),
        createArrow({ from: egress, to: "audit-trail", dashed: true }),
      ],
    },
    regulated: {
      note: "Regulated healthcare mode adds policy gates, clinician approval, guideline grounding, and disclosure / transparency controls.",
      nodes: [
        createNode({
          id: "policy-gate",
          label: "Policy Gate",
          type: "danger",
          column: 2,
          band: "control",
          description:
            "Applies institutional policies, scope rules, and deployment guardrails before a response can move forward.",
        }),
        createNode({
          id: "clinician-approval",
          label: "Clinician\nApproval",
          type: "danger",
          column: 4,
          band: "control",
          description:
            "Requires a clinician approval step before regulated recommendations or actions can leave the system.",
        }),
        createNode({
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
        createArrow({ from: core, to: "policy-gate", dashed: true }),
        createArrow({
          from: "policy-gate",
          to: "clinician-approval",
          dashed: true,
        }),
        createArrow({
          from: "clinician-approval",
          to: oversight ?? egress,
          dashed: true,
        }),
        createArrow({ from: egress, to: "disclosure", dashed: true }),
      ],
    },
    highRisk: {
      note: "High-risk autonomy mode adds sandboxing, emergency halt controls, periodic human checkpoints, and incident / rollback controls.",
      nodes: [
        createNode({
          id: "sandbox",
          label: "Sandbox",
          type: "danger",
          column: 1,
          band: "control",
          lane: 1,
          description:
            "Routes actions through an isolated environment before any high-risk automation can touch production systems.",
        }),
        createNode({
          id: "checkpoint",
          label: "Periodic\nCheckpoint",
          type: "danger",
          column: 3,
          band: "control",
          lane: 1,
          description:
            "Forces periodic human checkpoints instead of allowing unbounded autonomous execution.",
        }),
        createNode({
          id: "kill-switch",
          label: "Kill Switch",
          type: "danger",
          column: 5,
          band: "control",
          lane: 1,
          description:
            "Lets authorized clinicians or operators halt the agent immediately when risk or drift is detected.",
        }),
        createNode({
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
        createArrow({ from: core, to: "sandbox", dashed: true }),
        createArrow({ from: core, to: "checkpoint", dashed: true }),
        createArrow({ from: egress, to: "kill-switch", dashed: true }),
        createArrow({ from: egress, to: "incident-loop", dashed: true }),
      ],
    },
  }
}

export const diagrams = [
  {
    id: "guideline-grounded-cds",
    category: "healthcare",
    title: "Guideline-Grounded CDS",
    subtitle:
      "Clinical decision support grounded in protocols and clinician review",
    summary:
      "A healthcare-first agentic pattern that blends guideline retrieval, synthesis, and clinician-facing recommendations.",
    nodes: [
      createNode({
        id: "intake",
        label: "Patient Intake",
        type: "io",
        column: 0,
        description:
          "Receives the presenting complaint, vitals, and structured case context.",
      }),
      createNode({
        id: "llm",
        label: "LLM",
        type: "llm",
        column: 2,
        description:
          "Large Language Model — the reasoning core that synthesizes evidence into clinician-ready recommendations.",
      }),
      createNode({
        id: "cds-brief",
        label: "CDS Brief",
        type: "tool",
        column: 4,
        description:
          "Assembles a concise recommendation with traceable evidence and rationale.",
      }),
      createNode({
        id: "clinician",
        label: "Clinician",
        type: "io",
        column: 6,
        description: "Reviews the recommendation and decides how to act on it.",
      }),
      createNode({
        id: "guideline-retrieval",
        label: "Guideline\nRetrieval",
        type: "tool",
        column: 1,
        band: "support",
        description:
          "Pulls policy, guideline, and evidence references into the active case context.",
      }),
      createNode({
        id: "evidence-assembly",
        label: "Evidence\nAssembly",
        type: "tool",
        column: 3,
        band: "support",
        description:
          "Normalizes citations, contraindications, and supporting detail for the model.",
      }),
    ],
    arrows: [
      createArrow({ from: "intake", to: "llm" }),
      createArrow({ from: "llm", to: "cds-brief" }),
      createArrow({ from: "cds-brief", to: "clinician" }),
      createArrow({ from: "guideline-retrieval", to: "llm", dashed: true }),
      createArrow({ from: "evidence-assembly", to: "llm", dashed: true }),
      createArrow({
        from: "guideline-retrieval",
        to: "evidence-assembly",
        dashed: true,
      }),
    ],
    variants: createSharedHealthcareVariants({
      ingress: "intake",
      core: "llm",
      egress: "cds-brief",
      oversight: "clinician",
    }),
  },
  {
    id: "hierarchical-parallel-review",
    category: "healthcare",
    title: "Hierarchical Parallel Review",
    subtitle:
      "A coordinating model fans work out to specialist reviewers, then re-converges",
    summary:
      "A multi-reviewer pattern for complex cases where parallel specialist checks feed a unified recommendation.",
    nodes: [
      createNode({
        id: "case-intake",
        label: "Case Intake",
        type: "io",
        column: 0,
        description:
          "Captures the initial patient context and review objective.",
      }),
      createNode({
        id: "triage-llm",
        label: "Triage\nLLM",
        type: "llm",
        column: 2,
        description:
          "Plans the review and delegates the case into specialist tracks.",
      }),
      createNode({
        id: "review-board",
        label: "Review Board",
        type: "tool",
        column: 6,
        description:
          "Aggregates specialist findings into a single clinician-facing decision packet.",
      }),
      createNode({
        id: "clinician",
        label: "Clinician",
        type: "io",
        column: 8,
        description:
          "Owns the final decision after reviewing the aggregated recommendations.",
      }),
      createNode({
        id: "cardiology",
        label: "Cardiology\nReviewer",
        type: "llm",
        column: 4,
        band: "support",
        description:
          "Examines cardiac signals, risk factors, and supporting context for the active case.",
      }),
      createNode({
        id: "pharmacy",
        label: "Pharmacy\nReviewer",
        type: "llm",
        column: 4,
        band: "support",
        lane: 1,
        description:
          "Checks medication safety, interactions, and dose constraints in parallel.",
      }),
      createNode({
        id: "care-pathway",
        label: "Care Pathway\nReviewer",
        type: "llm",
        column: 4,
        band: "support",
        lane: 2,
        description:
          "Reviews the case against pathway-specific expectations and escalation rules.",
      }),
    ],
    arrows: [
      createArrow({ from: "case-intake", to: "triage-llm" }),
      createArrow({ from: "triage-llm", to: "review-board" }),
      createArrow({ from: "review-board", to: "clinician" }),
      createArrow({ from: "triage-llm", to: "cardiology", dashed: true }),
      createArrow({ from: "triage-llm", to: "pharmacy", dashed: true }),
      createArrow({ from: "triage-llm", to: "care-pathway", dashed: true }),
      createArrow({ from: "cardiology", to: "review-board", dashed: true }),
      createArrow({ from: "pharmacy", to: "review-board", dashed: true }),
      createArrow({ from: "care-pathway", to: "review-board", dashed: true }),
    ],
    variants: createSharedHealthcareVariants({
      ingress: "case-intake",
      core: "triage-llm",
      egress: "review-board",
      oversight: "clinician",
    }),
  },
  {
    id: "guardrailed-single-agent-loop",
    category: "control",
    title: "Guardrailed Single-Agent Loop",
    subtitle:
      "One agent operates in a bounded loop with explicit control checkpoints",
    summary:
      "A compact control pattern that keeps one agent effective without letting it drift into unbounded autonomy.",
    nodes: [
      createNode({
        id: "request",
        label: "Request",
        type: "io",
        column: 0,
        description: "The incoming task, message, or operational request.",
      }),
      createNode({
        id: "agent",
        label: "Agent",
        type: "llm",
        column: 2,
        description:
          "Large Language Model — the planning and execution core responsible for choosing the next action.",
      }),
      createNode({
        id: "response",
        label: "Response",
        type: "io",
        column: 6,
        description:
          "The released answer or action summary after the loop resolves.",
      }),
      createNode({
        id: "tooling",
        label: "Tooling",
        type: "tool",
        column: 3,
        band: "support",
        description:
          "External systems and APIs that the agent calls inside the loop.",
      }),
      createNode({
        id: "evaluator",
        label: "Evaluator",
        type: "tool",
        column: 5,
        band: "support",
        description:
          "Scores the latest step and decides whether the agent can continue or must stop.",
      }),
    ],
    arrows: [
      createArrow({ from: "request", to: "agent" }),
      createArrow({ from: "agent", to: "response" }),
      createArrow({ from: "agent", to: "tooling", dashed: true }),
      createArrow({ from: "tooling", to: "agent", dashed: true }),
      createArrow({ from: "agent", to: "evaluator", dashed: true }),
      createArrow({ from: "evaluator", to: "agent", dashed: true }),
    ],
    variants: createSharedHealthcareVariants({
      ingress: "request",
      core: "agent",
      egress: "response",
    }),
  },
  {
    id: "human-approval-dual-control",
    category: "control",
    title: "Human Approval / Dual Control",
    subtitle: "The model drafts, but release requires explicit human sign-off",
    summary:
      "A release-control pattern for sensitive workflows where a model can prepare work but cannot ship it alone.",
    nodes: [
      createNode({
        id: "request",
        label: "Request",
        type: "io",
        column: 0,
        description: "The incoming ask that needs a reviewed answer or action.",
      }),
      createNode({
        id: "draft-llm",
        label: "Draft\nLLM",
        type: "llm",
        column: 2,
        description:
          "Large Language Model — drafts the recommendation, action plan, or first-pass answer.",
      }),
      createNode({
        id: "dual-control",
        label: "Dual Control",
        type: "tool",
        column: 4,
        description:
          "Aggregates approval requirements so no single actor can release the result alone.",
      }),
      createNode({
        id: "release",
        label: "Release",
        type: "io",
        column: 6,
        description: "The approved output that can now move downstream.",
      }),
      createNode({
        id: "reviewer-a",
        label: "Reviewer A",
        type: "io",
        column: 3,
        band: "support",
        description:
          "Performs the first approval pass against policy, quality, and safety constraints.",
      }),
      createNode({
        id: "reviewer-b",
        label: "Reviewer B",
        type: "io",
        column: 5,
        band: "support",
        description:
          "Performs the second independent approval pass before release.",
      }),
    ],
    arrows: [
      createArrow({ from: "request", to: "draft-llm" }),
      createArrow({ from: "draft-llm", to: "dual-control" }),
      createArrow({ from: "dual-control", to: "release" }),
      createArrow({ from: "reviewer-a", to: "dual-control", dashed: true }),
      createArrow({ from: "reviewer-b", to: "dual-control", dashed: true }),
    ],
    variants: createSharedHealthcareVariants({
      ingress: "request",
      core: "draft-llm",
      egress: "release",
      oversight: "reviewer-b",
    }),
  },
  {
    id: "specialist-escalation",
    category: "control",
    title: "Single-Agent -> Specialist Escalation",
    subtitle:
      "A primary agent routes harder cases into specialist review paths",
    summary:
      "A control pattern that starts simple but escalates when risk, complexity, or uncertainty crosses a threshold.",
    nodes: [
      createNode({
        id: "request",
        label: "Request",
        type: "io",
        column: 0,
        description: "The incoming case or task requiring triage.",
      }),
      createNode({
        id: "primary-agent",
        label: "Primary\nAgent",
        type: "llm",
        column: 2,
        description:
          "Large Language Model — handles straightforward requests and decides when escalation is required.",
      }),
      createNode({
        id: "specialist",
        label: "Specialist\nAgent",
        type: "llm",
        column: 4,
        description:
          "Takes over when the request requires domain-specific depth or a different operating policy.",
      }),
      createNode({
        id: "decision",
        label: "Decision",
        type: "io",
        column: 6,
        description:
          "The final routed output after the specialist or primary path resolves.",
      }),
      createNode({
        id: "thresholds",
        label: "Escalation\nThresholds",
        type: "tool",
        column: 3,
        band: "support",
        description:
          "Defines the conditions that force escalation into the specialist path.",
      }),
    ],
    arrows: [
      createArrow({ from: "request", to: "primary-agent" }),
      createArrow({ from: "primary-agent", to: "decision", dashed: true }),
      createArrow({ from: "primary-agent", to: "specialist" }),
      createArrow({ from: "specialist", to: "decision" }),
      createArrow({ from: "thresholds", to: "primary-agent", dashed: true }),
    ],
    variants: createSharedHealthcareVariants({
      ingress: "request",
      core: "primary-agent",
      egress: "decision",
    }),
  },
  {
    id: "shadow-mode-incident-loop",
    category: "control",
    title: "Shadow Mode / Eval / Incident Loop",
    subtitle:
      "A live path runs in parallel with shadow evaluation and rollback logic",
    summary:
      "A deployment control pattern that measures model behavior safely before expanding autonomy.",
    nodes: [
      createNode({
        id: "live-input",
        label: "Live Input",
        type: "io",
        column: 0,
        description:
          "Production traffic mirrored into the active and shadow paths.",
      }),
      createNode({
        id: "production-agent",
        label: "Production\nAgent",
        type: "llm",
        column: 2,
        description:
          "Large Language Model — the primary path handling live work under current release rules.",
      }),
      createNode({
        id: "release",
        label: "Release",
        type: "io",
        column: 6,
        description:
          "The live output that reaches users or downstream systems.",
      }),
      createNode({
        id: "shadow-agent",
        label: "Shadow\nAgent",
        type: "llm",
        column: 3,
        band: "support",
        description:
          "Runs in parallel against mirrored input without affecting production outcomes.",
      }),
      createNode({
        id: "eval-loop",
        label: "Eval Loop",
        type: "tool",
        column: 5,
        band: "support",
        description:
          "Scores drift, regressions, and incident signals between the live and shadow paths.",
      }),
    ],
    arrows: [
      createArrow({ from: "live-input", to: "production-agent" }),
      createArrow({ from: "production-agent", to: "release" }),
      createArrow({ from: "live-input", to: "shadow-agent", dashed: true }),
      createArrow({ from: "shadow-agent", to: "eval-loop", dashed: true }),
      createArrow({ from: "production-agent", to: "eval-loop", dashed: true }),
    ],
    variants: createSharedHealthcareVariants({
      ingress: "live-input",
      core: "production-agent",
      egress: "release",
    }),
  },
  {
    id: "augmented-llm",
    category: "core",
    title: "The Augmented LLM",
    subtitle: "The basic building block of agentic systems",
    summary:
      "The canonical agentic primitive: one model, richer context, and external capability hooks.",
    nodes: [
      createNode({
        id: "input",
        label: "Input",
        type: "io",
        column: 0,
      }),
      createNode({
        id: "llm",
        label: "LLM",
        type: "llm",
        column: 2,
        description:
          "Large Language Model — the reasoning core that processes inputs, chooses tools, and produces outputs.",
      }),
      createNode({
        id: "output",
        label: "Output",
        type: "io",
        column: 6,
      }),
      createNode({
        id: "retrieval",
        label: "Retrieval",
        type: "tool",
        column: 1,
        band: "support",
        description:
          "Fetches relevant context from knowledge stores and search systems.",
      }),
      createNode({
        id: "tools",
        label: "Tools",
        type: "tool",
        column: 3,
        band: "support",
        description:
          "Extends the model with APIs, code execution, or transactional operations.",
      }),
      createNode({
        id: "memory",
        label: "Memory",
        type: "tool",
        column: 5,
        band: "support",
        description:
          "Provides short- and long-term context for future reasoning steps.",
      }),
    ],
    arrows: [
      createArrow({ from: "input", to: "llm" }),
      createArrow({ from: "llm", to: "output" }),
      createArrow({ from: "llm", to: "retrieval", dashed: true }),
      createArrow({ from: "retrieval", to: "llm", dashed: true }),
      createArrow({ from: "llm", to: "tools", dashed: true }),
      createArrow({ from: "tools", to: "llm", dashed: true }),
      createArrow({ from: "llm", to: "memory", dashed: true }),
      createArrow({ from: "memory", to: "llm", dashed: true }),
    ],
    variants: createSharedHealthcareVariants({
      ingress: "input",
      core: "llm",
      egress: "output",
    }),
  },
  {
    id: "prompt-chaining",
    category: "core",
    title: "Prompt Chaining",
    subtitle: "Sequential model calls where each output feeds the next",
    summary:
      "A modular pattern for decomposing work into staged reasoning and quality gates.",
    nodes: [
      createNode({
        id: "input",
        label: "Input",
        type: "io",
        column: 0,
      }),
      createNode({
        id: "call-1",
        label: "LLM Call 1",
        type: "llm",
        column: 2,
        description: "Runs the first analysis or transformation pass.",
      }),
      createNode({
        id: "gate",
        label: "Gate",
        type: "tool",
        column: 4,
        description: "Checks quality before the chain continues.",
      }),
      createNode({
        id: "call-2",
        label: "LLM Call 2",
        type: "llm",
        column: 6,
        description:
          "Refines, expands, or rewrites the result after the gate passes.",
      }),
      createNode({
        id: "output",
        label: "Output",
        type: "io",
        column: 8,
      }),
      createNode({
        id: "exit",
        label: "Exit",
        type: "io",
        column: 4,
        band: "support",
        description:
          "Stops the chain when the result is not good enough to continue.",
      }),
    ],
    arrows: [
      createArrow({ from: "input", to: "call-1" }),
      createArrow({ from: "call-1", to: "gate", label: "Pass forward" }),
      createArrow({ from: "gate", to: "call-2" }),
      createArrow({ from: "call-2", to: "output" }),
      createArrow({ from: "gate", to: "exit", dashed: true, label: "Fail" }),
    ],
    variants: createSharedHealthcareVariants({
      ingress: "input",
      core: "call-1",
      egress: "output",
    }),
  },
  {
    id: "routing",
    category: "core",
    title: "Routing",
    subtitle: "A classifier routes work to the best specialist path",
    summary:
      "A routing pattern that protects latency and quality by selecting the right path for each request.",
    nodes: [
      createNode({
        id: "input",
        label: "Input",
        type: "io",
        column: 0,
      }),
      createNode({
        id: "router",
        label: "LLM Router",
        type: "llm",
        column: 2,
        description:
          "Classifies input and routes work to the specialist path with the best expected quality / latency tradeoff.",
      }),
      createNode({
        id: "output",
        label: "Output",
        type: "io",
        column: 8,
      }),
      createNode({
        id: "fast-path",
        label: "Fast Path",
        type: "llm",
        column: 4,
        band: "support",
        description:
          "Handles lower-risk requests with the lightest specialist path.",
      }),
      createNode({
        id: "expert-path",
        label: "Expert Path",
        type: "llm",
        column: 6,
        band: "support",
        description: "Takes over for more complex or higher-risk requests.",
      }),
    ],
    arrows: [
      createArrow({ from: "input", to: "router" }),
      createArrow({ from: "router", to: "fast-path", dashed: true }),
      createArrow({ from: "router", to: "expert-path", dashed: true }),
      createArrow({ from: "fast-path", to: "output" }),
      createArrow({ from: "expert-path", to: "output" }),
    ],
    variants: createSharedHealthcareVariants({
      ingress: "input",
      core: "router",
      egress: "output",
    }),
  },
  {
    id: "parallelization",
    category: "core",
    title: "Parallelization",
    subtitle: "Independent branches run concurrently, then re-converge",
    summary:
      "A throughput pattern for splitting work into parallel specialist passes and recombining the results.",
    nodes: [
      createNode({
        id: "input",
        label: "Input",
        type: "io",
        column: 0,
      }),
      createNode({
        id: "branch-a",
        label: "Branch A",
        type: "llm",
        column: 2,
        band: "support",
        description: "Runs one specialist branch in parallel with the others.",
      }),
      createNode({
        id: "branch-b",
        label: "Branch B",
        type: "llm",
        column: 4,
        band: "support",
        description: "Runs a second specialist branch against the same input.",
      }),
      createNode({
        id: "branch-c",
        label: "Branch C",
        type: "llm",
        column: 6,
        band: "support",
        description:
          "Runs a third parallel branch when decomposition makes sense.",
      }),
      createNode({
        id: "aggregator",
        label: "Aggregator",
        type: "tool",
        column: 8,
        description: "Reconciles branch outputs into one downstream answer.",
      }),
      createNode({
        id: "output",
        label: "Output",
        type: "io",
        column: 10,
      }),
    ],
    arrows: [
      createArrow({ from: "input", to: "branch-a", dashed: true }),
      createArrow({ from: "input", to: "branch-b", dashed: true }),
      createArrow({ from: "input", to: "branch-c", dashed: true }),
      createArrow({ from: "branch-a", to: "aggregator", dashed: true }),
      createArrow({ from: "branch-b", to: "aggregator", dashed: true }),
      createArrow({ from: "branch-c", to: "aggregator", dashed: true }),
      createArrow({ from: "aggregator", to: "output" }),
    ],
    variants: createSharedHealthcareVariants({
      ingress: "input",
      core: "aggregator",
      egress: "output",
    }),
  },
] as const satisfies readonly DiagramView[]

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

function mergeNodeDefinitions(
  diagram: DiagramView,
  stage: HealthcareStage
): Array<DiagramNodeDefinition & { band: DiagramBand }> {
  const nodes = new Map(
    diagram.nodes.map((node) => [
      node.id,
      { ...node, band: node.band ?? "primary" },
    ])
  )

  for (const stageKey of STAGE_PROGRESSIONS[stage]) {
    const patch = diagram.variants?.[stageKey]

    if (!patch) {
      continue
    }

    for (const node of patch.nodes ?? []) {
      nodes.set(node.id, { ...node, band: node.band ?? "primary" })
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
  const arrows = diagram.arrows.map(createArrow)

  for (const stageKey of STAGE_PROGRESSIONS[stage]) {
    const patch = diagram.variants?.[stageKey]

    if (!patch) {
      continue
    }

    for (const arrow of patch.arrows ?? []) {
      arrows.push(createArrow(arrow))
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

function getStageWeight(stage: HealthcareStage) {
  switch (stage) {
    case "foundational":
      return 1
    case "regulated":
      return 2
    case "highRisk":
      return 3
    default:
      return 0
  }
}

function layoutNodes(
  definitions: Array<DiagramNodeDefinition & { band: DiagramBand }>,
  stage: HealthcareStage
) {
  const stageWeight = getStageWeight(stage)
  const primaryNodes = definitions.filter((node) => node.band === "primary")
  const supportNodes = definitions.filter((node) => node.band === "support")

  const primaryHeight = Math.max(
    ...primaryNodes.map((node) => node.h ?? DEFAULT_NODE_SIZE[node.type].h),
    0
  )

  const columnStep = 170 + stageWeight * 18
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
  const primaryTop = 96 - Math.min(stageWeight, 2) * 6
  const supportTop = primaryTop + primaryHeight + 108 + stageWeight * 16
  const controlTop =
    supportTop +
    (supportNodes.length > 0 ? supportBandDepth + 112 : 92) +
    stageWeight * 10

  const bandTops: Record<DiagramBand, number> = {
    primary: primaryTop,
    support: supportTop,
    control: controlTop,
  }

  return definitions.map<DiagramNode>((definition) => {
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

export function buildDiagramScene(
  diagram: DiagramView,
  stage: HealthcareStage = "off"
): DiagramScene {
  const nodes = layoutNodes(mergeNodeDefinitions(diagram, stage), stage)
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

export const diagramSections = [
  { label: "Healthcare Exemplars", category: "healthcare" },
  { label: "Control Patterns", category: "control" },
  { label: "Core Agentic Patterns", category: "core" },
] as const satisfies ReadonlyArray<{
  label: string
  category: DiagramCategory
}>
