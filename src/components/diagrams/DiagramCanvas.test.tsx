import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { DiagramCanvas } from "@/components/diagrams/DiagramCanvas"
import { getDiagramById } from "@/data/diagrams"

describe("DiagramCanvas", () => {
  it("clears the selected node when the active diagram changes", async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <DiagramCanvas
        diagram={getDiagramById("augmented-llm")}
        healthcareStage="off"
      />
    )

    await user.click(await screen.findByRole("button", { name: /select llm/i }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(
      within(screen.getByRole("dialog")).getByText(/processes inputs/i)
    ).toBeInTheDocument()

    rerender(
      <DiagramCanvas
        diagram={getDiagramById("guideline-grounded-cds")}
        healthcareStage="off"
      />
    )

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
