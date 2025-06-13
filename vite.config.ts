import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Updated base for production deployment:
  base: "/",

  plugins: [react()],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
