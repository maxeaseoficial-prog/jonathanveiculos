import { motion } from "framer-motion";
import { ShieldCheck, Wrench, Wallet, Repeat, TrendingUp, Headphones } from "lucide-react";

const items = [
  { icon: ShieldCheck, title: "Procedência Garantida", text: "Todo veículo passa por checagem de histórico e documentação antes de entrar no showroom." },
  { icon: Wrench, title: "Veículos Revisados", text: "Inspeção mecânica e estética completa para você dirigir com total segurança." },
  { icon: Wallet, title: "Financiamento Facilitado", text: "Trabalhamos com os principais bancos e as melhores taxas do mercado." },
  { icon: Repeat, title: "Aceitamos Troca", text: "Utilize seu usado como parte do pagamento e simplifique a negociação." },
  { icon: TrendingUp, title: "Melhor Avaliação", text: "Análise técnica e valor justo pelo seu veículo, sem surpresas." },
  { icon: Headphones, title: "Atendimento Especializado", text: "Consultores prontos para te guiar da escolha à entrega das chaves." },
];

export function Features() {
  return (
    <section className="relative py-28 lg:py-36 bg-muted/60">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-brand-yellow font-semibold">Diferenciais</span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            Por que escolher a <span className="text-brand-accent">Excelência</span>.
          </h2>
          <p className="mt-4 text-foreground/70">
            Um padrão de atendimento e transparência inspirado nas melhores concessionárias premium.
          </p>
        </motion.div>

        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: (i % 3) * 0.08 }}
              whileHover={{ y: -6 }}
              className="group relative bg-white border border-black/5 rounded-3xl p-8 overflow-hidden shadow-card-premium"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" style={{ background: "radial-gradient(60% 60% at 50% 0%, oklch(0.86 0.19 92 / 0.12), transparent)" }} />
              <div className="w-12 h-12 rounded-2xl bg-gradient-yellow flex items-center justify-center shadow-yellow-glow">
                <f.icon className="w-6 h-6 text-brand-black" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-foreground/70 text-sm leading-relaxed">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
