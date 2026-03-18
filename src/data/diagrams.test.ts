import {
  DEFAULT_DIAGRAM_ID,
  HEALTHCARE_STAGES,
  buildDiagramScene,
  diagramSections,
  diagrams,
  resolveDiagramId,
} from "@/data/diagrams"

function overlaps(
  first: { x: number; y: number; w: number; h: number },
  second: { x: number; y: number; w: number; h: number }
) {
  return !(
    first.x + first.w <= second.x ||
    second.x + second.w <= first.x ||
    first.y + first.h <= second.y ||
    second.y + second.h <= first.y
  )
}

describe("diagram catalog", () => {
  it("resolves invalid ids to the default diagram", () => {
    expect(resolveDiagramId("unknown-diagram")).toBe(DEFAULT_DIAGRAM_ID)
    expect(resolveDiagramId(DEFAULT_DIAGRAM_ID)).toBe(DEFAULT_DIAGRAM_ID)
  })

  it("compiles every pattern for every healthcare stage with stable node ids", () => {
    const diagramIds = new Set<string>()

    for (const diagram of diagrams) {
      expect(diagramIds.has(diagram.id)).toBe(false)
      diagramIds.add(diagram.id)

      const offScene = buildDiagramScene(diagram, "off")
      const offNodeIds = new Set(offScene.nodes.map((node) => node.id))

      for (const stage of HEALTHCARE_STAGES) {
        const scene = buildDiagramScene(diagram, stage)
        const nodes = scene.nodes
        const arrows = scene.arrows
        const nodeIds = new Set(nodes.map((node) => node.id))

        expect(nodeIds.size).toBe(nodes.length)

        for (const arrow of arrows) {
          expect(nodeIds.has(arrow.from)).toBe(true)
          expect(nodeIds.has(arrow.to)).toBe(true)
        }

        if (stage !== "off") {
          for (const nodeId of offNodeIds) {
            expect(nodeIds.has(nodeId)).toBe(true)
          }
        }
      }
    }
  })

  it("keeps diagram sections aligned with the catalog", () => {
    const sectionCategories = new Set(
      diagramSections.map((section) => section.category)
    )

    for (const diagram of diagrams) {
      expect(sectionCategories.has(diagram.category)).toBe(true)
    }

    for (const section of diagramSections) {
      expect(
        diagrams.some((diagram) => diagram.category === section.category)
      ).toBe(true)
    }

    expect(diagramSections[0]?.category).toBe("healthcare")
    expect(diagramSections[1]?.category).toBe("control")
    expect(diagramSections[2]?.category).toBe("core")
  })

  it("keeps healthcare control layers clear of support lanes", () => {
    for (const diagram of diagrams) {
      for (const stage of HEALTHCARE_STAGES.filter(
        (value) => value !== "off"
      )) {
        const scene = buildDiagramScene(diagram, stage)
        const supportNodes = scene.nodes.filter(
          (node) => node.band === "support"
        )
        const controlNodes = scene.nodes.filter(
          (node) => node.band === "control"
        )

        for (const supportNode of supportNodes) {
          for (const controlNode of controlNodes) {
            expect(
              overlaps(supportNode, controlNode),
              `${diagram.id}:${stage} overlaps ${supportNode.id} with ${controlNode.id}`
            ).toBe(false)
          }
        }
      }
    }
  })
})
