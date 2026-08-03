import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import fachadaAsset from "@/assets/fachada.png.asset.json";
import { useCompanyContact } from "@/hooks/useCompanyContact";


export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);
  const { whatsappUrl: WHATSAPP_URL } = useCompanyContact();

  return (
    <section id="inicio" ref={ref} className="relative min-h-screen w-full overflow-hidden text-white">
      {/* Parallax background */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 z-0 scale-110">
        <img
          src={fachadaAsset.url}
          alt="Fachada da loja Excelência Multimarcas"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        {/* Subtle darkening for legibility */}
        <div className="absolute inset-0 bg-black/30" />
        {/* Bottom fade into white background */}
        <div className="absolute inset-0 bg-gradient-hero" />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8 pt-32 pb-24 lg:pt-40 min-h-screen flex items-center justify-center">
        <motion.div style={{ y: contentY }} className="w-full flex flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.4)]"
          >
            Encontre o <span className="text-brand-yellow [text-shadow:0_2px_20px_rgba(255,196,0,0.35)]">carro ideal</span>
            <br /> para você.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-6 max-w-xl text-base sm:text-lg text-white/85 leading-relaxed [text-shadow:0_1px_10px_rgba(0,0,0,0.5)]"
          >
            Na Excelência Multimarcas você encontra veículos revisados, procedência garantida e as melhores condições da região.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="mt-9 flex flex-wrap justify-center gap-3"
          >
            <motion.a
              href="#estoque"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-2 px-7 py-4 rounded-full bg-gradient-yellow text-brand-black font-semibold shadow-yellow-glow"
            >
              Ver Estoque
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </motion.a>
            <motion.a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold shadow-[0_20px_40px_-15px_rgba(37,211,102,0.6)] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Falar no WhatsApp
            </motion.a>
          </motion.div>
        </motion.div>
      </div>



      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-brand-black/60 z-10"
      >
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          Explore ↓
        </motion.div>
      </motion.div>
    </section>
  );
}
