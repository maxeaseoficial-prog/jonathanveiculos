import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Calendar, Gauge, Search, X, SlidersHorizontal, MapPin } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCompanyContact } from "@/hooks/useCompanyContact";
import { supabase } from "@/integrations/supabase/client";
import { VehicleDetailDialog } from "./VehicleDetailDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

type StockVehicle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  km: number | null;
  price: number | null;
  previous_price: number | null;
  image: string | null;
  filial: string;
  updated_at: string | null;
  category?: string; // We'll infer this or it might be in DB
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
    .select("id, brand, model, year, km, price, previous_price, featured, filial, created_at, updated_at, vehicle_images(url, is_primary, display_order)")
    .eq("status", "ativo")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

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
      filial: v.filial,
      updated_at: v.updated_at,
      // Heuristic for category if not in DB yet
      category: v.model.toLowerCase().includes('moto') ? 'Motos' : 'Carros'
    };
  });
}

export function Stock() {
  const { whatsappUrl: WHATSAPP_URL } = useCompanyContact();
  const queryClient = useQueryClient();
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["public-stock-vehicles"],
    queryFn: fetchStockVehicles,
    staleTime: 5000,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filialFilter, setFilialFilter] = useState<string>("all");
  
  // Advanced filters (internal state for the sheet)
  const [tempBrand, setTempBrand] = useState<string>("all");
  const [tempCategory, setTempCategory] = useState<string>("all");
  const [tempSort, setTempSort] = useState<string>("recent");
  const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([0, 1000000]);
  const [tempYearRange, setTempYearRange] = useState<[number, number]>([1990, new Date().getFullYear() + 1]);
  const [tempKmMax, setTempKmMax] = useState<number>(500000);

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    brand: "all",
    category: "all",
    sort: "recent",
    priceRange: [0, 1000000] as [number, number],
    yearRange: [1990, new Date().getFullYear() + 1] as [number, number],
    kmMax: 500000
  });

  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const v of vehicles) if (v.brand) set.add(v.brand);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [vehicles]);

  const maxPrice = useMemo(() => {
    return Math.max(...vehicles.map(v => v.price ?? 0), 1000000);
  }, [vehicles]);

  const minYear = useMemo(() => {
    return Math.min(...vehicles.map(v => v.year), 1990);
  }, [vehicles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = vehicles.filter((v) => {
      if (filialFilter !== "all" && v.filial !== filialFilter) return false;
      if (appliedFilters.brand !== "all" && v.brand !== appliedFilters.brand) return false;
      if (appliedFilters.category !== "all" && v.category !== appliedFilters.category) return false;
      
      const price = v.price ?? 0;
      if (price < appliedFilters.priceRange[0] || price > appliedFilters.priceRange[1]) return false;
      if (v.year < appliedFilters.yearRange[0] || v.year > appliedFilters.yearRange[1]) return false;
      if ((v.km ?? 0) > appliedFilters.kmMax) return false;

      if (!q) return true;
      const hay = `${v.brand} ${v.model} ${v.year}`.toLowerCase();
      return hay.includes(q);
    });

    const sorted = [...list];
    switch (appliedFilters.sort) {
      case "price-asc":
        sorted.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
        break;
      case "price-desc":
        sorted.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
        break;
      case "year-desc":
        sorted.sort((a, b) => b.year - a.year);
        break;
      case "year-asc":
        sorted.sort((a, b) => a.year - b.year);
        break;
      case "km-asc":
        sorted.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
        break;
    }
    return sorted;
  }, [vehicles, query, filialFilter, appliedFilters]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      brand: tempBrand,
      category: tempCategory,
      sort: tempSort,
      priceRange: tempPriceRange,
      yearRange: tempYearRange,
      kmMax: tempKmMax
    });
  };

  const handleClearFilters = () => {
    const defaultFilters = {
      brand: "all",
      category: "all",
      sort: "recent",
      priceRange: [0, maxPrice] as [number, number],
      yearRange: [minYear, new Date().getFullYear() + 1] as [number, number],
      kmMax: 500000
    };
    setTempBrand("all");
    setTempCategory("all");
    setTempSort("recent");
    setTempPriceRange([0, maxPrice]);
    setTempYearRange([minYear, new Date().getFullYear() + 1]);
    setTempKmMax(500000);
    setAppliedFilters(defaultFilters);
  };

  useEffect(() => {
    const channel = supabase
      .channel("public-stock-live-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["public-stock-vehicles"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return (
    <section id="estoque" className="relative py-32 lg:py-48 bg-white overflow-hidden">
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
          </motion.div>

          {/* New Clean Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col md:flex-row items-stretch md:items-center gap-4"
          >
            {/* 1. Search Field */}
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-black/30" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pesquise por marca, modelo ou versão..."
                className="w-full h-16 pl-14 pr-12 rounded-2xl bg-surface border border-black/5 text-lg placeholder:text-brand-black/30 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:bg-white transition-all shadow-sm"
              />
            </div>

            <div className="flex gap-3 h-16">
              {/* 2. City Selector */}
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-black/40 group-focus-within:text-brand-red transition-colors" />
                <select
                  value={filialFilter}
                  onChange={(e) => setFilialFilter(e.target.value)}
                  className="w-full md:w-44 h-full pl-11 pr-8 rounded-2xl bg-surface border border-black/5 text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
                >
                  <option value="all">Todas as Cidades</option>
                  <option value="Porto União">Porto União</option>
                  <option value="Bituruna">Bituruna</option>
                </select>
              </div>

              {/* 3. Filter Button with Drawer */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-full px-6 rounded-2xl bg-surface border-black/5 hover:bg-brand-red hover:text-white hover:border-brand-red group transition-all duration-300">
                    <SlidersHorizontal className="w-5 h-5 mr-2" />
                    <span className="font-bold uppercase tracking-wider text-xs">Filtros</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full border-l-0 shadow-2xl">
                  <div className="p-8 border-b border-black/5 flex items-center justify-between bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
                    <SheetHeader className="p-0">
                      <SheetTitle className="text-2xl font-bold text-brand-black flex items-center gap-3">
                        <SlidersHorizontal className="w-6 h-6 text-brand-red" />
                        Filtros Avançados
                      </SheetTitle>
                    </SheetHeader>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Sort */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-brand-black/40">Ordenação</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'recent', label: 'Mais Recentes' },
                          { id: 'year-asc', label: 'Mais Antigos' },
                          { id: 'price-asc', label: 'Menor Preço' },
                          { id: 'price-desc', label: 'Maior Preço' }
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setTempSort(item.id)}
                            className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${tempSort === item.id ? 'bg-brand-red text-white border-brand-red shadow-lg shadow-brand-red/20' : 'bg-surface border-black/5 text-brand-black/60 hover:bg-black/5'}`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Brand */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-brand-black/40">Marca</h4>
                      <select
                        value={tempBrand}
                        onChange={(e) => setTempBrand(e.target.value)}
                        className="w-full h-14 px-5 rounded-xl bg-surface border border-black/5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-all appearance-none cursor-pointer"
                      >
                        <option value="all">Todas as Marcas</option>
                        {brands.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>

                    {/* Category */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-brand-black/40">Categoria</h4>
                      <div className="flex gap-2">
                        {['all', 'Carros', 'Motos'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setTempCategory(cat)}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${tempCategory === cat ? 'bg-brand-red text-white border-brand-red' : 'bg-surface border-black/5 text-brand-black/60'}`}
                          >
                            {cat === 'all' ? 'Todas' : cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-brand-black/40">Faixa de Preço</h4>
                        <span className="text-xs font-bold text-brand-red">
                          {priceFmt.format(tempPriceRange[0])} - {priceFmt.format(tempPriceRange[1])}
                        </span>
                      </div>
                      <Slider
                        value={tempPriceRange}
                        onValueChange={(val) => setTempPriceRange(val as [number, number])}
                        max={maxPrice}
                        step={5000}
                        minStepsBetweenThumbs={1}
                      />
                    </div>

                    {/* Year Range */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-brand-black/40">Ano</h4>
                        <span className="text-xs font-bold text-brand-red">
                          {tempYearRange[0]} - {tempYearRange[1]}
                        </span>
                      </div>
                      <Slider
                        value={tempYearRange}
                        onValueChange={(val) => setTempYearRange(val as [number, number])}
                        min={minYear}
                        max={new Date().getFullYear() + 1}
                        step={1}
                      />
                    </div>

                    {/* KM Slider */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-brand-black/40">Quilometragem Máxima</h4>
                        <span className="text-xs font-bold text-brand-red">
                          Até {kmFmt.format(tempKmMax)} KM
                        </span>
                      </div>
                      <Slider
                        value={[tempKmMax]}
                        onValueChange={(val) => setTempKmMax(val[0])}
                        max={500000}
                        step={1000}
                      />
                    </div>
                  </div>

                  <SheetFooter className="p-8 border-t border-black/5 bg-surface/50 flex flex-row gap-3 sm:space-x-0">
                    <Button variant="ghost" onClick={handleClearFilters} className="flex-1 h-14 rounded-xl font-bold text-brand-black/40 hover:text-brand-red hover:bg-brand-red/5">
                      Limpar
                    </Button>
                    <SheetTrigger asChild>
                      <Button onClick={handleApplyFilters} className="flex-2 h-14 bg-brand-red text-white hover:brightness-110 rounded-xl font-bold shadow-lg shadow-brand-red/20 transition-all">
                        Aplicar Filtros
                      </Button>
                    </SheetTrigger>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-14">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-[2.5rem] bg-surface aspect-[4/5] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[3rem] border border-black/5 bg-surface p-20 text-center shadow-card-premium">
            <h3 className="text-2xl font-bold">Nenhum veículo encontrado</h3>
            <p className="mt-4 text-brand-black/50 max-w-md mx-auto">
              Tente ajustar sua busca ou filtros para ver outras opções do nosso estoque.
            </p>
            <Button onClick={handleClearFilters} className="mt-8 px-8 py-4 rounded-full bg-brand-black text-white font-bold hover:brightness-125 transition-all">
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-14">
            <AnimatePresence mode="popLayout">
              {filtered.map((v, i) => (
                <motion.article
                  key={v.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setSelectedId(v.id)}
                  className="group cursor-pointer"
                >
                  <div className="relative rounded-[2.5rem] overflow-hidden aspect-[4/5] shadow-card-premium group-hover:shadow-elegant transition-all duration-700">
                    {v.image ? (
                      <img
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
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                      <div className="px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-md shadow-sm text-[10px] font-bold uppercase tracking-widest text-brand-black">
                        {v.brand}
                      </div>
                      <div className="px-4 py-2 rounded-full bg-brand-red text-white shadow-sm text-[10px] font-bold uppercase tracking-widest">
                        {v.filial}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-8 left-8 right-8 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <Button className="w-full h-14 rounded-2xl bg-white text-brand-black font-bold text-sm uppercase tracking-widest shadow-elegant">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>

                  <div className="mt-8 px-2">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-2xl font-bold text-brand-black leading-tight group-hover:text-brand-red transition-colors">{v.model}</h3>
                      <span className="text-2xl font-bold text-brand-black font-display whitespace-nowrap">
                        {v.price != null ? priceFmt.format(Number(v.price)) : "Consulta"}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-6 text-[10px] font-bold text-brand-black/40 uppercase tracking-widest">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-brand-red/50" /> {v.year}
                      </span>
                      {v.km != null && (
                        <span className="flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-brand-red/50" /> {kmFmt.format(v.km)} KM
                        </span>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
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



