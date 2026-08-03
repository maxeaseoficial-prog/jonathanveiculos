import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import fachadaAsset from "@/assets/fachada.png.asset.json";
import { useCompanyContact } from "@/hooks/useCompanyContact";

export function CtaFinal() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const { whatsappUrl: WHATSAPP_URL } = useCompanyContact();

  return (
    <section ref={ref} className="relative py-32 lg:py-44 overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-0 -z-10 scale-125">
        <img src={fachadaAsset.url} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-brand-black/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/60 to-brand-black/90" />
      </motion.div>

      <div className="mx-auto max-w-4xl px-5 lg:px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.05]"
        >
          Seu próximo carro está <br /> <span className="text-gradient-yellow">esperando por você</span>.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-6 text-lg text-foreground/75 max-w-xl mx-auto"
        >
          Visite nosso showroom ou converse agora mesmo com um consultor especializado.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-wrap justify-center gap-3"
        >
          <motion.a
            href="#estoque"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-8 py-5 rounded-full bg-gradient-yellow text-brand-black font-bold text-lg shadow-yellow-glow"
          >
            Ver Estoque <ArrowRight className="w-5 h-5" />
          </motion.a>
          <motion.a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-8 py-5 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold text-lg shadow-[0_20px_40px_-15px_rgba(37,211,102,0.6)] transition-colors"
          >
            <MessageCircle className="w-5 h-5" /> WhatsApp
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
