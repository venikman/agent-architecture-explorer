import { type DiagramView } from "@/data/diagram-core"
import {
  arrow,
  defineDiagram,
  ioNode,
  llmNode,
  supportNode,
  toolNode,
} from "@/data/diagram-catalog-shared"

export const controlDiagrams = [
  defineDiagram({
    id: "guardrailed-single-agent-loop",
    category: "control",
    title: "Guardrailed Single-Agent Loop",
    subtitle:
      "One agent operates in a bounded loop with explicit control checkpoints",
    summary:
      "A compact control pattern that keeps one agent effective without letting it drift into unbounded autonomy.",
    nodes: [
      ioNode({
        id: "request",
        label: "Request",
        column: 0,
        description: "The incoming task, message, or operational request.",
      }),
      llmNode({
        id: "agent",
        label: "Agent",
        column: 2,
        description:
          "Large Language Model — the planning and execution core responsible for choosing the next action.",
      }),
      ioNode({
        id: "response",
        label: "Response",
        column: 6,
        description:
          "The released answer or action summary after the loop resolves.",
      }),
      supportNode("tool", {
        id: "tooling",
        label: "Tooling",
        column: 3,
        description:
          "External systems and APIs that the agent calls inside the loop.",
      }),
      supportNode("tool", {
        id: "evaluator",
        label: "Evaluator",
        column: 5,
        description:
          "Scores the latest step and decides whether the agent can continue or must stop.",
      }),
    ],
    arrows: [
      arrow({ from: "request", to: "agent" }),
      arrow({ from: "agent", to: "response" }),
      arrow({ from: "agent", to: "tooling", dashed: true }),
      arrow({ from: "tooling", to: "agent", dashed: true }),
      arrow({ from: "agent", to: "evaluator", dashed: true }),
      arrow({ from: "evaluator", to: "agent", dashed: true }),
    ],
    healthcare: {
      ingress: "request",
      core: "agent",
      egress: "response",
    },
  }),
  defineDiagram({
    id: "human-approval-dual-control",
    category: "control",
    title: "Human Approval / Dual Control",
    subtitle: "The model drafts, but release requires explicit human sign-off",
    summary:
      "A release-control pattern for sensitive workflows where a model can prepare work but cannot ship it alone.",
    nodes: [
      ioNode({
        id: "request",
        label: "Request",
        column: 0,
        description: "The incoming ask that needs a reviewed answer or action.",
      }),
      llmNode({
        id: "draft-llm",
        label: "Draft\nLLM",
        column: 2,
        description:
          "Large Language Model — drafts the recommendation, action plan, or first-pass answer.",
      }),
      toolNode({
        id: "dual-control",
        label: "Dual Control",
        column: 4,
        description:
          "Aggregates approval requirements so no single actor can release the result alone.",
      }),
      ioNode({
        id: "release",
        label: "Release",
        column: 6,
        description: "The approved output that can now move downstream.",
      }),
      supportNode("io", {
        id: "reviewer-a",
        label: "Reviewer A",
        column: 3,
        description:
          "Performs the first approval pass against policy, quality, and safety constraints.",
      }),
      supportNode("io", {
        id: "reviewer-b",
        label: "Reviewer B",
        column: 5,
        description:
          "Performs the second independent approval pass before release.",
      }),
    ],
    arrows: [
      arrow({ from: "request", to: "draft-llm" }),
      arrow({ from: "draft-llm", to: "dual-control" }),
      arrow({ from: "dual-control", to: "release" }),
      arrow({ from: "reviewer-a", to: "dual-control", dashed: true }),
      arrow({ from: "reviewer-b", to: "dual-control", dashed: true }),
    ],
    healthcare: {
      ingress: "request",
      core: "draft-llm",
      egress: "release",
      oversight: "reviewer-b",
    },
  }),
  defineDiagram({
    id: "specialist-escalation",
    category: "control",
    title: "Single-Agent -> Specialist Escalation",
    subtitle:
      "A primary agent routes harder cases into specialist review paths",
    summary:
      "A control pattern that starts simple but escalates when risk, complexity, or uncertainty crosses a threshold.",
    nodes: [
      ioNode({
        id: "request",
        label: "Request",
        column: 0,
        description: "The incoming case or task requiring triage.",
      }),
      llmNode({
        id: "primary-agent",
        label: "Primary\nAgent",
        column: 2,
        description:
          "Large Language Model — handles straightforward requests and decides when escalation is required.",
      }),
      llmNode({
        id: "specialist",
        label: "Specialist\nAgent",
        column: 4,
        description:
          "Takes over when the request requires domain-specific depth or a different operating policy.",
      }),
      ioNode({
        id: "decision",
        label: "Decision",
        column: 6,
        description:
          "The final routed output after the specialist or primary path resolves.",
      }),
      supportNode("tool", {
        id: "thresholds",
        label: "Escalation\nThresholds",
        column: 3,
        description:
          "Defines the conditions that force escalation into the specialist path.",
      }),
    ],
    arrows: [
      arrow({ from: "request", to: "primary-agent" }),
      arrow({ from: "primary-agent", to: "decision", dashed: true }),
      arrow({ from: "primary-agent", to: "specialist" }),
      arrow({ from: "specialist", to: "decision" }),
      arrow({ from: "thresholds", to: "primary-agent", dashed: true }),
    ],
    healthcare: {
      ingress: "request",
      core: "primary-agent",
      egress: "decision",
    },
  }),
  defineDiagram({
    id: "shadow-mode-incident-loop",
    category: "control",
    title: "Shadow Mode / Eval / Incident Loop",
    subtitle:
      "A live path runs in parallel with shadow evaluation and rollback logic",
    summary:
      "A deployment control pattern that measures model behavior safely before expanding autonomy.",
    nodes: [
      ioNode({
        id: "live-input",
        label: "Live Input",
        column: 0,
        description:
          "Production traffic mirrored into the active and shadow paths.",
      }),
      llmNode({
        id: "production-agent",
        label: "Production\nAgent",
        column: 2,
        description:
          "Large Language Model — the primary path handling live work under current release rules.",
      }),
      ioNode({
        id: "release",
        label: "Release",
        column: 6,
        description:
          "The live output that reaches users or downstream systems.",
      }),
      supportNode("llm", {
        id: "shadow-agent",
        label: "Shadow\nAgent",
        column: 3,
        description:
          "Runs in parallel against mirrored input without affecting production outcomes.",
      }),
      supportNode("tool", {
        id: "eval-loop",
        label: "Eval Loop",
        column: 5,
        description:
          "Scores drift, regressions, and incident signals between the live and shadow paths.",
      }),
    ],
    arrows: [
      arrow({ from: "live-input", to: "production-agent" }),
      arrow({ from: "production-agent", to: "release" }),
      arrow({ from: "live-input", to: "shadow-agent", dashed: true }),
      arrow({ from: "shadow-agent", to: "eval-loop", dashed: true }),
      arrow({ from: "production-agent", to: "eval-loop", dashed: true }),
    ],
    healthcare: {
      ingress: "live-input",
      core: "production-agent",
      egress: "release",
    },
  }),
] as const satisfies readonly DiagramView[]
