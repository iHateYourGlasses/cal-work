import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4010", // Prism mock in dev; switch to :3000 for real backend
        changeOrigin: true,
      },
    },
  },
});
