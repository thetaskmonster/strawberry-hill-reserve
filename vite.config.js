import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// VITE_BASE lets a project-path deploy (GitHub Pages: /<repo>/) set the asset base;
// defaults to "/" for root deploys and the inlined single-file artifact.
export default defineConfig({
    base: process.env.VITE_BASE || "/",
    plugins: [react()],
    build: { target: "es2020", cssMinify: true },
});
