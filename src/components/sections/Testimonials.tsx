import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import d1 from "@/assets/testimonials/depoimento-1.png.asset.json";
import d2 from "@/assets/testimonials/depoimento-2.png.asset.json";
import d3 from "@/assets/testimonials/depoimento-3.png.asset.json";
import d4 from "@/assets/testimonials/depoimento-4.png.asset.json";
import d5 from "@/assets/testimonials/depoimento-5.png.asset.json";

const reviews = [d1.url, d2.url, d3.url, d4.url, d5.url];

export function Testimonials() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((v) => (v + 1) % reviews.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative py-32 lg:py-48 bg-white overflow-hidden">
      <div className="mx-auto max-w-5xl px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-brand-red text-brand-red" />
            ))}
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-brand-black tracking-tight">
            Quem conhece, <span className="text-brand-red">recomenda</span>.
          </h2>
          <p className="mt-6 text-brand-black/50 text-lg font-medium">Avaliações reais dos nossos clientes no Google.</p>
        </motion.div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="w-full rounded-[3rem] overflow-hidden shadow-elegant border border-black/5 bg-surface"
            >
              <img
                src={reviews[idx]}
                alt={`Depoimento ${idx + 1}`}
                loading="lazy"
                className="w-full h-auto block"
              />
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 flex justify-center gap-3">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${i === idx ? "w-12 bg-brand-red" : "w-3 bg-brand-black/10 hover:bg-brand-black/20"}`}
                aria-label={`Depoimento ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
