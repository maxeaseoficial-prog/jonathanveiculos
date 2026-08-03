import { motion } from "framer-motion";
import { Check, Calculator } from "lucide-react";
import { useCompanyContact } from "@/hooks/useCompanyContact";

const perks = [
  "Aprovação em até 30 minutos",
  "Entrada facilitada ou zero entrada",
  "Parcelamento em até 60x",
  "Aceitamos seu usado na troca",
];

export function Financing() {
  const { whatsappUrl: WHATSAPP_URL } = useCompanyContact();
  return (
    <section id="financiamento" className="relative py-32 lg:py-48 bg-surface overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-brand-black tracking-tight">
              O melhor <span className="text-brand-red">financiamento</span> <br />
              está aqui.
            </h2>
            <p className="mt-8 text-brand-black/60 text-lg font-medium leading-relaxed">
              Trabalhamos com os maiores bancos do país para garantir que você tenha as melhores taxas e aprovação imediata.
            </p>

            <div className="mt-12 grid gap-5">
              {perks.map((p, i) => (
                <motion.div
                  key={p}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="flex items-center gap-4 text-brand-black/70 font-bold"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center">
                    <Check className="w-5 h-5 text-brand-red stroke-[3px]" />
                  </div>
                  {p}
                </motion.div>
              ))}
            </div>

            <motion.a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="mt-12 inline-flex items-center gap-3 px-10 py-5 rounded-full bg-brand-red text-white font-bold text-lg shadow-red-glow transition-all"
            >
              <Calculator className="w-6 h-6" />
              Simular Financiamento
            </motion.a>
          </motion.div>

          {/* Elemento visual de financiamento */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative hidden lg:block"
          >
            <div className="bg-white p-16 rounded-[3rem] shadow-elegant border border-black/5 relative z-10">
              <div className="text-sm font-bold uppercase tracking-[0.2em] text-brand-black/30 mb-6">Condição Especial</div>
              <div className="text-8xl font-black text-brand-black leading-none mb-4">60x</div>
              <div className="text-2xl font-bold text-brand-black/60 mb-10">Parcelas fixas para o seu próximo carro.</div>
              <div className="h-2 w-full bg-brand-red/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: "70%" }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="h-full bg-brand-red"
                />
              </div>
            </div>
            <div className="absolute -inset-4 bg-brand-red/5 blur-3xl rounded-full -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
