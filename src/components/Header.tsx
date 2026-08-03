import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, MessageCircle } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import logoAsset from "@/assets/logo.png.asset.json";
import { useCompanyContact } from "@/hooks/useCompanyContact";

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
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const { whatsappUrl: WHATSAPP_URL } = useCompanyContact();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const hashHref = (hash: string) => (isHome ? `#${hash}` : `/#${hash}`);

  const renderNavLink = (l: NavLink, className: string, onClick?: () => void) => {
    if (l.kind === "route") {
      return (
        <Link key={l.label} to={l.to} onClick={onClick} className={className}>
          {l.label}
          <span className="absolute left-4 right-4 -bottom-0.5 h-px bg-brand-yellow scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
        </Link>
      );
    }
    return (
      <a key={l.label} href={hashHref(l.hash)} onClick={onClick} className={className}>
        {l.label}
        <span className="absolute left-4 right-4 -bottom-0.5 h-px bg-brand-yellow scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
      </a>
    );
  };

  const desktopClass =
    "relative px-4 py-2 text-sm font-medium transition-colors group text-white/85 hover:text-white";

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled || !isHome
          ? "bg-brand-black/95 backdrop-blur-xl shadow-card-premium border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className={`mx-auto max-w-7xl px-5 lg:px-8 h-24 flex items-center justify-between text-white`}>
        {isHome ? (
          <a href="#inicio" className="flex items-center gap-3">
            <img
              src={logoAsset.url}
              alt="Excelência Multimarcas"
              className={`h-16 lg:h-20 w-auto transition-all duration-300 ${scrolled ? "" : "drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"}`}
              width={240}
              height={80}
            />
          </a>
        ) : (
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logoAsset.url}
              alt="Excelência Multimarcas"
              className="h-16 lg:h-20 w-auto"
              width={240}
              height={80}
            />
          </Link>
        )}

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => renderNavLink(l, desktopClass))}
        </nav>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="hidden lg:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold text-sm shadow-[0_10px_30px_-10px_rgba(37,211,102,0.6)] transition-colors duration-300"
        >
          <MessageCircle className="w-4 h-4" />
          Fale Conosco
        </a>

        <button
          className={`lg:hidden p-2 rounded-lg text-white hover:bg-white/10`}
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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden overflow-hidden bg-brand-black/95 backdrop-blur-xl border-t border-white/5 text-white"
          >
            <div className="px-5 py-6 flex flex-col gap-1">
              {links.map((l) =>
                renderNavLink(
                  l,
                  "relative px-4 py-3 rounded-xl text-base font-medium text-white/90 hover:bg-white/5 transition-colors",
                  () => setOpen(false),
                ),
              )}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Fale Conosco
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
