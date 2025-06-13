import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // THE ONLY CHANGE NEEDED IS HERE:
  base: "/",

  plugins: [react()],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
