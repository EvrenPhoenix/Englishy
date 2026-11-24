import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { storageKeys } from "./src/lib/storage-keys.ts";
import { BRAND } from "../shared/brand.ts";

// Serve the same synchronous script in development and the built site. Keep its
// storage key in the TypeScript registry while applying the theme before paint.
// index.html loads it with a plain <script> near the top of <head>.
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

// Emit /sw.js from sw-template.js with this build's cache version and precache list:
// the app shell, every hashed asset (so lessons work offline), the icons and the
// early theme script. The version changes whenever any asset name changes.
function serviceWorker(): Plugin {
  return {
    name: "englishy-service-worker",
    apply: "build",
    generateBundle(_options, bundle) {
      const files = Object.values(bundle).map((item) => item.fileName);
      const entry = Object.values(bundle).find(
        (item) => item.type === "chunk" && item.isEntry,
      )!.fileName;
      const byType = (pattern: RegExp) =>
        files.filter((file) => file !== entry && pattern.test(file)).sort();
      const assets = [
        entry,
        ...byType(/^assets\/.*\.js$/),
        ...byType(/^assets\/.*\.css$/),
        ...byType(/^assets\/.*\.woff2$/),
      ];
      const icons = readdirSync(new URL("./public/icons", import.meta.url))
        .sort()
        .map((name) => `/icons/${name}`);
      const version =
        "englishy-" +
        createHash("sha256")
          .update(assets.join("\n"))
          .digest("hex")
          .slice(0, 12);
      const precache = [
        "/",
        ...assets.map((file) => "/" + file),
        ...icons,
        "/theme-init.js",
      ];
      const source = readFileSync(
        new URL("./sw-template.js", import.meta.url),
        "utf8",
      )
        .replace("__VERSION__", JSON.stringify(version))
        .replace("__PRECACHE__", JSON.stringify(precache, null, 2));
      this.emitFile({ type: "asset", fileName: "sw.js", source });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwind(), earlyTheme(), serviceWorker()],
  server: { proxy: { "/api": "http://127.0.0.1:8787" } },
});
