import { motion } from "framer-motion";
import { Check } from "lucide-react";

const items = [
  { title: "Procedência Garantida", text: "Histórico completo e documentação 100% verificada." },
  { title: "Veículos Revisados", text: "Inspeção rigorosa para sua total segurança." },
  { title: "Financiamento Facilitado", text: "As melhores taxas com os principais bancos." },
  { title: "Avaliação do seu Usado", text: "Troca simplificada com valor justo no seu veículo." },
  { title: "Atendimento Especializado", text: "Consultoria completa em cada etapa da compra." },
  { title: "Garantia de Qualidade", text: "Compromisso com a satisfação do nosso cliente." },
];

export function Features() {
  return (
    <section className="relative py-32 lg:py-48 bg-white overflow-hidden text-center">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="max-w-4xl mx-auto mb-20">
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
            <p className="mt-8 text-brand-black/60 text-lg font-medium leading-relaxed max-w-2xl mx-auto">
              Nossa reputação é construída sobre transparência e excelência em cada detalhe. 
              Oferecemos uma experiência de compra premium para clientes exigentes.
            </p>
          </motion.div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center gap-4 p-8 rounded-[2rem] bg-gray-50/50 hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-red/5 flex items-center justify-center text-brand-red">
                <Check className="w-6 h-6 stroke-[3px]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-brand-black">{item.title}</h3>
                <p className="mt-2 text-brand-black/50 text-sm font-medium leading-relaxed">{item.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
