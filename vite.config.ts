// @lovable.dev/vite-tanstack-config already registers TanStack Start, React,
// Tailwind, aliases and Nitro. Do not add those plugins a second time.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Lovable uses Cloudflare for its preview; Vercel requires the Nitro
// Vercel output preset. Preserve the Lovable runtime outside Vercel.
const isVercel = Boolean(process.env.VERCEL);

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: isVercel ? { preset: "vercel" } : true,
});
