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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
