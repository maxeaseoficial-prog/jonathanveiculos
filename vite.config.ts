// @lovable.dev/vite-tanstack-config already registers TanStack Start, React,
// Tailwind, aliases and Nitro. Do not add those plugins a second time.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Lovable uses Cloudflare for its preview; Vercel requires the Nitro
// Vercel output preset. Preserve the Lovable runtime outside Vercel.
const isVercel = Boolean(process.env.VERCEL);

// Vercel-only public Supabase config. The publishable key is designed for
// browser use; it grants no admin rights without RLS and user authentication.
// Keep the Lovable development preview pointing to its original backend.
// Explicit environment variables configured in Vercel take precedence.
if (isVercel) {
  process.env.VITE_SUPABASE_URL ||= "https://uaizkvulshnssdhgxyug.supabase.co";
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||= "sb_publishable_J5zvNDC2IygUl6FRGWPisg_EHwvW2dt";
  process.env.VITE_SUPABASE_PROJECT_ID ||= "uaizkvulshnssdhgxyug";
}

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: isVercel ? { preset: "vercel" } : true,
});
