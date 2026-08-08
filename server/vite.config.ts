import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  server: {
    port: 3000,
    strictPort: true,
    watch: {
      ignored: ["**/*.sqlite"],
    },
  },
});
