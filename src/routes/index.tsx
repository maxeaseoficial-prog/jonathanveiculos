// REDESIGN COMPLETO DO SITE — JONATHAN VEÍCULOS — PRONTO PARA PRODUÇÃO
import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Stock } from "@/components/sections/Stock";
import { Features } from "@/components/sections/Features";
import { Process } from "@/components/sections/Process";
import { Financing } from "@/components/sections/Financing";

import { CtaFinal } from "@/components/sections/CtaFinal";
import { Footer } from "@/components/sections/Footer";
import { title, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-meta";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: title() },
      { name: "description", content: SITE_DESCRIPTION },
      { property: "og:title", content: title() },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});


function Index() {
  return (
    <div className="bg-background text-foreground overflow-x-clip">
      <Header />
      <main>
        <Hero />
        
        <Stock />
        <Features />
        <Process />
        <Financing />
        
        <CtaFinal />
      </main>
      <Footer />
    </div>
  );
}
