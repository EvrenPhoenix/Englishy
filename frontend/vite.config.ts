import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { storageKeys } from "./src/lib/storage-keys.ts";
import { BRAND } from "../shared/brand.ts";

// Serve the same synchronous script in development and the built site. Keep its
// storage key in the TypeScript registry while applying the theme before paint.
function earlyTheme(): Plugin {
  const source = `(function () {
    try {
      var theme = localStorage.getItem(${JSON.stringify(storageKeys.theme)}) || "system";
      var dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      if (dark) document.querySelector('meta[name="theme-color"]').content = ${JSON.stringify(BRAND.themeColor.dark)};
    } catch {}
  })();`;
  return {
    name: "englishy-theme-init",
    transformIndexHtml() {
      return [
        { tag: "script", attrs: { src: "/theme-init.js" }, injectTo: "head" },
      ];
    },
    configureServer(server) {
      server.middlewares.use("/theme-init.js", (_req, res) => {
        res.setHeader("Content-Type", "text/javascript");
        res.end(source);
      });
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "theme-init.js", source });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwind(), earlyTheme()],
  server: { proxy: { "/api": "http://127.0.0.1:8787" } },
});
