import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import importMap from "./import_map.json";
import { denoPlugin } from "./plugins/deno";
import { pagesPlugin } from "./plugins/pages";

// https://vitejs.dev/config/
export default defineConfig({
  root: "./src",
  plugins: [
    react({ jsxRuntime: "classic" }),
    ...pagesPlugin(),
    denoPlugin({ importMap }),
  ],
});
