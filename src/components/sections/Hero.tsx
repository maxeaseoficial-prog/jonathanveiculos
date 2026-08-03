import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import storeHeroAsset from "@/assets/store-hero.webp.asset.json";
import { useCompanyContact } from "@/hooks/useCompanyContact";

export function Hero() {
  const { whatsappUrl: WHATSAPP_URL } = useCompanyContact();

  return (
    <section id="inicio" className="relative min-h-[90vh] lg:min-h-screen w-full overflow-hidden flex items-center">
      <div className="absolute inset-0 z-0">
        <img
          src={storeHeroAsset.url}
          alt="Jonathan Veículos"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8 w-full pt-24">
        <div className="max-w-3xl">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-start text-left z-10"
          >
            <motion.h1
              className="text-5xl sm:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight text-white"
            >
              Encontre o <br />
              <span className="text-brand-red">veículo ideal</span> <br />
              para você.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-8 max-w-lg text-lg sm:text-xl text-white/80 leading-relaxed font-medium"
            >
              Qualidade, procedência e as melhores condições de financiamento do mercado. Seu próximo carro está na Jonathan Veículos.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <motion.a
                href="#estoque"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-brand-red text-white font-bold shadow-red-glow transition-all"
              >
                Ver Estoque
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </motion.a>
              <motion.a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-white text-white font-bold hover:bg-white/10 transition-all"
              >
                Fale Conosco
              </motion.a>
            </motion.div>
          </motion.div>

          {/* Lado direito - Imagem grande */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative lg:h-[700px] flex items-center justify-center lg:justify-end"
          >
            <div className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-[550px] lg:w-[800px] rounded-[2.5rem] overflow-hidden shadow-elegant lg:-mr-20">
              <img
                src={fachadaAsset.url}
                alt="Jonathan Veículos"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-black/20 to-transparent" />
            </div>
            
            {/* Decoração sutil */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-red/5 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
