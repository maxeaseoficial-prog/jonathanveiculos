import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import fachadaAsset from "@/assets/fachada-loja.png.asset.json";

const stats = [
  { value: 500, suffix: "+", label: "Clientes atendidos" },
  { value: 1000, suffix: "+", label: "Veículos vendidos" },
  { value: 10, suffix: "+", label: "Anos de mercado" },
  { value: 98, suffix: "%", label: "Satisfação" },
];

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString("pt-BR"));

  useEffect(() => {
    if (inView) {
      const c = animate(count, to, { duration: 2, ease: [0.22, 1, 0.36, 1] });
      return c.stop;
    }
  }, [inView, to, count]);

  return (
    <span ref={ref} className="tabular-nums">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

export function About() {
  return (
    <section id="sobre" className="relative py-28 lg:py-36 overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-glow)" }} />
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-elegant">
              <img
                src={fachadaAsset.url}
                alt="Loja Excelência Multimarcas"
                loading="lazy"
                width={1200}
                height={800}
                className="w-full h-[520px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black/70 via-transparent to-transparent" />
            </div>
            
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-xs uppercase tracking-[0.3em] text-brand-yellow font-semibold">Sobre nós</span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1]">
              Mais de uma década movendo <span className="text-brand-accent">excelência</span>.
            </h2>
            <p className="mt-6 text-foreground/75 text-lg leading-relaxed">
              A Excelência Multimarcas nasceu com um propósito claro: entregar a melhor experiência de compra de veículos da região. Combinamos padrão de concessionária premium com a flexibilidade de uma loja multimarcas, sem abrir mão de procedência, transparência e um atendimento que faz toda a diferença.
            </p>
            <p className="mt-4 text-foreground/60 leading-relaxed">
              Cada veículo passa por rigorosa inspeção e revisão antes de compor nosso showroom. Nosso time acompanha você da escolha até a entrega das chaves.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
                  className="bg-white border border-black/5 rounded-2xl p-5 shadow-card-premium"
                >
                  <div className="text-3xl lg:text-4xl font-bold text-brand-accent font-display">
                    <Counter to={s.value} suffix={s.suffix} />
                  </div>
                  <div className="mt-1 text-sm text-foreground/70">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
