import { defineConfig } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  base: "/LGPS-drop/",
  plugins: [tailwindcss()],
  test: { include: ["tests/**/*.test.ts"] },
});
