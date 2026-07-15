import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/typing-level-zero/",
  plugins: [react()],
  test: {
    clearMocks: true,
    environment: "jsdom",
    globals: true,
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    restoreMocks: true,
  },
});
