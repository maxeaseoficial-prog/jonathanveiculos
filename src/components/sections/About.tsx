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
    <section id="sobre" className="relative py-32 lg:py-48 bg-surface overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-12 text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-4xl sm:text-6xl font-bold text-brand-black tracking-tight"
            >
              Nossa <span className="text-brand-red">História</span> em Números
            </motion.h2>
          </div>

          <div className="lg:col-span-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="bg-white border border-black/5 rounded-[2.5rem] p-10 lg:p-14 shadow-card-premium text-center card-hover"
                >
                  <div className="text-5xl lg:text-7xl font-bold text-brand-black font-display tracking-tighter">
                    <Counter to={s.value} suffix={s.suffix} />
                  </div>
                  <div className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-brand-black/30">
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
