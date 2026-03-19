import * as React from "react"
import {
  Menu01Icon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  DATA_FLOW_COLORS,
  DEFAULT_DIAGRAM_ID,
  HEALTHCARE_ACTIVE_STAGES,
  HEALTHCARE_STAGE_LABELS,
  NODE_COLORS,
  diagramSections,
  diagrams,
  getDiagramById,
  type DiagramId,
  type HealthcareStage,
} from "@/data/diagrams"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const LazyDiagramCanvas = React.lazy(async () => {
  const module = await import("@/components/diagrams/DiagramCanvas")
  return { default: module.DiagramCanvas }
})

const STAGE_EXPLAINERS: Record<Exclude<HealthcareStage, "off">, string> = {
  foundational:
    "Adds PHI minimization, audit trail coverage, minimum-necessary access, and source visibility.",
  regulated:
    "Adds policy gates, clinician approval, guideline grounding, and disclosure controls.",
  highRisk:
    "Adds sandboxing, emergency halt controls, periodic human checkpoints, and incident / rollback controls.",
}

interface SidebarContentProps {
  activeView: DiagramId
  healthcareStage: HealthcareStage
  onNavigate?: () => void
  setActiveView: (value: DiagramId) => void
  setHealthcareStage: (value: HealthcareStage) => void
  toggleHealthcare: () => void
}

const navigationSections = diagramSections.map((section) => ({
  ...section,
  diagrams: diagrams.filter((diagram) => diagram.category === section.category),
}))

function useHealthcareStage() {
  const [healthcareStage, setHealthcareStageState] =
    React.useState<HealthcareStage>("off")
  const [lastHealthcareStage, setLastHealthcareStage] = React.useState<
    Exclude<HealthcareStage, "off">
  >("regulated")

  const setHealthcareStage = React.useCallback((nextStage: HealthcareStage) => {
    if (nextStage !== "off") {
      setLastHealthcareStage(nextStage)
    }

    setHealthcareStageState(nextStage)
  }, [])

  const toggleHealthcare = React.useCallback(() => {
    setHealthcareStageState((currentStage) => {
      if (currentStage === "off") {
        return lastHealthcareStage
      }

      setLastHealthcareStage(currentStage)
      return "off"
    })
  }, [lastHealthcareStage])

  return {
    healthcareStage,
    setHealthcareStage,
    toggleHealthcare,
  }
}

function LegendSwatch({
  label,
  type,
}: {
  label: string
  type: keyof typeof NODE_COLORS
}) {
  const isPill = type === "io"

  return (
    <div className="ui-legend-row">
      <div
        className={
          isPill
            ? "h-3 w-4 rounded-full border"
            : "h-3 w-4 rounded-[2px] border"
        }
        style={{
          background: NODE_COLORS[type].fill,
          borderColor: NODE_COLORS[type].border,
        }}
      />
      <span className="ui-copy-sm">{label}</span>
    </div>
  )
}

