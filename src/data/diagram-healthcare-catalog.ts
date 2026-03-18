import { type DiagramView } from "@/data/diagram-core"
import {
  arrow,
  defineDiagram,
  ioNode,
  llmNode,
  supportNode,
  toolNode,
} from "@/data/diagram-catalog-shared"

export const healthcareDiagrams = [
  defineDiagram({
    id: "guideline-grounded-cds",
    category: "healthcare",
    title: "Guideline-Grounded CDS",
    subtitle:
      "Clinical decision support grounded in protocols and clinician review",
    summary:
      "A healthcare-first agentic pattern that blends guideline retrieval, synthesis, and clinician-facing recommendations.",
    nodes: [
      ioNode({
        id: "intake",
        label: "Patient Intake",
        column: 0,
        description:
          "Receives the presenting complaint, vitals, and structured case context.",
      }),
      llmNode({
        id: "llm",
        label: "LLM",
        column: 2,
        description:
          "Large Language Model — the reasoning core that synthesizes evidence into clinician-ready recommendations.",
      }),
      toolNode({
        id: "cds-brief",
        label: "CDS Brief",
        column: 4,
        description:
          "Assembles a concise recommendation with traceable evidence and rationale.",
      }),
      ioNode({
        id: "clinician",
        label: "Clinician",
        column: 6,
        description: "Reviews the recommendation and decides how to act on it.",
      }),
      supportNode("tool", {
        id: "guideline-retrieval",
        label: "Guideline\nRetrieval",
        column: 1,
        description:
          "Pulls policy, guideline, and evidence references into the active case context.",
      }),
      supportNode("tool", {
        id: "evidence-assembly",
        label: "Evidence\nAssembly",
        column: 3,
        description:
          "Normalizes citations, contraindications, and supporting detail for the model.",
      }),
    ],
    arrows: [
      arrow({ from: "intake", to: "llm" }),
      arrow({ from: "llm", to: "cds-brief" }),
      arrow({ from: "cds-brief", to: "clinician" }),
      arrow({ from: "guideline-retrieval", to: "llm", dashed: true }),
      arrow({ from: "evidence-assembly", to: "llm", dashed: true }),
      arrow({
        from: "guideline-retrieval",
        to: "evidence-assembly",
        dashed: true,
      }),
    ],
    healthcare: {
      ingress: "intake",
      core: "llm",
      egress: "cds-brief",
      oversight: "clinician",
    },
  }),
  defineDiagram({
    id: "hierarchical-parallel-review",
    category: "healthcare",
    title: "Hierarchical Parallel Review",
    subtitle:
      "A coordinating model fans work out to specialist reviewers, then re-converges",
    summary:
      "A multi-reviewer pattern for complex cases where parallel specialist checks feed a unified recommendation.",
    nodes: [
      ioNode({
        id: "case-intake",
        label: "Case Intake",
        column: 0,
        description:
          "Captures the initial patient context and review objective.",
      }),
      llmNode({
        id: "triage-llm",
        label: "Triage\nLLM",
        column: 2,
        description:
          "Plans the review and delegates the case into specialist tracks.",
      }),
      toolNode({
        id: "review-board",
        label: "Review Board",
        column: 6,
        description:
          "Aggregates specialist findings into a single clinician-facing decision packet.",
      }),
      ioNode({
        id: "clinician",
        label: "Clinician",
        column: 8,
        description:
          "Owns the final decision after reviewing the aggregated recommendations.",
      }),
      supportNode("llm", {
        id: "cardiology",
        label: "Cardiology\nReviewer",
        column: 4,
        description:
          "Examines cardiac signals, risk factors, and supporting context for the active case.",
      }),
      supportNode("llm", {
        id: "pharmacy",
        label: "Pharmacy\nReviewer",
        column: 4,
        lane: 1,
        description:
          "Checks medication safety, interactions, and dose constraints in parallel.",
      }),
      supportNode("llm", {
        id: "care-pathway",
        label: "Care Pathway\nReviewer",
        column: 4,
        lane: 2,
        description:
          "Reviews the case against pathway-specific expectations and escalation rules.",
      }),
    ],
    arrows: [
      arrow({ from: "case-intake", to: "triage-llm" }),
      arrow({ from: "triage-llm", to: "review-board" }),
      arrow({ from: "review-board", to: "clinician" }),
      arrow({ from: "triage-llm", to: "cardiology", dashed: true }),
      arrow({ from: "triage-llm", to: "pharmacy", dashed: true }),
      arrow({ from: "triage-llm", to: "care-pathway", dashed: true }),
      arrow({ from: "cardiology", to: "review-board", dashed: true }),
      arrow({ from: "pharmacy", to: "review-board", dashed: true }),
      arrow({ from: "care-pathway", to: "review-board", dashed: true }),
    ],
    healthcare: {
      ingress: "case-intake",
      core: "triage-llm",
      egress: "review-board",
      oversight: "clinician",
    },
  }),
] as const satisfies readonly DiagramView[]
