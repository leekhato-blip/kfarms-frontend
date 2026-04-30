// //
// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     host: true,
//     port: 5173,
//     watch: {
//       usePolling: true,
//       interval: 200,
//     },
//     proxy: {
//       "/api": {
//         target: "http://10.65.70.238:8080",
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//   },
// });
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";

function readGitValue(command) {
  try {
    return execSync(command, {
      stdio: ["ignore", "pipe", "ignore"],
    }).toString().trim();
  } catch {
    return "";
  }
}

function resolveBuildMetadata() {
  const fullCommitFromEnv =
    process.env.RENDER_GIT_COMMIT ||
    process.env.GIT_COMMIT ||
    process.env.COMMIT_SHA ||
    "";
  const branchFromEnv =
    process.env.RENDER_GIT_BRANCH ||
    process.env.GIT_BRANCH ||
    process.env.BRANCH ||
    "";

  const fullCommit = fullCommitFromEnv || readGitValue("git rev-parse HEAD");
  const shortCommit = fullCommit
    ? fullCommit.slice(0, 7)
    : readGitValue("git rev-parse --short HEAD");
  const branch = branchFromEnv || readGitValue("git rev-parse --abbrev-ref HEAD");

  return {
    commitSha: shortCommit || "unknown",
    commitFullSha: fullCommit || "unknown",
    branch: branch || "unknown",
    builtAt: new Date().toISOString(),
    source: fullCommitFromEnv ? "environment" : fullCommit ? "git" : "unknown",
  };
}

const buildMetadata = resolveBuildMetadata();
const buildInfoDefine = Object.fromEntries(
  Object.entries({
    VITE_APP_COMMIT_SHA: buildMetadata.commitSha,
    VITE_APP_COMMIT_FULL_SHA: buildMetadata.commitFullSha,
    VITE_APP_BRANCH: buildMetadata.branch,
    VITE_APP_BUILD_TIME: buildMetadata.builtAt,
    VITE_APP_BUILD_SOURCE: buildMetadata.source,
  }).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: buildInfoDefine,
  optimizeDeps: {
    force: true,
    exclude: ["react-icons", "react-icons/tb"],
    include: [
      "react",
      "react/jsx-dev-runtime",
      "react-dom",
      "react-dom/client",
      "cookie",
      "lucide-react",
      "recharts",
      "es-toolkit/compat/get",
      "es-toolkit/compat/isPlainObject",
      "es-toolkit/compat/last",
      "es-toolkit/compat/maxBy",
      "es-toolkit/compat/minBy",
      "es-toolkit/compat/omit",
      "es-toolkit/compat/range",
      "es-toolkit/compat/sortBy",
      "es-toolkit/compat/sumBy",
      "es-toolkit/compat/throttle",
      "es-toolkit/compat/uniqBy",
      "react-router",
      "react-router-dom",
    ],
    needsInterop: [
      "es-toolkit/compat/get",
      "es-toolkit/compat/isPlainObject",
      "es-toolkit/compat/last",
      "es-toolkit/compat/maxBy",
      "es-toolkit/compat/minBy",
      "es-toolkit/compat/omit",
      "es-toolkit/compat/range",
      "es-toolkit/compat/sortBy",
      "es-toolkit/compat/sumBy",
      "es-toolkit/compat/throttle",
      "es-toolkit/compat/uniqBy",
    ],
  },
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (id.includes("react-chartjs-2") || id.includes("chart.js")) {
            return "chartjs-vendor";
          }

          if (id.includes("recharts")) {
            return "recharts-vendor";
          }

          if (id.includes("react-icons") || id.includes("lucide-react") || id.includes("@heroicons")) {
            return "icons-vendor";
          }

          if (id.includes("framer-motion")) {
            return "motion-vendor";
          }

          return undefined;
        },
      },
    },
  },
});
