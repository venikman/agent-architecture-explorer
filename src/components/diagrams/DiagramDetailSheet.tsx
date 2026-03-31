import {
  HEALTHCARE_STAGE_LABELS,
  NODE_COLORS,
  type DiagramConnection,
  type DiagramNodeDetailContext,
  type DiagramNode,
  type NodeType,
} from "@/data/diagrams"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useMediaQuery } from "@/hooks/use-media-query"

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  llm: "LLM component",
  io: "Input / output",
  tool: "Tool / utility",
  danger: "Healthcare control",
}

interface DiagramDetailSheetProps {
  context: DiagramNodeDetailContext | null
  node: DiagramNode | null
  onOpenChange: (open: boolean) => void
}

const NODE_BAND_LABELS: Record<DiagramNode["band"], string> = {
  primary: "Primary flow",
  support: "Support lane",
  control: "Control layer",
}

function normalizeLabel(label: string) {
  return label.replaceAll("\n", " ")
}

function toFsIdentifier(label: string) {
  const words = normalizeLabel(label)
    .replaceAll("&", " and ")
    .replaceAll("/", " ")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) {
    return "nodeStep"
  }

  return words
    .map((word, index) =>
      index === 0
        ? word.charAt(0).toLowerCase() + word.slice(1)
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("")
}

function formatFsList(labels: string[]) {
  return labels.map((label) => `"${label}"`).join("; ")
}

function formatConnectionSummary(
  connections: DiagramConnection[],
  emptyLabel: string
) {
  if (connections.length === 0) {
    return emptyLabel
  }

  return connections.map((connection) => connection.label).join(" · ")
}

function buildRoleSummary(
  node: DiagramNode,
  context: DiagramNodeDetailContext
) {
  const primaryInputs = context.incoming.primary.map(
    (connection) => connection.label
  )
  const optionalInputs = context.incoming.conditional.map(
    (connection) => connection.label
  )
  const primaryOutputs = context.outgoing.primary.map(
    (connection) => connection.label
  )
  const optionalOutputs = context.outgoing.conditional.map(
    (connection) => connection.label
  )

  const sentences = [
    `${normalizeLabel(node.label)} sits in the ${NODE_BAND_LABELS[context.band].toLowerCase()} of ${context.patternTitle}.`,
  ]

  if (primaryInputs.length > 0) {
    sentences.push(
      `It receives the main handoff from ${primaryInputs.join(", ")}.`
    )
  }

  if (optionalInputs.length > 0) {
    sentences.push(
      `It also listens to conditional signals from ${optionalInputs.join(", ")}.`
    )
  }

  if (primaryOutputs.length > 0) {
    sentences.push(`Its primary output flows to ${primaryOutputs.join(", ")}.`)
  }

  if (optionalOutputs.length > 0) {
    sentences.push(
      `Optional branches fan out toward ${optionalOutputs.join(", ")}.`
    )
  }

  return sentences.join(" ")
}

function buildFunctionalSketch(
  node: DiagramNode,
  context: DiagramNodeDetailContext
) {
  const identifier = toFsIdentifier(node.label)
  const primaryInputs = context.incoming.primary.map(
    (connection) => connection.label
  )
  const optionalInputs = context.incoming.conditional.map(
    (connection) => connection.label
  )
  const primaryOutputs = context.outgoing.primary.map(
    (connection) => connection.label
  )
  const optionalOutputs = context.outgoing.conditional.map(
    (connection) => connection.label
  )

  const lines = [`let ${identifier} payload =`, "    payload"]

  if (primaryInputs.length > 0) {
    lines.push(`    |> acceptFrom [ ${formatFsList(primaryInputs)} ]`)
  }

  if (optionalInputs.length > 0) {
    lines.push(`    |> mergeSignals [ ${formatFsList(optionalInputs)} ]`)
  }

  switch (node.type) {
    case "llm":
      lines.push(`    |> callModel "${normalizeLabel(node.label)}"`)
      break
    case "io":
      lines.push(
        context.incoming.primary.length + context.incoming.conditional.length ===
          0
          ? `    |> captureInput "${normalizeLabel(node.label)}"`
          : `    |> presentToOperator "${normalizeLabel(node.label)}"`
      )
      break
    case "tool":
      lines.push(`    |> runTool "${normalizeLabel(node.label)}"`)
      break
    case "danger":
      lines.push(`    |> enforceControl "${normalizeLabel(node.label)}"`)
      break
  }

  if (primaryOutputs.length > 0) {
    lines.push(`    |> routeTo [ ${formatFsList(primaryOutputs)} ]`)
  }

  if (optionalOutputs.length > 0) {
    lines.push(`    |> fanOutIfNeeded [ ${formatFsList(optionalOutputs)} ]`)
  }

  return lines.join("\n")
}

