import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import fachadaAsset from "@/assets/fachada.png.asset.json";
import { useCompanyContact } from "@/hooks/useCompanyContact";

export function CtaFinal() {
  const { whatsappUrl: WHATSAPP_URL } = useCompanyContact();

  return (
    <section className="relative py-32 lg:py-48 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="relative rounded-[4rem] overflow-hidden bg-brand-black py-24 lg:py-32 px-10 lg:px-20 text-center">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src={fachadaAsset.url} 
              alt="" 
              className="w-full h-full object-cover opacity-20 grayscale" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-black via-brand-black/90 to-brand-black" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight text-white tracking-tight"
            >
              Seu próximo carro está <br />
              <span className="text-brand-red">esperando por você</span>.
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mt-8 text-xl lg:text-2xl text-white/50 font-medium max-w-2xl mx-auto"
            >
              Visite nosso showroom ou fale agora mesmo com um consultor especializado.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-14 flex flex-wrap justify-center gap-5"
            >
              <motion.a
                href="#estoque"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white text-brand-black font-bold text-lg hover:bg-brand-red hover:text-white transition-all duration-300"
              >
                Ver Estoque <ArrowRight className="w-6 h-6" />
              </motion.a>
              <motion.a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-brand-red text-white font-bold text-lg shadow-red-glow transition-all"
              >
                <MessageCircle className="w-6 h-6" /> Falar no WhatsApp
              </motion.a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
