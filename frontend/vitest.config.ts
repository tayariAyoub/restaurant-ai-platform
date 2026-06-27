import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    css: false,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
