import type { Page } from "@playwright/test"
import { expect, test } from "@playwright/test"

function wireErrorCollection(page: Page) {
  const messages: string[] = []

  page.on("console", (message) => {
    if (message.type() === "error") {
      messages.push(message.text())
    }
  })

  page.on("pageerror", (error) => {
    messages.push(error.message)
  })

  return messages
}

test("desktop flow stays interactive without console errors", async ({
  page,
}) => {
  const errors = wireErrorCollection(page)

  await page.goto("/")

  await expect(
    page.getByRole("heading", { level: 2, name: /the augmented llm/i })
  ).toBeVisible()

  await page.getByRole("button", { name: /select llm/i }).click()
  const detailDialog = page.getByRole("dialog")
  await expect(detailDialog).toBeVisible()
  await expect(
    detailDialog.getByText(/large language model/i).first()
  ).toBeVisible()

  await page.getByRole("button", { name: /healthcare mode/i }).click()
  await expect(
    page.getByRole("button", { name: /regulated/i })
  ).toHaveAttribute("aria-pressed", "true")
  await page.getByRole("button", { name: /high-risk autonomy/i }).click()
  await expect(
    page.getByText(/incident \/ rollback controls/i).first()
  ).toBeVisible()

  await page.getByRole("button", { name: /prompt chaining/i }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(
    page.getByRole("heading", { level: 2, name: /prompt chaining/i })
  ).toBeVisible()

  const resetZoomButton = page.getByRole("button", { name: /reset zoom/i })
  const initialZoom = await resetZoomButton.textContent()
  expect(initialZoom).toMatch(/%/)
  await page.getByRole("button", { name: /zoom in/i }).click()
  await expect(resetZoomButton).not.toHaveText(initialZoom ?? "")
  const zoomedIn = await resetZoomButton.textContent()
  await page.getByRole("button", { name: /zoom out/i }).click()
  await expect(resetZoomButton).not.toHaveText(zoomedIn ?? "")

  expect(errors).toEqual([])
})

test("detail markers follow the canvas camera", async ({ page }) => {
  await page.goto("/")

  const llmMarker = page.getByRole("button", { name: /select llm/i })
  const beforeZoom = await llmMarker.boundingBox()

  expect(beforeZoom).not.toBeNull()

  await page.getByRole("button", { name: /zoom in/i }).click()

  const afterZoom = await llmMarker.boundingBox()

  expect(afterZoom).not.toBeNull()
  expect(afterZoom?.x).not.toBe(beforeZoom?.x)
  expect(afterZoom?.y).not.toBe(beforeZoom?.y)
})

test("mobile shell and healthcare overlay remain operable", async ({
  page,
}) => {
  const errors = wireErrorCollection(page)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")

  await page.getByRole("button", { name: /browse patterns/i }).click()
  const navDialog = page.getByRole("dialog", {
    name: /pattern navigation/i,
  })
  await expect(navDialog).toBeVisible()

  await navDialog.getByRole("button", { name: /healthcare mode/i }).click()
  await navDialog.getByRole("button", { name: /foundational/i }).click()
  await navDialog.getByRole("button", { name: /routing/i }).click()

  await expect(
    page.getByRole("heading", { level: 2, name: /routing/i })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: /foundational/i })
  ).toHaveAttribute("aria-pressed", "true")
  await expect(
    page.getByText(/foundational healthcare mode adds/i)
  ).toBeVisible()

  await page.getByRole("button", { name: /browse patterns/i }).click()
  await page.keyboard.press("Escape")

  await page.getByRole("button", { name: /select llm router/i }).click()
  const mobileDetailDialog = page.getByRole("dialog")
  await expect(mobileDetailDialog).toBeVisible()
  await expect(
    mobileDetailDialog.getByText(/classifies input and routes/i).first()
  ).toBeVisible()

  expect(errors).toEqual([])
})

test("reduced-motion desktop snapshots stay stable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")

  await expect(page).toHaveScreenshot("default-desktop.png", {
    animations: "disabled",
    fullPage: true,
  })

  await page.getByRole("button", { name: /healthcare mode/i }).click()
  await page.getByRole("button", { name: /regulated/i }).click()

  await expect(page).toHaveScreenshot("healthcare-desktop.png", {
    animations: "disabled",
    fullPage: true,
  })
})
