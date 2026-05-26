import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/popup.html"),
        dashboard: resolve(__dirname, "src/dashboard/dashboard.html"),
        blocked: resolve(__dirname, "src/blocked/blocked.html"),
        serviceWorker: resolve(__dirname, "src/background/serviceWorker.ts"),
        contentScript: resolve(__dirname, "src/content/contentScript.ts")
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    coverage: {
      include: ["src/lib/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/test/**",
        "src/**/*.tsx",
        "src/popup/**",
        "src/dashboard/**",
        "src/blocked/**",
        "src/content/**",
        "src/background/**",
        "dist/**",
        "coverage/**"
      ]
    }
  }
});
