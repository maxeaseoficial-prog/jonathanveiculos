import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, FolderKanban, Loader2, Car } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/sections/Footer";
import { supabase } from "@/integrations/supabase/client";
import { title, SITE_NAME } from "@/lib/site-meta";

export const Route = createFileRoute("/catalogo/")({
  head: () => {
    const pageTitle = title("Catálogos");
    const description = `Explore os catálogos de veículos da ${SITE_NAME}: coleções, promoções e destaques selecionados.`;
    return {
      meta: [
        { title: pageTitle },
        { name: "description", content: description },
        { property: "og:title", content: pageTitle },
        { property: "og:description", content: description },
        { property: "og:image", content: `${SITE_URL}${OG_IMAGE}` },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: SITE_NAME },
        { property: "og:url", content: `${SITE_URL}/catalogo` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: pageTitle },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: `${SITE_URL}${OG_IMAGE}` },
      ],
      links: [{ rel: "canonical", href: "/catalogo" }],
    };
  },
  component: CatalogoPage,
});


type CatalogItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  vehicle_count: number;
};

async function fetchCatalogs(): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from("catalogs")
    .select(
      "id, slug, name, description, cover_url, active, display_order, vehicle_catalogs(vehicles(id, status, vehicle_images(url, is_primary, display_order)))",
    )
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((c: any) => {
    const links = Array.isArray(c.vehicle_catalogs) ? c.vehicle_catalogs : [];
    const activeVehicles = links
      .map((l: any) => l.vehicles)
      .filter((v: any) => v && v.status === "ativo");

    let fallback: string | null = null;
    for (const v of activeVehicles) {
      const imgs = (v.vehicle_images ?? []).slice().sort((a: any, b: any) => {
        if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
        return (a.display_order ?? 0) - (b.display_order ?? 0);
      });
      if (imgs[0]?.url) {
        fallback = imgs[0].url;
        break;
      }
    }

    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      cover_url: c.cover_url || fallback,
      vehicle_count: activeVehicles.length,
    };
  });
}

function CatalogoPage() {
  const queryClient = useQueryClient();
  const { data: catalogs = [], isLoading } = useQuery({
    queryKey: ["public-catalogs"],
    queryFn: fetchCatalogs,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });

  useEffect(() => {
    const channel = supabase
      .channel("public-catalogs-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "catalogs" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["public-catalogs"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicle_catalogs" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["public-catalogs"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <div className="bg-background text-foreground overflow-x-clip min-h-screen">
      <Header />
      <main className="pt-32 pb-24 lg:pt-40">
        <section className="mx-auto max-w-7xl px-5 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight tracking-tight text-brand-black">
              Coleções <span className="text-brand-red decoration-brand-red/20 underline decoration-8 underline-offset-8">selecionadas</span>.
            </h1>
            <p className="mt-8 text-brand-black/60 text-xl font-medium">
              Explore nossos veículos organizados por estilo, <br className="hidden md:block" /> segmento e ofertas especiais.
            </p>
          </motion.div>

          <div className="mt-14">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-6 w-6 animate-spin text-brand-yellow" />
              </div>
            ) : catalogs.length === 0 ? (
              <div className="rounded-3xl border border-black/5 bg-white p-14 text-center shadow-card-premium">
                <FolderKanban className="mx-auto h-10 w-10 text-foreground/40 mb-3" />
                <h3 className="text-xl font-semibold">Nenhum catálogo disponível</h3>
                <p className="mt-2 text-foreground/60 max-w-md mx-auto">
                  Em breve novos catálogos com nossos veículos selecionados.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {catalogs.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -6 }}
                  >
                    <Link
                      to="/catalogo/$slug"
                      params={{ slug: c.slug }}
                      className="group block bg-white rounded-[2.5rem] overflow-hidden border border-black/5 shadow-card-premium hover:shadow-elegant transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
                    >
                      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                        {c.cover_url ? (
                          <motion.img
                            src={c.cover_url}
                            alt={c.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            whileHover={{ scale: 1.06 }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-black to-zinc-800">
                            <FolderKanban className="h-12 w-12 text-brand-yellow/70" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-black/70 backdrop-blur text-[11px] font-semibold text-white">
                          <Car className="w-3 h-3" /> {c.vehicle_count} veículo{c.vehicle_count === 1 ? "" : "s"}
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-semibold leading-tight">{c.name}</h3>
                        {c.description && (
                          <p className="mt-2 text-sm text-foreground/60 line-clamp-2">{c.description}</p>
                        )}
                        <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-red">
                          Ver catálogo <ArrowUpRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