/* ── Section title with accent bar ── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <CardTitle className="flex items-center gap-2">
      <span
        className="inline-block h-3.5 w-0.5 rounded-full"
        style={{ background: "var(--humble-accent)" }}
      />
      {children}
    </CardTitle>
  )
}

/* ── Kicker label ── */
function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[0.6rem] font-bold tracking-[0.2em] uppercase"
      style={{ color: "var(--humble-accent)" }}
    >
      {children}
    </p>
  )
}

export function DiagramDetailSheet({
  context,
  node,
  onOpenChange,
}: DiagramDetailSheetProps) {
  const isMobile = useMediaQuery("(max-width: 767px)")

  if (!node || !context) {
    return null
  }

  const colors = NODE_COLORS[node.type]
  const roleSummary = buildRoleSummary(node, context)
  const functionalSketch = buildFunctionalSketch(node, context)
  const stageLabel = HEALTHCARE_STAGE_LABELS[context.stage]
  const incomingPrimary = context.incoming.primary
  const incomingConditional = context.incoming.conditional
  const outgoingPrimary = context.outgoing.primary
  const outgoingConditional = context.outgoing.conditional

  return (
    <Sheet modal={isMobile} open={Boolean(node)} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex h-auto max-h-[85vh] w-full max-w-[28rem] flex-col gap-0 border-l bg-background p-0 sm:h-full sm:max-h-none sm:max-w-lg"
        side={isMobile ? "bottom" : "right"}
      >
        <SheetHeader className="gap-3 border-b px-5 py-5">
          <Badge
            className="w-fit font-semibold"
            style={{
              background: colors.fill,
              borderColor: colors.border,
              color: colors.text,
            }}
            variant={node.type === "danger" ? "destructive" : "outline"}
          >
            {NODE_TYPE_LABELS[node.type]}
          </Badge>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <div
                className="h-5 w-1 rounded-full"
                style={{ background: colors.border }}
              />
              <SheetTitle className="text-lg font-bold tracking-tight">{node.label}</SheetTitle>
            </div>
            <SheetDescription className="leading-relaxed">
              Additional context for this node in the active pattern.
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-auto px-5 py-5">
          <Card size="sm">
            <CardContent className="ui-detail-copy p-0 leading-relaxed">
              {node.description}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <SectionTitle>Pattern role</SectionTitle>
              <CardDescription className="leading-relaxed">
                What this node does inside the currently selected flow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm/7 text-muted-foreground">{roleSummary}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Kicker>Pattern</Kicker>
                  <p className="text-sm font-medium">{context.patternTitle}</p>
                </div>
                <div className="space-y-1.5">
                  <Kicker>Stage</Kicker>
                  <p className="text-sm font-medium">{stageLabel}</p>
                </div>
                <div className="space-y-1.5">
                  <Kicker>Lane</Kicker>
                  <p className="text-sm font-medium">{NODE_BAND_LABELS[context.band]}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <SectionTitle>Flow map</SectionTitle>
              <CardDescription className="leading-relaxed">
                Primary handoffs and conditional branches around this node.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Kicker>Receives from</Kicker>
                <p className="text-sm/7 font-medium">
                  {formatConnectionSummary(
                    incomingPrimary,
                    "Pattern entry point"
                  )}
                </p>
                {incomingConditional.length > 0 ? (
                  <p className="text-xs/6 text-muted-foreground">
                    Conditional:{" "}
                    {formatConnectionSummary(incomingConditional, "None")}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Kicker>Sends to</Kicker>
                <p className="text-sm/7 font-medium">
                  {formatConnectionSummary(outgoingPrimary, "Terminal output")}
                </p>
                {outgoingConditional.length > 0 ? (
                  <p className="text-xs/6 text-muted-foreground">
                    Conditional:{" "}
                    {formatConnectionSummary(outgoingConditional, "None")}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <SectionTitle>F#-style sketch</SectionTitle>
              <CardDescription className="leading-relaxed">
                A compact functional view of this node's responsibility.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <pre className="overflow-x-auto rounded-lg border border-border/70 bg-muted/30 p-3.5 font-mono text-[11px] leading-6 text-foreground">
                <code>{functionalSketch}</code>
              </pre>
              <p className="text-xs/6 text-muted-foreground leading-relaxed">
                Read this as a pure pipeline: inputs arrive, optional context is
                merged, the node performs one focused transformation, then the
                result is routed onward.
              </p>
            </CardContent>
          </Card>

          {node.type === "danger" ? (
            <Card
              size="sm"
              style={{
                background: colors.fill,
                borderColor: colors.border,
                color: colors.text,
              }}
            >
              <CardContent className="p-0 text-sm/7 font-medium">
                This step is introduced when healthcare constraints are active.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
