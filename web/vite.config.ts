import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: { "/api": { target: "http://localhost:8087", changeOrigin: true } },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          includeDependenciesRecursively: false,
          groups: [
            { name: "antd", test: /node_modules[\\/]antd[\\/]/, priority: 20 },
            {
              name: "rc-components",
              test: /node_modules[\\/](?:@rc-component|rc-[^\\/]+)[\\/]/,
              priority: 15,
            },
          ],
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
})
