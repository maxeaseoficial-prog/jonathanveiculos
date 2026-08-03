import { motion } from "framer-motion";
import { Check, Calculator } from "lucide-react";
import { useCompanyContact } from "@/hooks/useCompanyContact";


const perks = [
  "Aprovação em até 30 minutos",
  "Entrada facilitada ou zero entrada",
  "Parcelamento em até 60x",
  "Aceitamos seu usado como parte do pagamento",
];

export function Financing() {
  const { whatsappUrl: WHATSAPP_URL } = useCompanyContact();
  return (
    <section id="financiamento" className="relative py-28 lg:py-36 overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-glow)" }} />
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-xs uppercase tracking-[0.3em] text-brand-yellow font-semibold">Financiamento</span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Realize o sonho do <span className="text-brand-accent">carro novo</span> com as melhores condições.
            </h2>
            <p className="mt-6 text-foreground/75 leading-relaxed">
              Trabalhamos com todos os principais bancos e simulamos as melhores parcelas para o seu perfil. Sem burocracia, sem surpresas. Só condições justas para você sair dirigindo.
            </p>

            <ul className="mt-8 space-y-3 inline-block text-left">
              {perks.map((p, i) => (
                <motion.li
                  key={p}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="flex items-center gap-3 text-foreground/85"
                >
                  <span className="w-6 h-6 rounded-full bg-brand-yellow/15 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-brand-yellow" />
                  </span>
                  {p}
                </motion.li>
              ))}
            </ul>

            <div>
              <motion.a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="mt-10 inline-flex items-center gap-2 px-7 py-4 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold shadow-[0_20px_40px_-15px_rgba(37,211,102,0.55)] transition-colors"
              >
                <Calculator className="w-4 h-4" />
                Simular Financiamento
              </motion.a>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
