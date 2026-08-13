import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, MessageCircle } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import logoAsset from "@/assets/logo-crest.png.asset.json";
import { useCompanyContact } from "@/hooks/useCompanyContact";
import { SITE_NAME } from "@/lib/site-meta";

type NavLink =
  | { kind: "hash"; hash: string; label: string }
  | { kind: "route"; to: string; label: string };

const links: NavLink[] = [
  { kind: "hash", hash: "inicio", label: "Início" },
  { kind: "hash", hash: "estoque", label: "Estoque" },
  { kind: "route", to: "/catalogo", label: "Catálogo" },
  { kind: "hash", hash: "sobre", label: "Sobre" },
  { kind: "hash", hash: "financiamento", label: "Financiamento" },
  { kind: "hash", hash: "contato", label: "Contato" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const { whatsappUrl: WHATSAPP_URL } = useCompanyContact();

  const hashHref = (hash: string) => (isHome ? `#${hash}` : `/#${hash}`);

  const renderNavLink = (l: NavLink, className: string, onClick?: () => void) => {
    if (l.kind === "route") {
      return (
        <Link key={l.label} to={l.to} onClick={onClick} className={className}>
          {l.label}
          <span className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-0.5 w-0 bg-white group-hover:w-full transition-all duration-300" />
        </Link>
      );
    }
    return (
      <a key={l.label} href={hashHref(l.hash)} onClick={onClick} className={className}>
        {l.label}
        <span className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-0.5 w-0 bg-white group-hover:w-full transition-all duration-300" />
      </a>
    );
  };

  const desktopClass =
    "relative px-4 py-2 text-sm font-semibold transition-colors group text-white/90 hover:text-white";

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 bg-black py-4 shadow-elegant`}
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8 flex items-center justify-between">
        {isHome ? (
          <a href="#inicio" className="flex items-center gap-3">
            <img
              src={logoAsset.url}
              alt={SITE_NAME}
              className="h-12 lg:h-14 w-auto object-contain"
              width={180}
              height={56}
            />
          </a>
        ) : (
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logoAsset.url}
              alt={SITE_NAME}
              className="h-12 lg:h-14 w-auto object-contain"
              width={180}
              height={56}
            />
          </Link>
        )}

        <nav className="hidden lg:flex items-center justify-center flex-1 gap-2">
          {links.map((l) => renderNavLink(l, desktopClass))}
        </nav>

        <div className="flex items-center gap-4">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-red text-white font-bold text-sm shadow-lg hover:bg-brand-red/90 transition-all duration-300"
          >
            Fale Conosco
          </a>

          <button
            className="lg:hidden p-2 rounded-xl text-white hover:bg-white/10"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                  <X className="w-6 h-6" />
                </motion.span>
              ) : (
                <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                  <Menu className="w-6 h-6" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden overflow-hidden bg-black border-t border-white/10"
          >
            <div className="px-5 py-8 flex flex-col gap-2">
              {links.map((l) =>
                renderNavLink(
                  l,
                  "relative px-4 py-4 rounded-2xl text-lg font-bold text-white/90 hover:bg-white/10 transition-colors",
                  () => setOpen(false),
                ),
              )}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-brand-red text-white font-bold shadow-lg"
              >
                <MessageCircle className="w-5 h-5" /> Fale Conosco
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
