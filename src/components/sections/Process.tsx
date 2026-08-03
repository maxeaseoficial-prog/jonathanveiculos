import { motion } from "framer-motion";

const steps = [
  { n: "01", title: "Escolha seu veículo", text: "Explore nosso estoque online ou visite o showroom." },
  { n: "02", title: "Solicite atendimento", text: "Nosso consultor entra em contato para tirar todas as dúvidas." },
  { n: "03", title: "Simule seu financiamento", text: "Aprovação rápida com as melhores condições do mercado." },
  { n: "04", title: "Retire seu carro", text: "Documentação em dia, revisado e pronto para rodar." },
];

export function Process() {
  return (
    <section className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-brand-yellow font-semibold">Como funciona</span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            Simples, rápido, <span className="text-brand-accent">sem complicação</span>.
          </h2>
        </motion.div>

        <div className="mt-16 relative">
          <div className="hidden lg:block absolute top-16 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-yellow/40 to-transparent" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative"
              >
                <div className="relative w-14 h-14 rounded-2xl bg-brand-black border border-brand-yellow/40 flex items-center justify-center font-display font-bold text-brand-yellow z-10">
                  {s.n}
                </div>
                <h3 className="mt-6 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-foreground/65 text-sm leading-relaxed">{s.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
