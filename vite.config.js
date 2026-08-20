import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Sem este arquivo o @vitejs/plugin-react nunca era carregado: o build funcionava
// (o esbuild do Vite transpila JSX sozinho), mas o Fast Refresh ficava desligado.
export default defineConfig({
  plugins: [react()],
  server: { host: "127.0.0.1" },
  preview: { host: "127.0.0.1" },
});
