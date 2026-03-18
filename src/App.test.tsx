import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { App } from "@/App"

describe("App", () => {
  it("falls back to the default diagram when given an invalid initial view", () => {
    render(<App initialActiveView="not-a-real-diagram" />)

    expect(
      screen.getByRole("heading", { level: 2, name: /the augmented llm/i })
    ).toBeInTheDocument()
  })

  it("reveals healthcare stages and defaults to regulated", async () => {
    const user = userEvent.setup()

    render(<App initialActiveView="augmented-llm" />)

    expect(
      screen.queryByRole("button", { name: /regulated/i })
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /healthcare mode/i }))

    expect(screen.getByRole("button", { name: /regulated/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByText(/clinician approval/i)).toBeInTheDocument()
  })

  it("remembers the last healthcare stage when toggled off and on", async () => {
    const user = userEvent.setup()

    render(<App initialActiveView="augmented-llm" />)

    await user.click(screen.getByRole("button", { name: /healthcare mode/i }))
    await user.click(
      screen.getByRole("button", { name: /high-risk autonomy/i })
    )
    await user.click(screen.getByRole("button", { name: /healthcare mode/i }))
    await user.click(screen.getByRole("button", { name: /healthcare mode/i }))

    expect(
      screen.getByRole("button", { name: /high-risk autonomy/i })
    ).toHaveAttribute("aria-pressed", "true")
    expect(
      screen.getAllByText(/incident \/ rollback controls/i).length
    ).toBeGreaterThan(0)
  })

  it("opens the detail sheet from the read-only diagram interaction layer", async () => {
    const user = userEvent.setup()

    render(<App initialActiveView="augmented-llm" />)

    await user.click(await screen.findByRole("button", { name: /select llm/i }))

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(
      within(screen.getByRole("dialog")).getByText(/large language model/i)
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole("dialog")).getByText(/f#-style sketch/i)
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole("dialog")).getByText(/let llm payload =/i)
    ).toBeInTheDocument()
  })

  it("clears the selected node when switching to another pattern", async () => {
    const user = userEvent.setup()

    render(<App initialActiveView="augmented-llm" />)

    await user.click(await screen.findByRole("button", { name: /select llm/i }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: /guideline-grounded cds/i })
    )

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
