import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Calendar, Gauge, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/sections/Footer";
import { VehicleDetailDialog } from "@/components/sections/VehicleDetailDialog";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContact } from "@/hooks/useCompanyContact";
import { title, SITE_NAME } from "@/lib/site-meta";

export const Route = createFileRoute("/catalogo/$slug")({
  head: ({ params }) => {
    const pageTitle = title(`Catálogo ${params.slug}`);
    const description = `Veículos do catálogo ${params.slug} na ${SITE_NAME}. Veja modelos, preços e entre em contato.`;
    return {
      meta: [
        { title: pageTitle },
        { name: "description", content: description },
        { property: "og:title", content: pageTitle },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: SITE_NAME },
        { property: "og:url", content: `/catalogo/${params.slug}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/catalogo/${params.slug}` }],
    };
  },
  component: CatalogoDetalhePage,
  notFoundComponent: CatalogNotFound,
  errorComponent: ({ reset }) => (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
      <div>
        <h1 className="text-xl font-semibold">Não foi possível carregar o catálogo</h1>
        <button
          onClick={reset}
          className="mt-4 inline-flex px-4 py-2 rounded-full bg-brand-black text-white text-sm"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  ),
});


const priceFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const kmFmt = new Intl.NumberFormat("pt-BR");

type CatalogVehicle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  km: number | null;
  price: number | null;
  previous_price: number | null;
  image: string | null;
};

type CatalogData = {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  vehicles: CatalogVehicle[];
};

async function fetchCatalog(slug: string): Promise<CatalogData> {
  const { data: catalog, error: catErr } = await supabase
    .from("catalogs")
    .select("id, name, description, cover_url, active")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (catErr) throw catErr;
  if (!catalog) throw notFound();

  const { data: rows, error: linkErr } = await supabase
    .from("vehicle_catalogs")
    .select(
      "vehicle_id, vehicles(id, brand, model, year, km, price, previous_price, status, featured, created_at, vehicle_images(url, is_primary, display_order))",
    )
    .eq("catalog_id", catalog.id);

  if (linkErr) throw linkErr;

  const vehicles: CatalogVehicle[] = (rows ?? [])
    .map((r: any) => r.vehicles)
    .filter((v: any) => v && v.status === "ativo")
    .map((v: any) => {
      const imgs = (v.vehicle_images ?? []).slice().sort((a: any, b: any) => {
        if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
        return (a.display_order ?? 0) - (b.display_order ?? 0);
      });
      return {
        id: v.id,
        brand: v.brand,
        model: v.model,
        year: v.year,
        km: v.km,
        price: v.price,
        previous_price: v.previous_price ?? null,
        image: imgs[0]?.url ?? null,
      };
    });

  return {
    id: catalog.id,
    name: catalog.name,
    description: catalog.description,
    cover_url: catalog.cover_url,
    vehicles,
  };
}

function CatalogNotFound() {
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="pt-40 pb-24 mx-auto max-w-3xl px-5 text-center">
        <h1 className="text-3xl font-bold">Catálogo não encontrado</h1>
        <p className="mt-2 text-foreground/60">
          O catálogo que você procura não existe ou foi desativado.
        </p>
        <Link
          to="/catalogo"
          className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-brand-black text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Ver todos os catálogos
        </Link>
      </main>
      <Footer />
    </div>
  );
}

