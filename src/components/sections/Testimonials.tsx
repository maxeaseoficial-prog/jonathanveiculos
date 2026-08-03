import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import d1 from "@/assets/testimonials/depoimento-1.png.asset.json";
import d2 from "@/assets/testimonials/depoimento-2.png.asset.json";
import d3 from "@/assets/testimonials/depoimento-3.png.asset.json";
import d4 from "@/assets/testimonials/depoimento-4.png.asset.json";
import d5 from "@/assets/testimonials/depoimento-5.png.asset.json";

const reviews = [d1.url, d2.url, d3.url, d4.url, d5.url];

export function Testimonials() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((v) => (v + 1) % reviews.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative py-28 lg:py-36 bg-muted/60 overflow-hidden">
      <div className="mx-auto max-w-4xl px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-brand-yellow font-semibold">Depoimentos</span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            Histórias de quem já <span className="text-brand-accent">saiu dirigindo</span>.
          </h2>
          <p className="mt-4 text-foreground/60 text-sm">Avaliações reais de clientes no Google.</p>
        </motion.div>

        <div className="mt-14 relative min-h-[280px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full rounded-3xl overflow-hidden shadow-elegant border border-black/5 bg-[#1f1f1f]"
            >
              <img
                src={reviews[idx]}
                alt={`Depoimento ${idx + 1}`}
                loading="lazy"
                className="w-full h-auto block"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${i === idx ? "w-10 bg-brand-yellow" : "w-2 bg-black/15"}`}
              aria-label={`Depoimento ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
