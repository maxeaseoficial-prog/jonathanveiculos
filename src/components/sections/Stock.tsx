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
    <section id="estoque" className="relative py-32 lg:py-48 bg-white">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col gap-12 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-brand-black tracking-tight">
              Encontre o seu <span className="text-brand-red">próximo carro</span>.
            </h2>
            <p className="mt-6 text-brand-black/60 text-lg font-medium">
              Veículos selecionados com o mais alto padrão de qualidade e procedência garantida.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col lg:flex-row gap-4 items-center"
          >
            <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-black/30" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Qual veículo você procura?"
                className="w-full h-16 pl-14 pr-12 rounded-2xl bg-surface border border-black/5 text-lg placeholder:text-brand-black/30 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:bg-white transition-all shadow-sm"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-brand-black/40 hover:bg-black/5"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="flex w-full lg:w-auto gap-3">
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="flex-1 lg:w-48 h-16 px-6 rounded-2xl bg-surface border border-black/5 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
              >
                <option value="all">Todas as Marcas</option>
                {brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="flex-1 lg:w-48 h-16 px-6 rounded-2xl bg-surface border border-black/5 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
              >
                <option value="recent">Lançamentos</option>
                <option value="price-asc">Menor Preço</option>
                <option value="price-desc">Maior Preço</option>
                <option value="year-desc">Mais Novos</option>
              </select>
            </div>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-14">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-[2.5rem] bg-surface aspect-[4/5] animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="rounded-[3rem] border border-black/5 bg-surface p-20 text-center shadow-card-premium">
            <h3 className="text-2xl font-bold">Nenhum veículo encontrado</h3>
            <p className="mt-4 text-brand-black/50 max-w-md mx-auto">
              Tente ajustar sua busca ou filtros para ver outras opções do nosso estoque.
            </p>
            <button 
              onClick={() => { setQuery(""); setBrandFilter("all"); setSortBy("recent"); }}
              className="mt-8 px-8 py-4 rounded-full bg-brand-black text-white font-bold hover:brightness-125 transition-all"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-14">
            {displayed.map((v, i) => (
              <motion.article
                key={v.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => setSelectedId(v.id)}
                className="group cursor-pointer"
              >
                <div className="relative rounded-[2.5rem] overflow-hidden aspect-[4/5] shadow-card-premium group-hover:shadow-elegant transition-all duration-700">
                  {v.image ? (
                    <motion.img
                      src={v.image}
                      alt={`${v.brand} ${v.model}`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface flex items-center justify-center text-brand-black/20 font-bold uppercase tracking-widest text-xs">
                      Sem Imagem
                    </div>
                  )}
                  
                  {/* Badge de Marca */}
                  <div className="absolute top-6 left-6 px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-md shadow-sm text-xs font-bold uppercase tracking-widest text-brand-black">
                    {v.brand}
                  </div>

                  {/* Overlay ao hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="absolute bottom-8 left-8 right-8 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <button className="w-full py-4 rounded-2xl bg-white text-brand-black font-bold text-sm uppercase tracking-widest shadow-elegant">
                      Ver Detalhes
                    </button>
                  </div>
                </div>

                <div className="mt-8 px-2">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-2xl font-bold text-brand-black leading-tight group-hover:text-brand-red transition-colors">{v.model}</h3>
                    <span className="text-2xl font-bold text-brand-black font-display whitespace-nowrap">
                      {v.price != null ? priceFmt.format(Number(v.price)) : "Consulta"}
                    </span>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-6 text-sm font-bold text-brand-black/40 uppercase tracking-widest">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> {v.year}
                    </span>
                    {v.km != null && (
                      <span className="flex items-center gap-2">
                        <Gauge className="w-4 h-4" /> {kmFmt.format(v.km)} KM
                      </span>
                    )}
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


