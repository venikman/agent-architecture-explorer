import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

function resolveBase(env: Record<string, string>) {
  return env.VITE_PUBLIC_BASE || "/"
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    base: resolveBase(env),
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/motion")) {
              return "motion"
            }

            if (id.includes("node_modules/@base-ui")) {
              return "primitives"
            }

            if (id.includes("node_modules/@xyflow")) {
              return "xyflow"
            }

            return undefined
          },
        },
      },
    },
  }
})
