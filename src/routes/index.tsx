import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Stock } from "@/components/sections/Stock";
import { Features } from "@/components/sections/Features";
import { Process } from "@/components/sections/Process";
import { Financing } from "@/components/sections/Financing";
import { Testimonials } from "@/components/sections/Testimonials";
import { CtaFinal } from "@/components/sections/CtaFinal";
import { Footer } from "@/components/sections/Footer";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Excelência Multimarcas | Seu próximo carro está aqui" },
      {
        name: "description",
        content:
          "Loja multimarcas com padrão premium: veículos revisados, procedência garantida, financiamento facilitado e as melhores condições da região.",
      },
      { property: "og:title", content: "Excelência Multimarcas | Seu próximo carro está aqui" },
      { property: "og:description", content: "Loja multimarcas com padrão premium: veículos revisados, procedência garantida, financiamento facilitado e as melhores condições da região." },
      { property: "og:type", content: "website" },
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
        <About />
        <Stock />
        <Features />
        <Process />
        <Financing />
        <Testimonials />
        <CtaFinal />
      </main>
      <Footer />
    </div>
  );
}
