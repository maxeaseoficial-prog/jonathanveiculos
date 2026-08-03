import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Power,
  Car,
  Bike,
  Loader2,
  ArrowUp,
  ArrowDown,
  Star,
  Upload,
  X,
  Image as ImageIcon,
  Filter as FilterIcon,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type VehicleStatus = "ativo" | "inativo" | "vendido" | "reservado" | "oculto";
type FuelType = "gasolina" | "etanol" | "flex" | "diesel" | "hibrido" | "eletrico" | "gnv";
type TransmissionType = "manual" | "automatico" | "automatizado" | "cvt";

interface VehicleImage {
  id: string;
  vehicle_id: string;
  url: string;
  storage_path: string | null;
  display_order: number;
  is_primary: boolean;
}

interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  version: string | null;
  category: string | null;
  year: number;
  model_year: number | null;
  km: number;
  color: string | null;
  fuel: FuelType | null;
  transmission: TransmissionType | null;
  engine: string | null;
  power: string | null;
  doors: number | null;
  plate_end: string | null;
  price: number;
  previous_price: number | null;
  status: VehicleStatus;
  filial: string;
  featured: boolean;
  on_sale: boolean;
  is_new_arrival: boolean;
  description: string | null;
  standard_items: string | null;
  optional_items: string | null;
  notes: string | null;
  first_owner: boolean | null;
  single_owner: boolean | null;
  revised: boolean | null;
  accepts_trade: boolean | null;
  financeable: boolean | null;
  owner_manual: boolean | null;
  spare_key: boolean | null;
  warranty: boolean | null;
  created_at: string;
  updated_at: string;
  // client-side augmentation
  images?: VehicleImage[];
  primary_image_url?: string | null;
}

interface PendingImage {
  id: string;
  file: File;
  preview: string;
  is_primary: boolean;
}


type QuickFilter = "todos" | "ativos" | "inativos" | "destaque" | "promocao" | "vendidos" | "reservados";
type SortKey = "recent" | "old" | "price_desc" | "price_asc" | "km_asc" | "km_desc" | "alpha";

const FILIAL_OPTIONS = ["Porto União", "Bituruna"];

const FUEL_OPTIONS: { value: FuelType; label: string }[] = [
  { value: "flex", label: "Flex" },
  { value: "gasolina", label: "Gasolina" },
  { value: "etanol", label: "Etanol" },
  { value: "diesel", label: "Diesel" },
  { value: "hibrido", label: "Híbrido" },
  { value: "eletrico", label: "Elétrico" },
  { value: "gnv", label: "GNV" },
];

const TRANSMISSION_OPTIONS: { value: TransmissionType; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "automatico", label: "Automático" },
  { value: "automatizado", label: "Automatizado" },
  { value: "cvt", label: "CVT" },
];

const CAR_CATEGORY_OPTIONS = [
  "Hatch",
  "Sedan",
  "SUV",
  "Picape",
  "Utilitário",
  "Coupé",
  "Conversível",
  "Van",
  "Esportivo",
];

const MOTO_CATEGORY_OPTIONS = [
  "Street",
  "Naked",
  "Custom",
  "Esportiva",
  "Trail / Big Trail",
  "Scooter",
  "Cub",
  "Off-Road",
  "Touring",
];

const CATEGORY_OPTIONS = [...CAR_CATEGORY_OPTIONS, ...MOTO_CATEGORY_OPTIONS];

type VehicleType = "carro" | "moto";

function inferVehicleType(category?: string | null): VehicleType {
  if (category && MOTO_CATEGORY_OPTIONS.includes(category)) return "moto";
  return "carro";
}


const STATUS_LABEL: Record<VehicleStatus, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  vendido: "Vendido",
  reservado: "Reservado",
  oculto: "Oculto",
};

