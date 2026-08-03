import { MapPin, Phone, MessageCircle, Instagram, Facebook, Clock } from "lucide-react";
import logoAsset from "@/assets/logo.png.asset.json";
import { useCompanyContact } from "@/hooks/useCompanyContact";

const quickLinks = [
  { href: "#inicio", label: "Início" },
  { href: "#estoque", label: "Estoque" },
  { href: "#sobre", label: "Sobre" },
  { href: "#financiamento", label: "Financiamento" },
  { href: "#contato", label: "Contato" },
];

export function Footer() {
  const {
    whatsappUrl: WHATSAPP_URL,
    phoneDisplay: PHONE_DISPLAY,
    phoneTel: PHONE_TEL,
    instagramUrl: INSTAGRAM_URL,
    facebookUrl: FACEBOOK_URL,
    addressLine1: ADDRESS_LINE_1,
    addressLine2: ADDRESS_LINE_2,
    addressCep: ADDRESS_CEP,
    mapsEmbedUrl: MAPS_EMBED_URL,
    businessHours,
  } = useCompanyContact();
  return (
    <footer id="contato" className="relative pt-24 pb-10 border-t border-white/5 bg-brand-black text-white/85">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <img src={logoAsset.url} alt="Excelência Multimarcas" className="h-12 w-auto" width={200} height={48} />
            <p className="mt-5 text-white/70 text-sm max-w-xs leading-relaxed">
              Padrão premium de atendimento, com a flexibilidade e variedade que só uma loja multimarcas oferece.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="inline-flex items-center justify-center w-14 h-14 rounded-full glass-dark hover:bg-white/10 hover:text-brand-yellow transition-colors"
              >
                <Instagram className="w-7 h-7" />
              </a>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="inline-flex items-center justify-center w-14 h-14 rounded-full glass-dark hover:bg-white/10 hover:text-brand-yellow transition-colors"
              >
                <Facebook className="w-7 h-7" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-sm uppercase tracking-[0.2em] text-brand-yellow font-semibold">Contato</h4>
            <ul className="mt-5 space-y-4 text-sm text-white/75">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-brand-yellow shrink-0" />
                <span>{ADDRESS_LINE_1}<br />{ADDRESS_LINE_2}<br />CEP {ADDRESS_CEP}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-brand-yellow shrink-0" />
                <a href={`tel:${PHONE_TEL}`} className="hover:text-brand-yellow">{PHONE_DISPLAY}</a>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-brand-yellow shrink-0" />
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="hover:text-brand-yellow">WhatsApp</a>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 mt-0.5 text-brand-yellow shrink-0" />
                <span className="whitespace-pre-line">{businessHours}</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-sm uppercase tracking-[0.2em] text-brand-yellow font-semibold">Links</h4>
            <ul className="mt-5 space-y-3 text-sm text-white/75">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="hover:text-brand-yellow transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-sm uppercase tracking-[0.2em] text-brand-yellow font-semibold">Localização</h4>
            <div className="mt-5 rounded-2xl overflow-hidden border border-white/10 aspect-video">
              <iframe
                title="Mapa Excelência Multimarcas"
                src={MAPS_EMBED_URL}
                loading="lazy"
                className="w-full h-full"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Excelência Multimarcas. Todos os direitos reservados.</p>
          <p>Desenvolvido com padrão premium.</p>
        </div>
      </div>

      {/* Floating WhatsApp */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white flex items-center justify-center shadow-[0_15px_35px_-10px_rgba(37,211,102,0.7)] hover:scale-110 transition-all"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </footer>
  );
}
