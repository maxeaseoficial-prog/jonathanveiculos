import { MapPin, Phone, MessageCircle, Instagram, Facebook, Clock } from "lucide-react";
import logoAsset from "@/assets/logo-crest.png.asset.json";
import { useCompanyContact } from "@/hooks/useCompanyContact";
import { SITE_NAME } from "@/lib/site-meta";


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
    <footer id="contato" className="relative pt-32 pb-12 bg-white border-t border-black/5">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-20">
          <div className="lg:col-span-4 flex flex-col items-start gap-8">
            <img 
              src={logoAsset.url} 
              alt={SITE_NAME} 
              className="h-14 w-auto object-contain" 
              width={200} 
              height={56} 
            />
            <div className="flex gap-4">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="w-14 h-14 rounded-2xl bg-surface border border-black/5 flex items-center justify-center text-brand-black hover:bg-brand-red hover:text-white transition-all duration-300"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noreferrer"
                className="w-14 h-14 rounded-2xl bg-surface border border-black/5 flex items-center justify-center text-brand-black hover:bg-brand-red hover:text-white transition-all duration-300"
              >
                <Facebook className="w-6 h-6" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-brand-black/30 mb-8">Nossas Unidades</h4>
            <div className="grid gap-8">
              <div className="flex gap-5">
                <MapPin className="w-6 h-6 text-brand-red shrink-0" />
                <div className="text-base font-bold text-brand-black/70 leading-relaxed">
                  <span className="text-xs uppercase tracking-wider text-brand-black/40 block mb-1">Matriz: Porto União</span>
                  {ADDRESS_LINE_1}<br />
                  {ADDRESS_LINE_2}<br />
                  CEP {ADDRESS_CEP}
                </div>
              </div>
              <div className="flex gap-5">
                <MapPin className="w-6 h-6 text-brand-red shrink-0" />
                <div className="text-base font-bold text-brand-black/70 leading-relaxed">
                  <span className="text-xs uppercase tracking-wider text-brand-black/40 block mb-1">Filial: Bituruna</span>
                  Av. Pref. Farid Abrahão, 546<br />
                  Bituruna / PR<br />
                  CEP 84640-000
                </div>
              </div>
              <div className="flex gap-5">
                <Clock className="w-6 h-6 text-brand-red shrink-0" />
                <div className="text-base font-bold text-brand-black/70 whitespace-pre-line">
                  {businessHours}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-brand-black/30 mb-8">Navegação</h4>
            <ul className="grid grid-cols-2 gap-6">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <a 
                    href={l.href} 
                    className="text-lg font-bold text-brand-black/70 hover:text-brand-red transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a 
                  href={`tel:${PHONE_TEL}`}
                  className="text-lg font-bold text-brand-black/70 hover:text-brand-red transition-colors"
                >
                  {PHONE_DISPLAY}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-32 pt-12 border-t border-black/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm font-bold text-brand-black/30 uppercase tracking-widest">
            © {new Date().getFullYear()} {SITE_NAME}
          </p>
        </div>
      </div>

      {/* Botão flutuante WhatsApp atualizado */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-8 right-8 z-40 w-16 h-16 rounded-[1.5rem] bg-brand-red text-white flex items-center justify-center shadow-red-glow hover:scale-110 active:scale-95 transition-all duration-300 group"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-8 h-8 transition-transform group-hover:rotate-12" />
      </a>
    </footer>
  );
}