const STATUS_COLOR: Record<VehicleStatus, string> = {
  ativo: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  inativo: "bg-zinc-500/15 text-zinc-500 border-zinc-500/30",
  vendido: "bg-red-500/15 text-red-600 border-red-500/30",
  reservado: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  oculto: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const NUM = new Intl.NumberFormat("pt-BR");
const STOCK_LOG_PREFIX = "[Vehicle CRUD]";
const VEHICLE_SYNC_EVENT = "excelencia:vehicles-updated";

type SaveAction = "create" | "update";

function logVehicleFlow(step: string, details?: unknown) {
  if (details === undefined) {
    console.info(`${STOCK_LOG_PREFIX} ${step}`);
    return;
  }

  console.info(`${STOCK_LOG_PREFIX} ${step}`, details);
}

function logVehicleFlowError(step: string, error: unknown, details?: Record<string, unknown>) {
  console.error(`${STOCK_LOG_PREFIX} ERRO`, {
    etapa: step,
    mensagem: error instanceof Error ? error.message : String(error),
    erro: error,
    ...(details ?? {}),
  });
}

function normalizeVehicleRow(row: any): Vehicle {
  const imgs: VehicleImage[] = ((row?.vehicle_images ?? []) as VehicleImage[]).slice().sort(
    (a: VehicleImage, b: VehicleImage) =>
      (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.display_order - b.display_order,
  );
  const primary = imgs.find((i) => i.is_primary) ?? imgs[0];
  return { ...row, images: imgs, primary_image_url: primary?.url ?? null } as Vehicle;
}

function broadcastVehicleUpdate(vehicleId: string | null, source: string) {
  const detail = { vehicleId, source, at: new Date().toISOString() };
  logVehicleFlow("Atualizando site público.", detail);

  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(VEHICLE_SYNC_EVENT, { detail }));
  try {
    window.localStorage.setItem(VEHICLE_SYNC_EVENT, JSON.stringify(detail));
  } catch (err) {
    logVehicleFlowError("Enviar sinal local de sincronização", err, { vehicleId, source });
  }
}

async function fetchVehicleForAdmin(vehicleId: string): Promise<Vehicle> {
  logVehicleFlow("Carregando dados atuais do veículo.", { vehicleId });
  const { data, error } = await supabase
    .from("vehicles")
    .select("*, vehicle_images(*)")
    .eq("id", vehicleId)
    .maybeSingle();

  if (error) {
    logVehicleFlowError("Carregar dados atuais do veículo", error, { vehicleId });
    throw error;
  }

  if (!data) {
    const err = new Error("Veículo não encontrado no banco de dados.");
    logVehicleFlowError("Carregar dados atuais do veículo", err, { vehicleId });
    throw err;
  }

  logVehicleFlow("Dados carregados com sucesso.", { vehicleId, updated_at: data.updated_at });
  return normalizeVehicleRow(data);
}

function emptyForm(): Partial<Vehicle> {
  return {
    brand: "",
    model: "",
    version: "",
    category: "",
    year: undefined as any,
    model_year: null,
    km: undefined as any,
    color: "",
    fuel: "flex",
    transmission: "automatico",
    engine: "",
    power: "",
    doors: null,
    plate_end: "",
    price: undefined as any,
    filial: "Porto União",
    previous_price: null,
    status: "ativo",
    featured: false,
    on_sale: false,
    description: "",
    standard_items: "",
    optional_items: "",
    notes: "",
    first_owner: false,
    single_owner: false,
    revised: true,
    accepts_trade: true,
    financeable: true,
    owner_manual: false,
    spare_key: false,
    warranty: false,
  };
}

export function StockManager() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("todos");
  const [brandFilter, setBrandFilter] = useState<string>("todas");
  const [yearFilter, setYearFilter] = useState<string>("todos");
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");
  const [filialFilter, setFilialFilter] = useState<string>("todas");
  const [sortKey, setSortKey] = useState<SortKey>("recent");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [toDelete, setToDelete] = useState<Vehicle | null>(null);
  const [viewing, setViewing] = useState<Vehicle | null>(null);

  const loadVehicles = useCallback(async (reason = "manual") => {
    setLoading(true);
    logVehicleFlow("Carregando lista do painel.", { reason });
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, vehicle_images(*)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const list: Vehicle[] = (data ?? []).map(normalizeVehicleRow);
      setVehicles(list);
      logVehicleFlow("Lista do painel atualizada.", { total: list.length, reason });
    } catch (err) {
      logVehicleFlowError("Carregar lista do painel", err, { reason });
      toast.error("Não foi possível carregar os veículos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVehicles("montagem do painel");
  }, [loadVehicles]);

  useEffect(() => {
    const refreshAdminStock = (source: string, details?: unknown) => {
      logVehicleFlow("Sincronização recebida no painel.", { source, details });
      void queryClient.invalidateQueries({ queryKey: ["public-stock-vehicles"] });
      void queryClient.invalidateQueries({ queryKey: ["vehicle-detail"] });
      void loadVehicles(source);
    };

    const channel = supabase
      .channel("admin-stock-live-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, (payload) => {
        refreshAdminStock("tempo real: vehicles", payload);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicle_images" }, (payload) => {
        refreshAdminStock("tempo real: vehicle_images", payload);
      })
      .subscribe((status) => {
        logVehicleFlow("Canal em tempo real do painel.", { status });
      });

    const onLocalSync = (event: Event) => {
      refreshAdminStock("evento local", (event as CustomEvent).detail);
    };

    const onStorageSync = (event: StorageEvent) => {
      if (event.key === VEHICLE_SYNC_EVENT) refreshAdminStock("evento entre abas", event.newValue);
    };

    window.addEventListener(VEHICLE_SYNC_EVENT, onLocalSync);
    window.addEventListener("storage", onStorageSync);

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener(VEHICLE_SYNC_EVENT, onLocalSync);
      window.removeEventListener("storage", onStorageSync);
    };
  }, [loadVehicles, queryClient]);

  const brands = useMemo(() => Array.from(new Set(vehicles.map((v) => v.brand).filter(Boolean))).sort(), [vehicles]);
  const years = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.year))).sort((a, b) => b - a),
    [vehicles],
  );
  const categories = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.category).filter(Boolean) as string[])).sort(),
    [vehicles],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = vehicles.filter((v) => {
      if (q) {
        const hay = `${v.brand} ${v.model} ${v.version ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      switch (quickFilter) {
        case "ativos":
          if (v.status !== "ativo") return false;
          break;
        case "inativos":
          if (v.status !== "inativo") return false;
          break;
        case "destaque":
          if (!v.featured) return false;
          break;
        case "promocao":
          if (!v.on_sale) return false;
          break;
        case "vendidos":
          if (v.status !== "vendido") return false;
          break;
        case "reservados":
          if (v.status !== "reservado") return false;
          break;
      }
      if (brandFilter !== "todas" && v.brand !== brandFilter) return false;
      if (yearFilter !== "todos" && String(v.year) !== yearFilter) return false;
      if (categoryFilter !== "todas" && v.category !== categoryFilter) return false;
      if (filialFilter !== "todas" && v.filial !== filialFilter) return false;
      return true;
    });

    const cmp: Record<SortKey, (a: Vehicle, b: Vehicle) => number> = {
      recent: (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
      old: (a, b) => +new Date(a.created_at) - +new Date(b.created_at),
      price_desc: (a, b) => b.price - a.price,
      price_asc: (a, b) => a.price - b.price,
      km_asc: (a, b) => a.km - b.km,
      km_desc: (a, b) => b.km - a.km,
      alpha: (a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`),
    };
    out = [...out].sort(cmp[sortKey]);
    return out;
  }, [vehicles, search, quickFilter, brandFilter, yearFilter, categoryFilter, sortKey]);

  async function toggleActive(v: Vehicle) {
    const next: VehicleStatus = v.status === "ativo" ? "inativo" : "ativo";
    logVehicleFlow("Enviando atualização de status.", { vehicleId: v.id, statusAtual: v.status, novoStatus: next });
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .update({ status: next, updated_at: new Date().toISOString() })
        .eq("id", v.id)
        .select("id, status, updated_at")
        .maybeSingle();
      logVehicleFlow("Resposta do banco recebida.", { vehicleId: v.id, response: data, error });
      if (error) throw error;
      if (!data) throw new Error("Nenhum veículo foi atualizado. Verifique o ID e as permissões.");
      const refreshed = await fetchVehicleForAdmin(v.id);
      setVehicles((list) => list.map((x) => (x.id === v.id ? refreshed : x)));
      toast.success(next === "ativo" ? "Veículo ativado" : "Veículo desativado");
      logVehicleFlow("Atualizando lista do painel.", { vehicleId: v.id });
      await loadVehicles("status atualizado");
      await queryClient.invalidateQueries({ queryKey: ["public-stock-vehicles"] });
      await queryClient.invalidateQueries({ queryKey: ["vehicle-detail", v.id] });
      broadcastVehicleUpdate(v.id, "status atualizado");
      logVehicleFlow("Processo concluído.", { vehicleId: v.id });
    } catch (err) {
      logVehicleFlowError("Atualizar status", err, { vehicleId: v.id, dadosEnviados: { status: next } });
      toast.error("Falha ao atualizar status");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      // Remove storage files
      const paths = (toDelete.images ?? []).map((i) => i.storage_path).filter(Boolean) as string[];
      if (paths.length) {
        await supabase.storage.from("vehicle-images").remove(paths);
      }
      logVehicleFlow("Removendo veículo.", { vehicleId: toDelete.id });
      const { data, error } = await supabase.from("vehicles").delete().eq("id", toDelete.id).select("id").maybeSingle();
      logVehicleFlow("Resposta do banco recebida.", { vehicleId: toDelete.id, response: data, error });
      if (error) throw error;
      if (!data) throw new Error("Nenhum veículo foi removido. Verifique o ID e as permissões.");
      toast.success("Veículo removido com sucesso.");
      setVehicles((list) => list.filter((x) => x.id !== toDelete.id));
      await queryClient.invalidateQueries({ queryKey: ["public-stock-vehicles"] });
      await queryClient.invalidateQueries({ queryKey: ["vehicle-detail", toDelete.id] });
      broadcastVehicleUpdate(toDelete.id, "veículo removido");
    } catch (err) {
      logVehicleFlowError("Remover veículo", err, { vehicleId: toDelete.id });
      toast.error("Não foi possível remover o veículo.");
    } finally {
      setToDelete(null);
    }
  }

  return (
    <div className="bg-white text-zinc-900 rounded-3xl border border-zinc-200/70 shadow-sm p-5 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-[Sora] text-2xl md:text-3xl font-bold tracking-tight text-zinc-900">Estoque de Veículos</h2>
          <p className="text-sm text-zinc-500 mt-1">Gerencie todos os veículos cadastrados no site.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="bg-brand-red hover:bg-brand-red/90 text-white font-semibold rounded-xl h-11 px-5 shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Veículo
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por marca, modelo ou versão…"
              className="pl-9 h-11 rounded-xl border-zinc-200 bg-zinc-50"
            />
          </div>
          <div className="flex gap-2">
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="h-11 rounded-xl border-zinc-200 bg-zinc-50 min-w-[140px]">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as marcas</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="h-11 rounded-xl border-zinc-200 bg-zinc-50 min-w-[110px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os anos</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-11 rounded-xl border-zinc-200 bg-zinc-50 min-w-[140px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas categorias</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filialFilter} onValueChange={setFilialFilter}>
              <SelectTrigger className="h-11 rounded-xl border-zinc-200 bg-zinc-50 min-w-[140px]">
                <SelectValue placeholder="Filial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as filiais</SelectItem>
                {FILIAL_OPTIONS.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="h-11 rounded-xl border-zinc-200 bg-zinc-50 min-w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="old">Mais antigos</SelectItem>
                <SelectItem value="price_desc">Maior preço</SelectItem>
                <SelectItem value="price_asc">Menor preço</SelectItem>
                <SelectItem value="km_asc">Menor KM</SelectItem>
                <SelectItem value="km_desc">Maior KM</SelectItem>
                <SelectItem value="alpha">Ordem alfabética</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["todos", "Todos"],
              ["ativos", "Ativos"],
              ["inativos", "Inativos"],
              ["destaque", "Em destaque"],
              ["promocao", "Em promoção"],
              ["vendidos", "Vendidos"],
              ["reservados", "Reservados"],
            ] as [QuickFilter, string][]
          ).map(([key, label]) => {
            const active = quickFilter === key;
            return (
              <button
                key={key}
                onClick={() => setQuickFilter(key)}
                className={cn(
                  "h-9 px-4 rounded-full text-xs font-semibold transition-colors border",
                  active
                    ? "bg-black text-white border-black"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table / cards */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-200 rounded-2xl">
          <ImageIcon className="h-8 w-8 mx-auto text-zinc-300" />
          <p className="mt-3 text-sm text-zinc-500">Nenhum veículo encontrado.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto rounded-2xl border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Foto</th>
                  <th className="text-left font-semibold px-4 py-3">Veículo</th>
                  <th className="text-left font-semibold px-4 py-3">Ano</th>
                  <th className="text-left font-semibold px-4 py-3">KM</th>
                  <th className="text-left font-semibold px-4 py-3">Preço</th>
                  <th className="text-left font-semibold px-4 py-3">Filial</th>
                  <th className="text-left font-semibold px-4 py-3">Categoria</th>
                  <th className="text-left font-semibold px-4 py-3">Status</th>
                  <th className="text-left font-semibold px-4 py-3">Flags</th>
                  <th className="text-left font-semibold px-4 py-3">Cadastro</th>
                  <th className="text-right font-semibold px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="h-14 w-20 rounded-lg overflow-hidden bg-zinc-100 flex items-center justify-center">
                        {v.primary_image_url ? (
                          <img src={v.primary_image_url} alt={v.name} loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-zinc-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{v.brand} {v.model}</div>
                      <div className="text-xs text-zinc-500">{v.version || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{v.year}{v.model_year && v.model_year !== v.year ? `/${v.model_year}` : ""}</td>
                    <td className="px-4 py-3 text-zinc-700">{NUM.format(v.km)}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{BRL.format(v.price)}</div>
                      {v.previous_price && v.previous_price > v.price && (
                        <div className="text-[11px] text-zinc-400 line-through">{BRL.format(v.previous_price)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200 uppercase">
                        <span className="w-1.5 h-1.5 rounded-sm bg-brand-red" />
                        {v.filial}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{v.category || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border", STATUS_COLOR[v.status])}>
                        {STATUS_LABEL[v.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {v.featured && <Badge className="bg-brand-red text-white hover:bg-brand-red/90">Destaque</Badge>}
                        {v.on_sale && <Badge className="bg-[#E30613] hover:bg-[#E30613]">Promo</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {new Date(v.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconAction title="Visualizar" onClick={() => setViewing(v)}><Eye className="h-4 w-4" /></IconAction>
                        <IconAction title="Editar" onClick={() => { logVehicleFlow("Abrindo edição do veículo ID:", { vehicleId: v.id }); setEditing(v); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></IconAction>
                        <IconAction title={v.status === "ativo" ? "Desativar" : "Ativar"} onClick={() => toggleActive(v)}>
                          <Power className={cn("h-4 w-4", v.status === "ativo" ? "text-emerald-600" : "text-zinc-400")} />
                        </IconAction>
                        <IconAction title="Excluir" onClick={() => setToDelete(v)} danger><Trash2 className="h-4 w-4" /></IconAction>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map((v) => (
              <div key={v.id} className="border border-zinc-200 rounded-2xl p-3 flex gap-3">
                <div className="h-20 w-24 rounded-lg overflow-hidden bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  {v.primary_image_url ? (
                    <img src={v.primary_image_url} alt={v.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-zinc-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{v.brand} {v.model}</div>
                      <div className="text-xs text-zinc-500 truncate">{v.version || "—"}</div>
                    </div>
                    <span className={cn("h-fit inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border", STATUS_COLOR[v.status])}>
                      {STATUS_LABEL[v.status]}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">{v.year} · {NUM.format(v.km)} km · {v.category || "—"}</div>
                    <div className="mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200 uppercase">
                      <span className="w-1 h-1 rounded-sm bg-brand-red" />
                      {v.filial}
                    </span>
                    <div className="font-semibold text-sm">{BRL.format(v.price)}</div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {v.featured && <Badge className="bg-brand-red text-white hover:bg-brand-red/90 text-[10px]">Destaque</Badge>}
                    {v.on_sale && <Badge className="bg-[#E30613] hover:bg-[#E30613] text-[10px]">Promo</Badge>}
                  </div>
                  <div className="flex justify-end gap-1 mt-2">
                    <IconAction title="Visualizar" onClick={() => setViewing(v)}><Eye className="h-4 w-4" /></IconAction>
                    <IconAction title="Editar" onClick={() => { logVehicleFlow("Abrindo edição do veículo ID:", { vehicleId: v.id }); setEditing(v); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></IconAction>
                    <IconAction title={v.status === "ativo" ? "Desativar" : "Ativar"} onClick={() => toggleActive(v)}>
                      <Power className={cn("h-4 w-4", v.status === "ativo" ? "text-emerald-600" : "text-zinc-400")} />
                    </IconAction>
                    <IconAction title="Excluir" onClick={() => setToDelete(v)} danger><Trash2 className="h-4 w-4" /></IconAction>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Form dialog */}
      <VehicleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={async (savedVehicle, action) => {
          logVehicleFlow("Atualizando lista do painel.", { vehicleId: savedVehicle.id, action });
          setVehicles((list) => {
            const exists = list.some((item) => item.id === savedVehicle.id);
            if (action === "update" || exists) return list.map((item) => (item.id === savedVehicle.id ? savedVehicle : item));
            return [savedVehicle, ...list];
          });
          await queryClient.invalidateQueries({ queryKey: ["public-stock-vehicles"] });
          await queryClient.invalidateQueries({ queryKey: ["vehicle-detail", savedVehicle.id] });
          await queryClient.invalidateQueries({ queryKey: ["vehicle-detail"] });
          broadcastVehicleUpdate(savedVehicle.id, `salvamento ${action}`);
          await loadVehicles(`salvamento ${action}`);
          setDialogOpen(false);
          setEditing(null);
          logVehicleFlow("Processo concluído.", { vehicleId: savedVehicle.id, action });
        }}
      />

      {/* View dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewing?.brand} {viewing?.model}</DialogTitle>
            <DialogDescription>{viewing?.version || "—"} · {viewing?.year}</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              {viewing.images && viewing.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {viewing.images.slice(0, 6).map((img) => (
                    <img key={img.id} src={img.url} className="w-full aspect-[4/3] object-cover rounded-lg" />
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <Info label="Preço" value={BRL.format(viewing.price)} />
                <Info label="KM" value={NUM.format(viewing.km)} />
                <Info label="Câmbio" value={viewing.transmission || "—"} />
                <Info label="Combustível" value={viewing.fuel || "—"} />
                <Info label="Motor" value={viewing.engine || "—"} />
                <Info label="Cor" value={viewing.color || "—"} />
                <Info label="Portas" value={String(viewing.doors ?? "—")} />
                <Info label="Categoria" value={viewing.category || "—"} />
              </div>
              {viewing.description && (
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Descrição</div>
                  <p className="text-sm whitespace-pre-wrap">{viewing.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir veículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. O veículo <b>{toDelete?.brand} {toDelete?.model}</b> e todas as suas imagens serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-[#E30613] hover:bg-[#c40510]">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function IconAction({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "h-9 w-9 inline-flex items-center justify-center rounded-lg border border-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors",
        danger && "hover:bg-red-50 hover:text-[#E30613]",
      )}
    >
      {children}
    </button>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

/* ---------------- Form dialog ---------------- */

function VehicleFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Vehicle | null;
  onSaved: (vehicle: Vehicle, action: SaveAction) => void | Promise<void>;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("basicos");
  const [form, setForm] = useState<Partial<Vehicle>>(emptyForm());
  const [vehicleType, setVehicleType] = useState<VehicleType>("carro");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;

    const resetPendingPreviews = () => {
      setPending((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.preview));
        return [];
      });
    };

    if (editing) {
      logVehicleFlow("Abrindo edição do veículo ID:", { vehicleId: editing.id });
      logVehicleFlow("Carregando dados...", { vehicleId: editing.id });
      setForm({ ...editing });
      setVehicleType(inferVehicleType(editing.category));
      setImages(editing.images ?? []);

      void fetchVehicleForAdmin(editing.id)
        .then((freshVehicle) => {
          if (!active) return;
          setForm({ ...freshVehicle });
          setVehicleType(inferVehicleType(freshVehicle.category));
          setImages(freshVehicle.images ?? []);
          logVehicleFlow("Dados carregados com sucesso.", { vehicleId: freshVehicle.id, updated_at: freshVehicle.updated_at });
        })
        .catch((err) => {
          if (!active) return;
          logVehicleFlowError("Carregar edição do veículo", err, { vehicleId: editing.id });
          toast.error("Não foi possível carregar os dados atuais do veículo.");
        });
    } else {
      logVehicleFlow("Abrindo cadastro de novo veículo.");
      setForm(emptyForm());
      setVehicleType("carro");
      setImages([]);
    }

    resetPendingPreviews();
    setErrors({});
    setTab("basicos");

    return () => {
      active = false;
    };
  }, [open, editing]);


  function set<K extends keyof Vehicle>(key: K, value: Vehicle[K] | null) {
    setForm((f) => ({ ...f, [key]: value as any }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.brand?.trim()) e.brand = "Obrigatório";
    if (!form.model?.trim()) e.model = "Obrigatório";
    if (!form.year || form.year < 1900) e.year = "Ano inválido";
    if (form.km == null || form.km < 0) e.km = "KM inválida";
    if (!form.price || form.price <= 0) e.price = "Preço obrigatório";
    if (!form.category?.trim()) e.category = "Obrigatório";
    if (!form.filial?.trim()) e.filial = "Obrigatório";
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      const map: Record<string, string> = { brand: "basicos", model: "basicos", year: "basicos", km: "basicos", category: "basicos", price: "valores" };
      setTab(map[first] || "basicos");
      logVehicleFlowError("Validação do formulário", new Error("Campos obrigatórios inválidos."), {
        vehicleId: editing?.id,
        erros: e,
        dadosEnviados: form,
      });
      toast.error("Preencha os campos obrigatórios destacados.");
      return false;
    }
    return true;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    const action: SaveAction = editing ? "update" : "create";
    const targetId = editing?.id ?? null;
    try {
      const payload = {
        brand: form.brand!.trim(),
        model: form.model!.trim(),
        version: form.version?.trim() || null,
        name: `${form.brand} ${form.model}${form.version ? ` ${form.version}` : ""}`.trim(),
        category: form.category?.trim() || null,
        year: Number(form.year),
        model_year: form.model_year ? Number(form.model_year) : null,
        km: Number(form.km) || 0,
        color: form.color?.trim() || null,
        fuel: form.fuel ?? null,
        transmission: form.transmission ?? null,
        engine: form.engine?.trim() || null,
        power: form.power?.trim() || null,
        doors: form.doors ? Number(form.doors) : null,
        plate_end: form.plate_end?.trim() || null,
        price: Number(form.price),
        previous_price: form.previous_price ? Number(form.previous_price) : null,
        status: (form.status as VehicleStatus) ?? "ativo",
        featured: !!form.featured,
        on_sale: !!form.on_sale,
        description: form.description?.trim() || null,
        standard_items: form.standard_items?.trim() || null,
        optional_items: form.optional_items?.trim() || null,
        notes: form.notes?.trim() || null,
        first_owner: !!form.first_owner,
        single_owner: !!form.single_owner,
        revised: !!form.revised,
        accepts_trade: !!form.accepts_trade,
        financeable: !!form.financeable,
        owner_manual: !!form.owner_manual,
        spare_key: !!form.spare_key,
        warranty: !!form.warranty,
        filial: form.filial || "Porto União",
      };

      let vId: string;
      let savedVehicle: Vehicle;
      if (editing) {
        logVehicleFlow("Enviando atualização...", { vehicleId: editing.id, dadosEnviados: payload });
        const { data: updateResponse, error } = await supabase
          .from("vehicles")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editing.id)
          .select("id, updated_at")
          .maybeSingle();
        logVehicleFlow("Resposta do banco recebida.", { vehicleId: editing.id, response: updateResponse, error });
        if (error) throw error;
        if (!updateResponse) throw new Error("Nenhum registro foi atualizado. O ID do veículo não retornou do banco.");
        if (updateResponse.id !== editing.id) {
          throw new Error(`O banco retornou um ID diferente do veículo editado: ${updateResponse.id}`);
        }
        vId = editing.id;
        logVehicleFlow("Registro atualizado.", { vehicleId: vId, updated_at: updateResponse.updated_at });
      } else {
        logVehicleFlow("Enviando cadastro...", { dadosEnviados: payload });
        const { data: inserted, error } = await supabase
          .from("vehicles")
          .insert(payload)
          .select("id, updated_at")
          .single();
        logVehicleFlow("Resposta do banco recebida.", { response: inserted, error });
        if (error) throw error;
        vId = (inserted as { id: string }).id;
        logVehicleFlow("Registro criado.", { vehicleId: vId, updated_at: inserted.updated_at });
      }

      // Upload pending images (from create flow)
      if (pending.length > 0) {
        logVehicleFlow("Enviando imagens pendentes...", { vehicleId: vId, total: pending.length });
        await uploadPendingToVehicle(vId, pending);
        setPending((prev) => {
          prev.forEach((p) => URL.revokeObjectURL(p.preview));
          return [];
        });
      }

      logVehicleFlow("Confirmando persistência no banco.", { vehicleId: vId });
      savedVehicle = await fetchVehicleForAdmin(vId);
      logVehicleFlow("Atualização confirmada no banco.", {
        vehicleId: savedVehicle.id,
        price: savedVehicle.price,
        km: savedVehicle.km,
        status: savedVehicle.status,
        updated_at: savedVehicle.updated_at,
      });

      logVehicleFlow("Invalidando caches de veículos.", { vehicleId: vId });
      await queryClient.invalidateQueries({ queryKey: ["public-stock-vehicles"] });
      await queryClient.invalidateQueries({ queryKey: ["vehicle-detail", vId] });
      await queryClient.invalidateQueries({ queryKey: ["vehicle-detail"] });
      broadcastVehicleUpdate(vId, `form ${action}`);

      toast.success(editing ? "Veículo atualizado com sucesso." : "Veículo cadastrado com sucesso.");
      await onSaved(savedVehicle, action);
    } catch (err: any) {
      logVehicleFlowError(action === "update" ? "Salvar alterações do veículo" : "Cadastrar veículo", err, {
        vehicleId: targetId,
        dadosEnviados: form,
      });
      toast.error(err?.message ?? "Não foi possível salvar o veículo.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadPendingToVehicle(vId: string, items: PendingImage[]) {
    for (let i = 0; i < items.length; i++) {
      const p = items[i];
      const ext = p.file.name.split(".").pop() || "jpg";
      const path = `${vId}/${Date.now()}-${i}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("vehicle-images")
        .upload(path, p.file, { cacheControl: "3600", upsert: false, contentType: p.file.type });
      if (upErr) {
        logVehicleFlowError("Upload de imagem", upErr, { vehicleId: vId, storage_path: path });
        throw upErr;
      }
      const { data: signed, error: signErr } = await supabase.storage
        .from("vehicle-images")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signErr) {
        logVehicleFlowError("Gerar URL assinada da imagem", signErr, { vehicleId: vId, storage_path: path });
        throw signErr;
      }
      const imagePayload = {
        vehicle_id: vId,
        url: signed.signedUrl,
        storage_path: path,
        display_order: i,
        is_primary: p.is_primary,
      };
      const { data: imageRow, error: insErr } = await supabase.from("vehicle_images").insert(imagePayload).select("id").single();
      logVehicleFlow("Resposta do banco recebida.", { vehicleId: vId, response: imageRow, error: insErr });
      if (insErr) throw insErr;
    }
  }

  async function synchronizeAfterImageChange(vId: string, step: string) {
    logVehicleFlow("Invalidando caches de veículos.", { vehicleId: vId, step });
    await queryClient.invalidateQueries({ queryKey: ["public-stock-vehicles"] });
    await queryClient.invalidateQueries({ queryKey: ["vehicle-detail", vId] });
    await queryClient.invalidateQueries({ queryKey: ["vehicle-detail"] });
    broadcastVehicleUpdate(vId, step);
  }

  const vehicleId = editing?.id;

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    const currentCount = vehicleId ? images.length : pending.length;
    if (currentCount + arr.length > 20) {
      toast.error("Limite de 20 imagens por veículo.");
      return;
    }

    // Create flow: queue locally and upload on save
    if (!vehicleId) {
      setPending((prev) => {
        const next = [...prev];
        arr.forEach((file) => {
          next.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            file,
            preview: URL.createObjectURL(file),
            is_primary: next.length === 0,
          });
        });
        return next;
      });
      return;
    }

    setUploading(true);
    try {
      const baseOrder = images.length;
      for (let i = 0; i < arr.length; i++) {
        const file = arr[i];
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${vehicleId}/${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("vehicle-images")
          .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
        if (upErr) throw upErr;

        const { data: signed, error: signErr } = await supabase.storage
          .from("vehicle-images")
          .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        if (signErr) throw signErr;

        const isPrimary = images.length === 0 && i === 0;
        const { data: row, error: insErr } = await supabase
          .from("vehicle_images")
          .insert({
            vehicle_id: vehicleId,
            url: signed.signedUrl,
            storage_path: path,
            display_order: baseOrder + i,
            is_primary: isPrimary,
          })
          .select("*")
          .single();
        if (insErr) throw insErr;
        setImages((prev) => [...prev, row as VehicleImage]);
      }
      toast.success("Imagens enviadas.");
      await synchronizeAfterImageChange(vehicleId, "imagens enviadas");
    } catch (err: any) {
      logVehicleFlowError("Enviar imagens do veículo", err, { vehicleId, totalArquivos: arr.length });
      toast.error(err?.message ?? "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  function removePending(id: string) {
    setPending((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      const next = prev.filter((p) => p.id !== id);
      if (target?.is_primary && next.length > 0) next[0].is_primary = true;
      return next;
    });
  }

  function setPendingPrimary(id: string) {
    setPending((prev) => prev.map((p) => ({ ...p, is_primary: p.id === id })));
  }

  function movePending(id: string, dir: -1 | 1) {
    setPending((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }


  async function setPrimary(img: VehicleImage) {
    if (!vehicleId) return;
    logVehicleFlow("Atualizando imagem principal.", { vehicleId, imageId: img.id });
    const { error: resetError } = await supabase.from("vehicle_images").update({ is_primary: false }).eq("vehicle_id", vehicleId);
    if (resetError) {
      logVehicleFlowError("Remover imagem principal anterior", resetError, { vehicleId, imageId: img.id });
      toast.error("Falha ao definir imagem principal.");
      return;
    }
    const { data, error } = await supabase.from("vehicle_images").update({ is_primary: true }).eq("id", img.id).select("id").maybeSingle();
    logVehicleFlow("Resposta do banco recebida.", { vehicleId, response: data, error });
    if (error || !data) {
      logVehicleFlowError("Definir imagem principal", error ?? new Error("Nenhuma imagem foi atualizada."), { vehicleId, imageId: img.id });
      toast.error("Falha ao definir imagem principal.");
      return;
    }
    setImages((prev) => prev.map((i) => ({ ...i, is_primary: i.id === img.id })));
    toast.success("Imagem principal definida.");
    await synchronizeAfterImageChange(vehicleId, "imagem principal alterada");
  }

  async function deleteImage(img: VehicleImage) {
    if (!vehicleId) return;
    logVehicleFlow("Removendo imagem do veículo.", { vehicleId, imageId: img.id, storage_path: img.storage_path });
    try {
      if (img.storage_path) {
        const { error: storageError } = await supabase.storage.from("vehicle-images").remove([img.storage_path]);
        if (storageError) throw storageError;
      }
      const { data, error } = await supabase.from("vehicle_images").delete().eq("id", img.id).select("id").maybeSingle();
      logVehicleFlow("Resposta do banco recebida.", { vehicleId, response: data, error });
      if (error) throw error;
      if (!data) throw new Error("Nenhuma imagem foi removida. Verifique o ID.");
      setImages((prev) => prev.filter((i) => i.id !== img.id));
      await synchronizeAfterImageChange(vehicleId, "imagem removida");
    } catch (err) {
      logVehicleFlowError("Remover imagem", err, { vehicleId, imageId: img.id, storage_path: img.storage_path });
      toast.error("Falha ao remover imagem.");
    }
  }

  async function moveImage(img: VehicleImage, dir: -1 | 1) {
    if (!vehicleId) return;
    const sorted = [...images].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((i) => i.id === img.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    const a = { ...img, display_order: swap.display_order };
    const b = { ...swap, display_order: img.display_order };
    logVehicleFlow("Reordenando imagens.", { vehicleId, imageId: img.id, direction: dir });
    try {
      const [first, second] = await Promise.all([
        supabase.from("vehicle_images").update({ display_order: a.display_order }).eq("id", a.id).select("id").maybeSingle(),
        supabase.from("vehicle_images").update({ display_order: b.display_order }).eq("id", b.id).select("id").maybeSingle(),
      ]);
      logVehicleFlow("Resposta do banco recebida.", { vehicleId, response: [first.data, second.data], errors: [first.error, second.error] });
      if (first.error) throw first.error;
      if (second.error) throw second.error;
      if (!first.data || !second.data) throw new Error("Uma das imagens não foi atualizada durante a reordenação.");
      setImages((prev) =>
        prev.map((i) => (i.id === a.id ? a : i.id === b.id ? b : i)).sort((x, y) => x.display_order - y.display_order),
      );
      await synchronizeAfterImageChange(vehicleId, "imagens reordenadas");
    } catch (err) {
      logVehicleFlowError("Reordenar imagens", err, { vehicleId, imageId: img.id, direction: dir });
      toast.error("Falha ao reordenar imagem.");
    }
  }

  const discount = useMemo(() => {
    const p = Number(form.price) || 0;
    const pp = Number(form.previous_price) || 0;
    if (!pp || pp <= p) return null;
    return { saved: pp - p, pct: Math.round(((pp - p) / pp) * 100) };
  }, [form.price, form.previous_price]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-3 border-b">
          <DialogTitle>{editing ? "Editar veículo" : "Novo veículo"}</DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo. Campos com <span className="text-[#E30613]">*</span> são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6 pt-4 overflow-x-auto">
            <TabsList className="bg-zinc-100">
              <TabsTrigger value="basicos">Básicas</TabsTrigger>
              <TabsTrigger value="valores">Valores</TabsTrigger>
              <TabsTrigger value="caracteristicas">Características</TabsTrigger>
              <TabsTrigger value="descricao">Descrição</TabsTrigger>
              <TabsTrigger value="imagens">Imagens</TabsTrigger>
              <TabsTrigger value="publicacao">Publicação</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <TabsContent value="basicos" className="mt-0 space-y-4">
              <div className="space-y-3">
                <Label className="text-sm text-zinc-700 block">Tipo de veículo</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(["carro", "moto"] as VehicleType[]).map((t) => {
                    const isActive = vehicleType === t;
                    const Icon = t === "carro" ? Car : Bike;
                    
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setVehicleType(t);
                          // limpa categoria se não pertencer ao novo tipo
                          const list = t === "moto" ? MOTO_CATEGORY_OPTIONS : CAR_CATEGORY_OPTIONS;
                          if (form.category && !list.includes(form.category)) set("category", "");
                          if (t === "moto") set("doors", null);
                        }}
                        className={cn(
                          "relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200 group overflow-hidden",
                          "w-full sm:w-[220px] h-[140px]",
                          isActive
                            ? "bg-brand-red/[0.03] border-brand-red text-brand-red"
                            : "bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]"
                        )}
                      >
                        <Icon className={cn(
                          "w-10 h-10 transition-transform duration-200",
                          isActive ? "scale-110" : "group-hover:scale-110"
                        )} />
                        <span className={cn(
                          "font-semibold text-base capitalize tracking-wide",
                          isActive ? "text-brand-red" : "text-zinc-600"
                        )}>
                          {t}
                        </span>
                        
                        {isActive && (
                          <motion.div 
                            layoutId="active-type-indicator"
                            className="absolute top-3 right-3"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                          >
                            <div className="bg-brand-red text-white p-1 rounded-full">
                              <Check className="w-3 h-3" strokeWidth={3} />
                            </div>
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-2">
                <Field label="Filial" required error={errors.filial}>
                  <Select value={form.filial ?? ""} onValueChange={(v) => set("filial", v)}>
                    <SelectTrigger className={cn(errors.filial && "border-red-400")}>
                      <SelectValue placeholder="Selecione a filial" />
                    </SelectTrigger>
                    <SelectContent>
                      {FILIAL_OPTIONS.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Marca" required error={errors.brand}>
                  <Input value={form.brand ?? ""} onChange={(e) => set("brand", e.target.value)} className={cn(errors.brand && "border-red-400")} />
                </Field>
                <Field label="Modelo" required error={errors.model}>
                  <Input value={form.model ?? ""} onChange={(e) => set("model", e.target.value)} className={cn(errors.model && "border-red-400")} />
                </Field>
                <Field label="Versão"><Input value={form.version ?? ""} onChange={(e) => set("version", e.target.value)} /></Field>
                <Field label="Categoria" required error={errors.category}>
                  <Select value={form.category ?? ""} onValueChange={(v) => set("category", v)}>
                    <SelectTrigger className={cn(errors.category && "border-red-400")}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {(vehicleType === "moto" ? MOTO_CATEGORY_OPTIONS : CAR_CATEGORY_OPTIONS).map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Ano de fabricação" required error={errors.year}>
                  <Input type="number" value={form.year ?? ""} onChange={(e) => set("year", Number(e.target.value))} className={cn(errors.year && "border-red-400")} />
                </Field>
                <Field label="Ano do modelo"><Input type="number" value={form.model_year ?? ""} onChange={(e) => set("model_year", e.target.value ? Number(e.target.value) : null)} /></Field>
                <Field label="Quilometragem" required error={errors.km}>
                  <Input type="number" value={form.km ?? ""} onChange={(e) => set("km", e.target.value ? Number(e.target.value) : (undefined as any))} className={cn(errors.km && "border-red-400")} />
                </Field>
                <Field label="Cor"><Input value={form.color ?? ""} onChange={(e) => set("color", e.target.value)} /></Field>
                <Field label="Combustível">
                  <Select value={form.fuel ?? ""} onValueChange={(v) => set("fuel", v as FuelType)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{FUEL_OPTIONS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Câmbio">
                  <Select value={form.transmission ?? ""} onValueChange={(v) => set("transmission", v as TransmissionType)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{TRANSMISSION_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label={vehicleType === "moto" ? "Motor / Cilindrada" : "Motor"}>
                  <Input value={form.engine ?? ""} placeholder={vehicleType === "moto" ? "Ex.: 300cc" : "Ex.: 1.0 Turbo"} onChange={(e) => set("engine", e.target.value)} />
                </Field>
                <Field label="Potência"><Input value={form.power ?? ""} placeholder="Ex.: 116 cv" onChange={(e) => set("power", e.target.value)} /></Field>
                {vehicleType === "carro" && (
                  <Field label="Portas"><Input type="number" value={form.doors ?? ""} onChange={(e) => set("doors", e.target.value ? Number(e.target.value) : null)} /></Field>
                )}
                <Field label="Final da placa"><Input maxLength={1} value={form.plate_end ?? ""} onChange={(e) => set("plate_end", e.target.value)} /></Field>
              </div>
            </TabsContent>


            <TabsContent value="valores" className="mt-0 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Preço atual" required error={errors.price}>
                  <Input type="number" step="0.01" value={form.price ?? ""} onChange={(e) => set("price", Number(e.target.value))} className={cn(errors.price && "border-red-400")} />
                </Field>
                <Field label="Preço anterior (opcional)">
                  <Input type="number" step="0.01" value={form.previous_price ?? ""} onChange={(e) => set("previous_price", e.target.value ? Number(e.target.value) : null)} />
                </Field>
              </div>
              {discount && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Prévia da promoção</div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-zinc-400 line-through">{BRL.format(Number(form.previous_price))}</span>
                    <span className="text-2xl font-bold">{BRL.format(Number(form.price))}</span>
                    <Badge className="bg-[#E30613] hover:bg-[#E30613]">-{discount.pct}%</Badge>
                    <span className="text-sm text-emerald-600 font-medium">Economia de {BRL.format(discount.saved)}</span>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="caracteristicas" className="mt-0">
              <div className="grid md:grid-cols-2 gap-3">
                {(
                  [
                    ["first_owner", "Primeiro dono"],
                    ["single_owner", "Único dono"],
                    ["revised", "Veículo revisado"],
                    ["accepts_trade", "Aceita troca"],
                    ["financeable", "Financiável"],
                    ["owner_manual", "Manual do proprietário"],
                    ["spare_key", "Chave reserva"],
                    ["warranty", "Garantia"],
                  ] as [keyof Vehicle, string][]
                ).map(([key, label]) => (
                  <label key={key as string} className="flex items-center justify-between border border-zinc-200 rounded-xl px-4 py-3">
                    <span className="text-sm">{label}</span>
                    <Switch checked={!!form[key]} onCheckedChange={(v) => set(key, v as any)} />
                  </label>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="descricao" className="mt-0 space-y-4">
              <Field label="Descrição completa">
                <Textarea rows={5} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
              </Field>
              <Field label="Itens de série">
                <Textarea rows={4} value={form.standard_items ?? ""} onChange={(e) => set("standard_items", e.target.value)} placeholder="Um item por linha" />
              </Field>
              <Field label="Opcionais">
                <Textarea rows={4} value={form.optional_items ?? ""} onChange={(e) => set("optional_items", e.target.value)} placeholder="Um item por linha" />
              </Field>
              <Field label="Observações">
                <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
              </Field>
            </TabsContent>

            <TabsContent value="imagens" className="mt-0 space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files) void handleFiles(e.dataTransfer.files);
                }}
                className={cn(
                  "rounded-2xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
                  dragOver ? "border-brand-red bg-brand-red/10" : "border-zinc-200 hover:border-zinc-300",
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 mx-auto text-zinc-400" />
                <div className="mt-2 text-sm">Arraste imagens aqui ou clique para selecionar</div>
                <div className="text-xs text-zinc-500 mt-1">
                  Até 20 imagens · JPG/PNG/WebP
                  {!vehicleId && " · serão enviadas ao salvar o cadastro"}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
                {uploading && <div className="mt-3 text-xs flex items-center justify-center gap-2 text-zinc-500"><Loader2 className="h-3 w-3 animate-spin" /> Enviando…</div>}
              </div>

              {!vehicleId && pending.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <AnimatePresence>
                    {pending.map((p, idx, arr) => (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative group rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100"
                      >
                        <img src={p.preview} className="w-full aspect-square object-cover" />
                        {p.is_primary && (
                          <div className="absolute top-2 left-2 bg-brand-red text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <Star className="h-3 w-3" /> Principal
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">Pendente</div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                          {!p.is_primary && (
                            <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={() => setPendingPrimary(p.id)}>
                              <Check className="h-3 w-3 mr-1" /> Definir principal
                            </Button>
                          )}
                          <div className="flex gap-1">
                            <Button size="icon" variant="secondary" className="h-8 w-8" disabled={idx === 0} onClick={() => movePending(p.id, -1)}>
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="secondary" className="h-8 w-8" disabled={idx === arr.length - 1} onClick={() => movePending(p.id, 1)}>
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => removePending(p.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {vehicleId && images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <AnimatePresence>
                    {[...images].sort((a, b) => a.display_order - b.display_order).map((img, idx, arr) => (
                      <motion.div
                        key={img.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative group rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100"
                      >
                        <img src={img.url} loading="lazy" className="w-full aspect-square object-cover" />
                        {img.is_primary && (
                          <div className="absolute top-2 left-2 bg-brand-red text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <Star className="h-3 w-3" /> Principal
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                          {!img.is_primary && (
                            <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={() => setPrimary(img)}>
                              <Check className="h-3 w-3 mr-1" /> Definir principal
                            </Button>
                          )}
                          <div className="flex gap-1">
                            <Button size="icon" variant="secondary" className="h-8 w-8" disabled={idx === 0} onClick={() => moveImage(img, -1)}>
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="secondary" className="h-8 w-8" disabled={idx === arr.length - 1} onClick={() => moveImage(img, 1)}>
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => deleteImage(img)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>


            <TabsContent value="publicacao" className="mt-0 space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <label className="flex items-center justify-between border border-zinc-200 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">Veículo ativo no site</div>
                    <div className="text-xs text-zinc-500">Aparece na listagem pública</div>
                  </div>
                  <Switch checked={form.status === "ativo"} onCheckedChange={(v) => set("status", v ? "ativo" : "inativo")} />
                </label>
                <label className="flex items-center justify-between border border-zinc-200 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">Em destaque</div>
                    <div className="text-xs text-zinc-500">Aparece na seção de destaques</div>
                  </div>
                  <Switch checked={!!form.featured} onCheckedChange={(v) => set("featured", v)} />
                </label>
                <label className="flex items-center justify-between border border-zinc-200 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">Em promoção</div>
                    <div className="text-xs text-zinc-500">Mostra desconto no site</div>
                  </div>
                  <Switch checked={!!form.on_sale} onCheckedChange={(v) => set("on_sale", v)} />
                </label>
                <label className="flex items-center justify-between border border-zinc-200 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">Vendido</div>
                    <div className="text-xs text-zinc-500">Marca o veículo como vendido</div>
                  </div>
                  <Switch checked={form.status === "vendido"} onCheckedChange={(v) => set("status", v ? "vendido" : "ativo")} />
                </label>
                <label className="flex items-center justify-between border border-zinc-200 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">Reservado</div>
                    <div className="text-xs text-zinc-500">Marca o veículo como reservado</div>
                  </div>
                  <Switch checked={form.status === "reservado"} onCheckedChange={(v) => set("status", v ? "reservado" : "ativo")} />
                </label>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="p-4 border-t bg-zinc-50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving} className="bg-brand-red hover:bg-brand-red/90 text-white font-semibold">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {editing ? "Salvar alterações" : "Cadastrar veículo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  required,
  error,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-zinc-600">
        {label} {required && <span className="text-[#E30613]">*</span>}
      </Label>
      {children}
      {error && <div className="text-[11px] text-[#E30613]">{error}</div>}
    </div>
  );
}
