import { type DiagramView } from "@/data/diagram-core"
import {
  arrow,
  defineDiagram,
  ioNode,
  llmNode,
  supportNode,
  toolNode,
} from "@/data/diagram-catalog-shared"

export const coreDiagrams = [
  defineDiagram({
    id: "augmented-llm",
    category: "core",
    title: "The Augmented LLM",
    subtitle: "The basic building block of agentic systems",
    summary:
      "The canonical agentic primitive: one model, richer context, and external capability hooks.",
    nodes: [
      ioNode({
        id: "input",
        label: "Input",
        column: 0,
      }),
      llmNode({
        id: "llm",
        label: "LLM",
        column: 2,
        description:
          "Large Language Model — the reasoning core that processes inputs, chooses tools, and produces outputs.",
      }),
      ioNode({
        id: "output",
        label: "Output",
        column: 6,
      }),
      supportNode("tool", {
        id: "retrieval",
        label: "Retrieval",
        column: 1,
        description:
          "Fetches relevant context from knowledge stores and search systems.",
      }),
      supportNode("tool", {
        id: "tools",
        label: "Tools",
        column: 3,
        description:
          "Extends the model with APIs, code execution, or transactional operations.",
      }),
      supportNode("tool", {
        id: "memory",
        label: "Memory",
        column: 5,
        description:
          "Provides short- and long-term context for future reasoning steps.",
      }),
    ],
    arrows: [
      arrow({ from: "input", to: "llm" }),
      arrow({ from: "llm", to: "output" }),
      arrow({ from: "llm", to: "retrieval", dashed: true }),
      arrow({ from: "retrieval", to: "llm", dashed: true }),
      arrow({ from: "llm", to: "tools", dashed: true }),
      arrow({ from: "tools", to: "llm", dashed: true }),
      arrow({ from: "llm", to: "memory", dashed: true }),
      arrow({ from: "memory", to: "llm", dashed: true }),
    ],
    healthcare: {
      ingress: "input",
      core: "llm",
      egress: "output",
    },
  }),
  defineDiagram({
    id: "prompt-chaining",
    category: "core",
    title: "Prompt Chaining",
    subtitle: "Sequential model calls where each output feeds the next",
    summary:
      "A modular pattern for decomposing work into staged reasoning and quality gates.",
    nodes: [
      ioNode({
        id: "input",
        label: "Input",
        column: 0,
      }),
      llmNode({
        id: "call-1",
        label: "LLM Call 1",
        column: 2,
        description: "Runs the first analysis or transformation pass.",
      }),
      toolNode({
        id: "gate",
        label: "Gate",
        column: 4,
        description: "Checks quality before the chain continues.",
      }),
      llmNode({
        id: "call-2",
        label: "LLM Call 2",
        column: 6,
        description:
          "Refines, expands, or rewrites the result after the gate passes.",
      }),
      ioNode({
        id: "output",
        label: "Output",
        column: 8,
      }),
      supportNode("io", {
        id: "exit",
        label: "Exit",
        column: 4,
        description:
          "Stops the chain when the result is not good enough to continue.",
      }),
    ],
    arrows: [
      arrow({ from: "input", to: "call-1" }),
      arrow({ from: "call-1", to: "gate", label: "Pass forward" }),
      arrow({ from: "gate", to: "call-2" }),
      arrow({ from: "call-2", to: "output" }),
      arrow({ from: "gate", to: "exit", dashed: true, label: "Fail" }),
    ],
    healthcare: {
      ingress: "input",
      core: "call-1",
      egress: "output",
    },
  }),
  defineDiagram({
    id: "routing",
    category: "core",
    title: "Routing",
    subtitle: "A classifier routes work to the best specialist path",
    summary:
      "A routing pattern that protects latency and quality by selecting the right path for each request.",
    nodes: [
      ioNode({
        id: "input",
        label: "Input",
        column: 0,
      }),
      llmNode({
        id: "router",
        label: "LLM Router",
        column: 2,
        description:
          "Classifies input and routes work to the specialist path with the best expected quality / latency tradeoff.",
      }),
      ioNode({
        id: "output",
        label: "Output",
        column: 8,
      }),
      supportNode("llm", {
        id: "fast-path",
        label: "Fast Path",
        column: 4,
        description:
          "Handles lower-risk requests with the lightest specialist path.",
      }),
      supportNode("llm", {
        id: "expert-path",
        label: "Expert Path",
        column: 6,
        description: "Takes over for more complex or higher-risk requests.",
      }),
    ],
    arrows: [
      arrow({ from: "input", to: "router" }),
      arrow({ from: "router", to: "fast-path", dashed: true }),
      arrow({ from: "router", to: "expert-path", dashed: true }),
      arrow({ from: "fast-path", to: "output" }),
      arrow({ from: "expert-path", to: "output" }),
    ],
    healthcare: {
      ingress: "input",
      core: "router",
      egress: "output",
    },
  }),
  defineDiagram({
    id: "parallelization",
    category: "core",
    title: "Parallelization",
    subtitle: "Independent branches run concurrently, then re-converge",
    summary:
      "A throughput pattern for splitting work into parallel specialist passes and recombining the results.",
    nodes: [
      ioNode({
        id: "input",
        label: "Input",
        column: 0,
      }),
      supportNode("llm", {
        id: "branch-a",
        label: "Branch A",
        column: 2,
        description: "Runs one specialist branch in parallel with the others.",
      }),
      supportNode("llm", {
        id: "branch-b",
        label: "Branch B",
        column: 4,
        description: "Runs a second specialist branch against the same input.",
      }),
      supportNode("llm", {
        id: "branch-c",
        label: "Branch C",
        column: 6,
        description:
          "Runs a third parallel branch when decomposition makes sense.",
      }),
      toolNode({
        id: "aggregator",
        label: "Aggregator",
        column: 8,
        description: "Reconciles branch outputs into one downstream answer.",
      }),
      ioNode({
        id: "output",
        label: "Output",
        column: 10,
      }),
    ],
    arrows: [
      arrow({ from: "input", to: "branch-a", dashed: true }),
      arrow({ from: "input", to: "branch-b", dashed: true }),
      arrow({ from: "input", to: "branch-c", dashed: true }),
      arrow({ from: "branch-a", to: "aggregator", dashed: true }),
      arrow({ from: "branch-b", to: "aggregator", dashed: true }),
      arrow({ from: "branch-c", to: "aggregator", dashed: true }),
      arrow({ from: "aggregator", to: "output" }),
    ],
    healthcare: {
      ingress: "input",
      core: "aggregator",
      egress: "output",
    },
  }),
] as const satisfies readonly DiagramView[]
