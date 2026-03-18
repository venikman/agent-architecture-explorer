import { act, render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ThemeProvider } from "@/components/theme-provider"

function renderWithThemeProvider() {
  return render(
    <ThemeProvider defaultTheme="light">
      <div>theme target</div>
    </ThemeProvider>
  )
}

describe("ThemeProvider", () => {
  it("initializes from localStorage", () => {
    localStorage.setItem("theme", "dark")

    renderWithThemeProvider()

    expect(document.documentElement).toHaveClass("dark")
    expect(document.documentElement).not.toHaveClass("light")
  })

  it("toggles theme with the d key and ignores editable targets", async () => {
    const user = userEvent.setup()

    const { rerender } = render(
      <ThemeProvider defaultTheme="light">
        <button type="button">shell</button>
      </ThemeProvider>
    )

    expect(document.documentElement).toHaveClass("light")

    await user.keyboard("d")
    expect(document.documentElement).toHaveClass("dark")

    rerender(
      <ThemeProvider defaultTheme="light">
        <input aria-label="editable target" />
      </ThemeProvider>
    )

    const input = document.querySelector("input")
    input?.focus()
    await user.keyboard("d")

    expect(document.documentElement).toHaveClass("dark")
  })

  it("syncs theme changes from storage events", () => {
    renderWithThemeProvider()

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "theme",
          newValue: "dark",
          storageArea: window.localStorage,
        })
      )
    })

    expect(document.documentElement).toHaveClass("dark")
  })
})
