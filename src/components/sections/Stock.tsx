import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Calendar, Gauge, Search, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCompanyContact } from "@/hooks/useCompanyContact";
import { supabase } from "@/integrations/supabase/client";
import { VehicleDetailDialog } from "./VehicleDetailDialog";



type StockVehicle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  km: number | null;
  price: number | null;
  previous_price: number | null;
  image: string | null;
  updated_at: string | null;
};


const priceFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const kmFmt = new Intl.NumberFormat("pt-BR");
const STOCK_LOG_PREFIX = "[Public Stock]";
const VEHICLE_SYNC_EVENT = "excelencia:vehicles-updated";

function logPublicStock(step: string, details?: unknown) {
  if (details === undefined) {
    console.info(`${STOCK_LOG_PREFIX} ${step}`);
    return;
  }

  console.info(`${STOCK_LOG_PREFIX} ${step}`, details);
}

async function fetchStockVehicles(): Promise<StockVehicle[]> {
  logPublicStock("Buscando veículos publicados no banco.");
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, brand, model, year, km, price, previous_price, featured, created_at, updated_at, vehicle_images(url, is_primary, display_order)")
    .eq("status", "ativo")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });


  if (error) throw error;

  logPublicStock("Veículos publicados recebidos.", { total: data?.length ?? 0 });

  return (data ?? []).map((v: any) => {
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
      updated_at: v.updated_at,
    };
  });
}

export function Stock() {
  const { whatsappUrl: WHATSAPP_URL } = useCompanyContact();
  const queryClient = useQueryClient();
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["public-stock-vehicles"],
    queryFn: fetchStockVehicles,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
    refetchInterval: 5000,
    gcTime: 0,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "price-asc" | "price-desc" | "year-desc" | "km-asc">("recent");

  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const v of vehicles) if (v.brand) set.add(v.brand);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [vehicles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = vehicles.filter((v) => {
      if (brandFilter !== "all" && v.brand !== brandFilter) return false;
      if (!q) return true;
      const hay = `${v.brand} ${v.model} ${v.year}`.toLowerCase();
      return hay.includes(q);
    });
    const sorted = [...list];
    switch (sortBy) {
      case "price-asc":
        sorted.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
        break;
      case "price-desc":
        sorted.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
        break;
      case "year-desc":
        sorted.sort((a, b) => b.year - a.year);
        break;
      case "km-asc":
        sorted.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
        break;
    }
    return sorted;
  }, [vehicles, query, brandFilter, sortBy]);

  const hasFilter = query.trim() !== "" || brandFilter !== "all" || sortBy !== "recent";
  const displayed = hasFilter ? filtered : filtered.slice(0, 6);


  useEffect(() => {
    const refreshStock = (source: string, details?: unknown) => {
      logPublicStock("Atualização recebida; recarregando estoque público.", { source, details });
      void queryClient.invalidateQueries({ queryKey: ["public-stock-vehicles"] });
      void queryClient.refetchQueries({ queryKey: ["public-stock-vehicles"], type: "active" });
      void queryClient.invalidateQueries({ queryKey: ["vehicle-detail"] });
    };

    const channel = supabase
      .channel("public-stock-live-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, (payload) => {
        refreshStock("tempo real: vehicles", payload);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicle_images" }, (payload) => {
        refreshStock("tempo real: vehicle_images", payload);
      })
      .subscribe((status) => {
        logPublicStock("Canal em tempo real do estoque público.", { status });
      });

    const onLocalSync = (event: Event) => {
      refreshStock("evento local", (event as CustomEvent).detail);
    };

    const onStorageSync = (event: StorageEvent) => {
      if (event.key === VEHICLE_SYNC_EVENT) refreshStock("evento entre abas", event.newValue);
    };

    window.addEventListener(VEHICLE_SYNC_EVENT, onLocalSync);
    window.addEventListener("storage", onStorageSync);

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener(VEHICLE_SYNC_EVENT, onLocalSync);
      window.removeEventListener("storage", onStorageSync);
    };
  }, [queryClient]);


  return (
    <section id="estoque" className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-xs uppercase tracking-[0.3em] text-brand-yellow font-semibold">Estoque</span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Destaques do <span className="text-brand-accent">showroom</span>.
            </h2>
            <p className="mt-4 text-foreground/70 max-w-xl">
              Uma seleção dos veículos mais procurados da semana. Todos revisados, com procedência garantida.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-6 flex flex-col sm:flex-row gap-3 max-w-3xl"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por marca, modelo ou ano..."
                  className="w-full h-12 pl-11 pr-10 rounded-full bg-white border border-black/10 shadow-sm text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Limpar busca"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-foreground/50 hover:text-foreground hover:bg-muted transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="h-12 px-4 rounded-full bg-white border border-black/10 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              >
                <option value="all">Todas as marcas</option>
                {brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="h-12 px-4 rounded-full bg-white border border-black/10 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              >
                <option value="recent">Mais recentes</option>
                <option value="price-asc">Menor preço</option>
                <option value="price-desc">Maior preço</option>
                <option value="year-desc">Ano mais novo</option>
                <option value="km-asc">Menor KM</option>
              </select>
            </motion.div>

          </motion.div>
          <motion.a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 self-start lg:self-auto px-5 py-3 rounded-full bg-brand-black text-white text-sm font-medium hover:bg-brand-black/85 transition-colors"
          >
            Ver estoque completo <ArrowUpRight className="w-4 h-4" />
          </motion.a>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl bg-white border border-black/5 shadow-card-premium overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-6 space-y-3">
                  <div className="h-5 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-8 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="rounded-3xl border border-black/5 bg-white p-14 text-center shadow-card-premium">
            <h3 className="text-xl font-semibold">
              {vehicles.length === 0 ? "Estoque em atualização" : "Nenhum veículo encontrado"}
            </h3>
            <p className="mt-2 text-foreground/60 max-w-md mx-auto">
              {vehicles.length === 0
                ? "Novos veículos serão publicados em breve. Fale com nosso time para conhecer as opções disponíveis."
                : "Tente ajustar a busca ou os filtros para ver mais opções."}
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
            {displayed.map((v, i) => (

              <motion.article
                key={v.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6 }}
                onClick={() => setSelectedId(v.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedId(v.id); } }}
                className="group bg-white rounded-3xl overflow-hidden border border-black/5 shadow-card-premium hover:shadow-elegant transition-shadow duration-500 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
              
              >
                <div className="relative overflow-hidden aspect-[4/3] bg-muted">
                  {v.image ? (
                    <motion.img
                      src={v.image}
                      alt={`${v.brand} ${v.model}`}
                      loading="lazy"
                      width={1200}
                      height={800}
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
                    <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {v.year}</span>
                    {v.km != null && (
                      <span className="inline-flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5" /> {kmFmt.format(v.km)} km</span>
                    )}
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-foreground/50">A partir de</div>
                      {v.previous_price != null && v.price != null && Number(v.previous_price) > Number(v.price) && (
                        <div className="text-sm text-[#FFC400] font-semibold line-through leading-none">
                          {priceFmt.format(Number(v.previous_price))}
                        </div>
                      )}
                      <div className="text-2xl font-bold text-brand-accent font-display">
                        {v.price != null ? priceFmt.format(Number(v.price)) : "Sob consulta"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedId(v.id); }}

                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-muted hover:bg-brand-yellow hover:text-brand-black text-sm font-semibold transition-all duration-300"
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
      <VehicleDetailDialog
        vehicleId={selectedId}
        open={!!selectedId}
        onOpenChange={(o) => { if (!o) setSelectedId(null); }}
      />
    </section>
  );

}
