import { cleanup } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import React from "react"
import { afterEach, vi } from "vitest"

afterEach(() => {
  cleanup()
  localStorage.clear()
})

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock)
vi.stubGlobal("scrollTo", vi.fn())

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches:
      query === "(prefers-color-scheme: dark)"
        ? false
        : query === "(prefers-reduced-motion: reduce)"
          ? false
          : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

function stripMotionProps(props: Record<string, unknown>) {
  const blocked = new Set([
    "animate",
    "drag",
    "dragConstraints",
    "exit",
    "initial",
    "layout",
    "layoutId",
    "layoutScroll",
    "layoutRoot",
    "transition",
    "variants",
    "whileFocus",
    "whileHover",
    "whileInView",
    "whileTap",
  ])

  return Object.fromEntries(
    Object.entries(props).filter(([key]) => !blocked.has(key))
  )
}

vi.mock("motion/react", () => {
  const cache = new Map<string, React.ComponentType<Record<string, unknown>>>()

  const motion = new Proxy(
    {},
    {
      get(_target, tag: string) {
        if (!cache.has(tag)) {
          cache.set(
            tag,
            React.forwardRef<
              unknown,
              Record<string, unknown> & { children?: React.ReactNode }
            >(({ children, ...props }, ref) =>
              React.createElement(
                tag,
                { ref, ...stripMotionProps(props) },
                children as React.ReactNode
              )
            )
          )
        }

        return cache.get(tag)
      },
    }
  )

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    motion,
    useReducedMotion: () => false,
  }
})
