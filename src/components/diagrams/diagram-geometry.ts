export function buildCurvedPath({
  startX,
  startY,
  endX,
  endY,
  direction,
}: {
  startX: number
  startY: number
  endX: number
  endY: number
  direction: "horizontal" | "vertical"
}) {
  if (direction === "horizontal") {
    const curve = Math.max(Math.min(Math.abs(endX - startX) * 0.35, 72), 28)
    const forward = endX >= startX ? 1 : -1

    return [
      `M ${startX} ${startY}`,
      `C ${startX + curve * forward} ${startY},`,
      `${endX - curve * forward} ${endY},`,
      `${endX} ${endY}`,
    ].join(" ")
  }

  const curve = Math.max(Math.min(Math.abs(endY - startY) * 0.35, 72), 28)
  const downward = endY >= startY ? 1 : -1

  return [
    `M ${startX} ${startY}`,
    `C ${startX} ${startY + curve * downward},`,
    `${endX} ${endY - curve * downward},`,
    `${endX} ${endY}`,
  ].join(" ")
}

export function getEdgeLabelPoint({
  startX,
  startY,
  endX,
  endY,
}: {
  startX: number
  startY: number
  endX: number
  endY: number
}) {
  return {
    x: (startX + endX) / 2,
    y: (startY + endY) / 2,
  }
}
