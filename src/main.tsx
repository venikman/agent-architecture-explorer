import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@xyflow/react/dist/base.css"

import { ThemeProvider } from "@/components/theme-provider"
import "./index.css"
import App from "./App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light">
      <App />
    </ThemeProvider>
  </StrictMode>
)