function CatalogoDetalhePage() {
  const { whatsappUrl: WHATSAPP_URL } = useCompanyContact();
  const { slug } = Route.useParams();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const veiculoId = params.get("veiculo");
    if (veiculoId) {
      setSelectedId(veiculoId);
    }

    const handlePopState = () => {
      const currentParams = new URLSearchParams(window.location.search);
      const id = currentParams.get("veiculo");
      setSelectedId(id);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleOpenDetail = (id: string | null) => {
    setSelectedId(id);
    const url = new URL(window.location.href);
    if (id) {
      url.searchParams.set("veiculo", id);
    } else {
      url.searchParams.delete("veiculo");
    }
    window.history.pushState({}, "", url.toString());
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-catalog", slug],
    queryFn: () => fetchCatalog(slug),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });

  useEffect(() => {
    const channel = supabase
      .channel(`public-catalog-${slug}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicle_catalogs" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["public-catalog", slug] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["public-catalog", slug] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, slug]);

  if (error && (error as any)?.name === "NotFoundError") {
    return <CatalogNotFound />;
  }

  return (
    <div className="bg-background text-foreground overflow-x-clip min-h-screen">
      <Header />
      <main className="pt-32 pb-24 lg:pt-40">
        <section className="mx-auto max-w-7xl px-5 lg:px-8">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Todos os catálogos
          </Link>

          {isLoading || !data ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-brand-yellow" />
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr] items-center"
              >
                <div>
                  <h1 className="mt-3 text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight tracking-tight text-brand-black">
                    {data.name}
                  </h1>
                  {data.description && (
                    <p className="mt-4 text-foreground/70 text-lg max-w-2xl">{data.description}</p>
                  )}
                  <div className="mt-4 text-sm text-foreground/50">
                    {data.vehicles.length} veículo{data.vehicles.length === 1 ? "" : "s"} nesta coleção
                  </div>
                </div>
                {data.cover_url && (
                  <div className="rounded-[2.5rem] overflow-hidden border border-black/5 shadow-card-premium aspect-[16/10]">
                    <img
                      src={data.cover_url}
                      alt={data.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </motion.div>

              <div className="mt-14">
                {data.vehicles.length === 0 ? (
                  <div className="rounded-3xl border border-black/5 bg-white p-14 text-center shadow-card-premium">
                    <h3 className="text-xl font-semibold">Nenhum veículo neste catálogo</h3>
                    <p className="mt-2 text-foreground/60 max-w-md mx-auto">
                      Fale com nosso time para conhecer opções semelhantes disponíveis.
                    </p>
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-brand-black text-white text-sm font-medium hover:bg-brand-black/85 transition-colors"
                    >
                      Falar no WhatsApp <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.vehicles.map((v, i) => (
                      <motion.article
                        key={v.id}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.6, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ y: -6 }}
                        onClick={() => handleOpenDetail(v.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(v.id);
                          }
                        }}
                        className="group bg-white rounded-[2rem] overflow-hidden border border-black/5 shadow-card-premium hover:shadow-elegant transition-all duration-500 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
                      >
                        <div className="relative overflow-hidden aspect-[4/3] bg-muted">
                          {v.image ? (
                            <motion.img
                              src={v.image}
                              alt={`${v.brand} ${v.model}`}
                              loading="lazy"
                              className="w-full h-full object-cover"
                              whileHover={{ scale: 1.06 }}
                              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-foreground/40 text-sm">
                              Sem imagem
                            </div>
                          )}
                          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-brand-black/70 backdrop-blur text-[11px] uppercase tracking-widest font-semibold text-white">
                            {v.brand}
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-semibold leading-tight">{v.model}</h3>
                          <div className="mt-3 flex items-center gap-4 text-xs text-foreground/60">
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" /> {v.year}
                            </span>
                            {v.km != null && (
                              <span className="inline-flex items-center gap-1.5">
                                <Gauge className="w-3.5 h-3.5" /> {kmFmt.format(v.km)} km
                              </span>
                            )}
                          </div>
                          <div className="mt-5 flex items-end justify-between gap-3">
                            <div>
                              <div className="text-[11px] uppercase tracking-widest text-foreground/50">
                                A partir de
                              </div>
                              {v.previous_price != null &&
                                v.price != null &&
                                Number(v.previous_price) > Number(v.price) && (
                                  <div className="text-sm text-brand-black/40 font-bold line-through leading-none">
                                    {priceFmt.format(Number(v.previous_price))}
                                  </div>
                                )}
                              <div className="text-2xl font-bold text-brand-red font-display">
                                {v.price != null ? priceFmt.format(Number(v.price)) : "Sob consulta"}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(v.id);
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-surface hover:bg-brand-red hover:text-white text-xs font-bold transition-all duration-300"
                            >
                              Ver detalhes <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
      <VehicleDetailDialog
        vehicleId={selectedId}
        open={!!selectedId}
        onOpenChange={(o) => {
          if (!o) handleOpenDetail(null);
        }}
      />
    </div>
  );
}