function SidebarContent({
  activeView,
  healthcareStage,
  onNavigate,
  setActiveView,
  setHealthcareStage,
  toggleHealthcare,
}: SidebarContentProps) {
  const healthcareActive = healthcareStage !== "off"

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex flex-col gap-4 px-4 pt-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-base font-semibold tracking-tight">
            Agent Architecture
          </h1>
          <p className="ui-copy-sm">Interactive Pattern Explorer</p>
        </div>

        <Separator />
      </div>

      <nav className="flex flex-col gap-4 px-4 py-2">
        {navigationSections.map((section) => {
          return (
            <div className="flex flex-col gap-2" key={section.category}>
              <p className="ui-kicker">{section.label}</p>
              <div className="flex flex-col gap-1">
                {section.diagrams.map((diagram) => {
                  const isActive = diagram.id === activeView

                  return (
                    <Button
                      aria-current={isActive ? "page" : undefined}
                      className="h-auto justify-start px-3 py-2 text-left"
                      key={diagram.id}
                      onClick={() => {
                        setActiveView(diagram.id)
                        onNavigate?.()
                      }}
                      variant={isActive ? "secondary" : "ghost"}
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{
                          background: isActive
                            ? NODE_COLORS.llm.text
                            : "var(--diagram-dot-muted)",
                        }}
                      />
                      <span className="truncate">{diagram.title}</span>
                    </Button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="flex flex-col gap-4 px-4 pb-5">
        <Separator />

        <div className="flex flex-col gap-3">
          <Button
            className="h-auto justify-between px-3 py-3"
            onClick={toggleHealthcare}
          variant={healthcareActive ? "destructive" : "outline"}
        >
          <span>Healthcare Mode</span>
          <Badge variant={healthcareActive ? "destructive" : "outline"}>
            {healthcareActive ? "On" : "Off"}
          </Badge>
        </Button>

        {healthcareActive ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {HEALTHCARE_ACTIVE_STAGES.map((stage) => {
                const isActive = healthcareStage === stage

                return (
                  <Button
                    aria-pressed={isActive}
                    className="h-auto px-3 py-2"
                    key={stage}
                    onClick={() => setHealthcareStage(stage)}
                    size="sm"
                    variant={isActive ? "secondary" : "outline"}
                  >
                    {HEALTHCARE_STAGE_LABELS[stage]}
                  </Button>
                )
              })}
            </div>
            <p className="ui-copy-sm">{STAGE_EXPLAINERS[healthcareStage]}</p>
          </div>
        ) : (
          <p className="ui-copy-sm">
            Enable this to reveal the staged healthcare controls required for
            safe deployment.
          </p>
        )}
      </div>

      <Card size="sm">
        <CardHeader className="gap-1">
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <LegendSwatch label="LLM" type="llm" />
          <LegendSwatch label="I/O & Human" type="io" />
          <LegendSwatch label="Tool / Utility" type="tool" />
          <LegendSwatch label="Healthcare control" type="danger" />
          <Separator />
          <div className="flex items-center gap-2">
            <svg aria-hidden="true" className="shrink-0" height="2" width="16">
              <line
                stroke="var(--diagram-arrow)"
                strokeWidth="1.5"
                x1="0"
                x2="16"
                y1="1"
                y2="1"
              />
            </svg>
            <span className="ui-copy-sm">Definite flow</span>
          </div>
          <div className="flex items-center gap-2">
            <svg aria-hidden="true" className="shrink-0" height="2" width="16">
              <line
                stroke="var(--diagram-arrow)"
                strokeDasharray="4 3"
                strokeWidth="1.5"
                x1="0"
                x2="16"
                y1="1"
                y2="1"
              />
            </svg>
            <span className="ui-copy-sm">Conditional</span>
          </div>
          <Separator />
          <p className="text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground/70">
            Data flow
          </p>
          {(Object.entries(DATA_FLOW_COLORS) as [string, { dot: string; label: string }][]).map(
            ([key, { dot, label }]) => (
              <div className="flex items-center gap-2" key={key}>
                <svg aria-hidden="true" className="shrink-0" height="8" width="16">
                  <circle cx="8" cy="4" r="3.5" fill={dot} opacity={0.75} />
                </svg>
                <span className="ui-copy-sm">{label}</span>
              </div>
            )
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

export function App() {
  const [activeView, setActiveView] = React.useState<DiagramId>(
    DEFAULT_DIAGRAM_ID
  )
  const { healthcareStage, setHealthcareStage, toggleHealthcare } =
    useHealthcareStage()
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true)

  const healthcareActive = healthcareStage !== "off"
  const diagram = React.useMemo(() => getDiagramById(activeView), [activeView])

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* ─── Mobile nav sheet ─── */}
      <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <SheetTrigger render={<Button size="sm" variant="outline" />}>
              <HugeiconsIcon data-icon="inline-start" icon={Menu01Icon} />
              Browse Patterns
            </SheetTrigger>

            {healthcareActive ? (
              <Badge variant="destructive">
                {HEALTHCARE_STAGE_LABELS[healthcareStage]}
              </Badge>
            ) : null}
          </div>
        </div>

        <SheetContent
          aria-label="Pattern Navigation"
          className="w-full max-w-[22rem] border-r p-0"
          side="left"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Pattern Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent
            activeView={activeView}
            healthcareStage={healthcareStage}
            onNavigate={() => setIsMobileNavOpen(false)}
            setActiveView={setActiveView}
            setHealthcareStage={setHealthcareStage}
            toggleHealthcare={toggleHealthcare}
          />
        </SheetContent>
      </Sheet>

      {/* ─── Desktop layout ─── */}
      <div
        className="hidden lg:grid lg:min-h-dvh"
        style={{
          gridTemplateColumns: isSidebarOpen
            ? "18rem minmax(0, 1fr)"
            : "0 minmax(0, 1fr)",
          transition: "grid-template-columns 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        {/* Sidebar */}
        <aside className="sticky top-0 relative flex h-dvh flex-col overflow-hidden border-r bg-card/30">
          <div
            className="flex h-dvh w-[18rem] flex-col"
            style={{
              opacity: isSidebarOpen ? 1 : 0,
              transition: "opacity 0.2s ease",
              pointerEvents: isSidebarOpen ? "auto" : "none",
            }}
          >
            <SidebarContent
              activeView={activeView}
              healthcareStage={healthcareStage}
              setActiveView={setActiveView}
              setHealthcareStage={setHealthcareStage}
              toggleHealthcare={toggleHealthcare}
            />
          </div>

          {/* Sidebar collapse toggle — only visible when sidebar is open */}
          {isSidebarOpen ? (
            <Button
              aria-label="Collapse sidebar"
              className="absolute top-3 right-0 z-10 translate-x-1/2 rounded-full border bg-background shadow-md transition-all hover:shadow-lg"
              onClick={() => setIsSidebarOpen(false)}
              size="icon-xs"
              variant="outline"
            >
              <HugeiconsIcon icon={PanelLeftCloseIcon} />
            </Button>
          ) : null}
        </aside>

        {/* Main content */}
        <main className="min-w-0">
          {/* Expand button when sidebar is collapsed — inside main area */}
          {!isSidebarOpen ? (
            <Button
              aria-label="Expand sidebar"
              className="fixed top-3 left-3 z-30 rounded-full border shadow-md"
              onClick={() => setIsSidebarOpen(true)}
              size="icon-sm"
              variant="outline"
            >
              <HugeiconsIcon icon={PanelLeftOpenIcon} />
            </Button>
          ) : null}

          <div className="flex flex-col gap-3 border-b px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div
                    className="h-5 w-1 rounded-full"
                    style={{ background: NODE_COLORS.llm.text }}
                  />
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {diagram.title}
                  </h2>
                </div>
                <p className="ui-copy-base">{diagram.subtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Open nodes with detail markers</Badge>
                {healthcareActive ? (
                  <Badge variant="destructive">
                    {HEALTHCARE_STAGE_LABELS[healthcareStage]}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
            <React.Suspense
              fallback={
                <Card className="border border-border/70 bg-card/40">
                  <CardContent className="ui-detail-copy py-6">
                    Loading interactive diagram surface…
                  </CardContent>
                </Card>
              }
            >
              <LazyDiagramCanvas
                diagram={diagram}
                healthcareStage={healthcareStage}
              />
            </React.Suspense>
          </div>
        </main>
      </div>

      {/* ─── Mobile layout (below lg) ─── */}
      <div className="lg:hidden">
        <main className="min-w-0">
          <div className="flex flex-col gap-3 border-b px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div
                    className="h-5 w-1 rounded-full"
                    style={{ background: NODE_COLORS.llm.text }}
                  />
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {diagram.title}
                  </h2>
                </div>
                <p className="ui-copy-base">{diagram.subtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Open nodes with detail markers</Badge>
                {healthcareActive ? (
                  <Badge variant="destructive">
                    {HEALTHCARE_STAGE_LABELS[healthcareStage]}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
            <React.Suspense
              fallback={
                <Card className="border border-border/70 bg-card/40">
                  <CardContent className="ui-detail-copy py-6">
                    Loading interactive diagram surface…
                  </CardContent>
                </Card>
              }
            >
              <LazyDiagramCanvas
                diagram={diagram}
                healthcareStage={healthcareStage}
              />
            </React.Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
