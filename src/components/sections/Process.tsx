import { motion } from "framer-motion";

const steps = [
  { n: "01", title: "Escolha seu veículo", text: "Explore nosso estoque online ou visite o showroom." },
  { n: "02", title: "Solicite atendimento", text: "Nosso consultor entra em contato para tirar todas as dúvidas." },
  { n: "03", title: "Simule seu financiamento", text: "Aprovação rápida com as melhores condições do mercado." },
  { n: "04", title: "Retire seu carro", text: "Documentação em dia, revisado e pronto para rodar." },
];

export function Process() {
  return (
    <section className="relative py-32 lg:py-48 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mb-24"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-brand-black tracking-tight">
            Seu próximo carro em <br />
            <span className="text-brand-red">4 passos simples</span>.
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group"
            >
              <div className="text-8xl font-black text-brand-black/5 leading-none transition-colors group-hover:text-brand-red/10">
                {s.n}
              </div>
              <div className="-mt-8 relative z-10 px-2">
                <h3 className="text-2xl font-bold text-brand-black">{s.title}</h3>
                <p className="mt-4 text-brand-black/50 text-base font-medium leading-relaxed">{s.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
