import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ["@vercel/edge-config"], // Excluye la dependencia del bundle
    },
  },
});
