import { motion } from "framer-motion";
import { Check, ShieldCheck, Wrench, Wallet, Repeat, TrendingUp, Headphones } from "lucide-react";
import fachadaAsset from "@/assets/fachada.png.asset.json";

const items = [
  { icon: ShieldCheck, title: "Procedência Garantida", text: "Histórico completo e documentação 100% verificada." },
  { icon: Wrench, title: "Veículos Revisados", text: "Inspeção rigorosa para sua total segurança." },
  { icon: Wallet, title: "Financiamento Facilitado", text: "As melhores taxas com os principais bancos." },
  { icon: Repeat, title: "Avaliação do seu Usado", text: "Troca simplificada com valor justo no seu veículo." },
  { icon: Headphones, title: "Atendimento Especializado", text: "Consultoria completa em cada etapa da compra." },
  { icon: ShieldCheck, title: "Garantia de Qualidade", text: "Compromisso com a satisfação do nosso cliente." },
];

export function Features() {
  return (
    <section className="relative py-32 lg:py-48 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Lado esquerdo - Imagem grande decorativa */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-elegant">
              <img 
                src={fachadaAsset.url} 
                alt="Showroom Jonathan Veículos" 
                className="w-full h-full object-cover grayscale-[0.2]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black/60 to-transparent" />
            </div>
            
            {/* Elemento flutuante de stats ou algo assim */}
            <div className="absolute -bottom-10 -right-10 bg-brand-red p-10 rounded-[2.5rem] shadow-red-glow text-white hidden sm:block">
              <p className="text-4xl font-bold">10+</p>
              <p className="text-sm font-bold uppercase tracking-widest opacity-80">Anos de Experiência</p>
            </div>
          </motion.div>

          {/* Lado direito - Benefícios */}
          <div className="order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-brand-black tracking-tight">
                Por que escolher a <br />
                <span className="text-brand-red">Jonathan Veículos</span>.
              </h2>
              <p className="mt-8 text-brand-black/60 text-lg font-medium leading-relaxed">
                Nossa reputação é construída sobre transparência e excelência em cada detalhe. 
                Oferecemos uma experiência de compra premium para clientes exigentes.
              </p>
            </motion.div>

            <div className="mt-12 grid sm:grid-cols-2 gap-10">
              {items.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex flex-col gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand-red/5 flex items-center justify-center text-brand-red">
                    <Check className="w-6 h-6 stroke-[3px]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-brand-black">{item.title}</h3>
                    <p className="mt-1 text-brand-black/50 text-sm font-medium leading-relaxed">{item.text}</p>
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
