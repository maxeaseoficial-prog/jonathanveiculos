import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Gauge,
  Fuel,
  Cog,
  Palette,
  DoorOpen,
  Zap,
  ShieldCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  X,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContact } from "@/hooks/useCompanyContact";
import { cn } from "@/lib/utils";

type Props = {
  vehicleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const priceFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const kmFmt = new Intl.NumberFormat("pt-BR");
const DETAIL_LOG_PREFIX = "[Vehicle Detail]";
const VEHICLE_SYNC_EVENT = "excelencia:vehicles-updated";

function logVehicleDetail(step: string, details?: unknown) {
  if (details === undefined) {
    console.info(`${DETAIL_LOG_PREFIX} ${step}`);
    return;
  }

  console.info(`${DETAIL_LOG_PREFIX} ${step}`, details);
}

async function fetchVehicleDetail(id: string) {
  logVehicleDetail("Buscando ficha pública no banco.", { vehicleId: id });
  const { data, error } = await supabase
    .from("vehicles")
    .select("*, vehicle_images(id, url, is_primary, display_order)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  logVehicleDetail("Ficha pública recebida.", { vehicleId: id, found: !!data, updated_at: data?.updated_at });
  return data;
}

function splitList(text?: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n|;|·|•/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function VehicleDetailDialog({ vehicleId, open, onOpenChange }: Props) {
  const { 
    whatsappUrl: WHATSAPP_URL,
    whatsappPortoUniaoUrl,
    whatsappBiturunaUrl
  } = useCompanyContact();
  const queryClient = useQueryClient();
  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle-detail", vehicleId],
    queryFn: () => fetchVehicleDetail(vehicleId!),
    enabled: !!vehicleId && open,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchInterval: open ? 5000 : false,
    gcTime: 0,
  });

  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    setActiveImg(0);
  }, [vehicleId]);

  useEffect(() => {
    if (!vehicleId || !open) return;

    const refreshDetail = (source: string, details?: unknown) => {
      logVehicleDetail("Atualização recebida; recarregando ficha pública.", { vehicleId, source, details });
      void queryClient.invalidateQueries({ queryKey: ["vehicle-detail", vehicleId] });
      void queryClient.refetchQueries({ queryKey: ["vehicle-detail", vehicleId], type: "active" });
      void queryClient.invalidateQueries({ queryKey: ["public-stock-vehicles"] });
    };

    const channel = supabase
      .channel(`vehicle-detail-live-sync-${vehicleId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles", filter: `id=eq.${vehicleId}` }, (payload) => {
        refreshDetail("tempo real: vehicles", payload);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicle_images", filter: `vehicle_id=eq.${vehicleId}` }, (payload) => {
        refreshDetail("tempo real: vehicle_images", payload);
      })
      .subscribe((status) => {
        logVehicleDetail("Canal em tempo real da ficha pública.", { vehicleId, status });
      });

    const onLocalSync = (event: Event) => {
      const detail = (event as CustomEvent<{ vehicleId?: string | null }>).detail;
      if (!detail?.vehicleId || detail.vehicleId === vehicleId) refreshDetail("evento local", detail);
    };

    const onStorageSync = (event: StorageEvent) => {
      if (event.key !== VEHICLE_SYNC_EVENT || !event.newValue) return;
      try {
        const detail = JSON.parse(event.newValue) as { vehicleId?: string | null };
        if (!detail.vehicleId || detail.vehicleId === vehicleId) refreshDetail("evento entre abas", detail);
      } catch {
        refreshDetail("evento entre abas", event.newValue);
      }
    };

    window.addEventListener(VEHICLE_SYNC_EVENT, onLocalSync);
    window.addEventListener("storage", onStorageSync);

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener(VEHICLE_SYNC_EVENT, onLocalSync);
      window.removeEventListener("storage", onStorageSync);
    };
  }, [open, queryClient, vehicleId]);

  const images = ((vehicle?.vehicle_images as any[]) ?? [])
    .slice()
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return (a.display_order ?? 0) - (b.display_order ?? 0);
    });

  const current = images[activeImg];

  const waMessage = vehicle
    ? `Olá! Tenho interesse no ${vehicle.brand} ${vehicle.model}${vehicle.year ? ` ${vehicle.year}` : ""}. Poderia me passar mais informações?`
    : "";
  const activeWaUrl = vehicle?.filial === "Bituruna" ? whatsappBiturunaUrl : (vehicle?.filial === "Porto União" ? whatsappPortoUniaoUrl : WHATSAPP_URL);
  const waLink = vehicle ? `${activeWaUrl}?text=${encodeURIComponent(waMessage)}` : activeWaUrl;

  const standardItems = splitList(vehicle?.standard_items);
  const optionalItems = splitList(vehicle?.optional_items);

  const specs: { icon: any; label: string; value: string | null | undefined }[] = vehicle
    ? [
        { icon: Calendar, label: "Ano", value: vehicle.model_year ? `${vehicle.year}/${vehicle.model_year}` : `${vehicle.year}` },
        { icon: Gauge, label: "Km", value: vehicle.km != null ? `${kmFmt.format(vehicle.km)} km` : null },
        { icon: Fuel, label: "Combustível", value: vehicle.fuel },
        { icon: Cog, label: "Câmbio", value: vehicle.transmission },
        { icon: Palette, label: "Cor", value: vehicle.color },
        { icon: DoorOpen, label: "Portas", value: vehicle.doors ? `${vehicle.doors}` : null },
        { icon: Zap, label: "Motor", value: vehicle.engine },
        { icon: ShieldCheck, label: "Final placa", value: vehicle.plate_end },
      ].filter((s) => s.value)
    : [];

  const badges: { label: string; on: boolean }[] = vehicle
    ? [
        { label: "Revisado", on: !!vehicle.revised },
        { label: "Único dono", on: !!vehicle.single_owner },
        { label: "1º dono", on: !!vehicle.first_owner },
        { label: "Aceita troca", on: !!vehicle.accepts_trade },
        { label: "Financiável", on: !!vehicle.financeable },
        { label: "Manual", on: !!vehicle.owner_manual },
        { label: "Chave reserva", on: !!vehicle.spare_key },
        { label: "Garantia", on: !!vehicle.warranty },
      ].filter((b) => b.on)
    : [];

  const handleCopyLink = async () => {
    if (!vehicle) return;
    const url = new URL("/", window.location.origin);
    url.searchParams.set("veiculo", vehicle.id);
    
    try {
      await navigator.clipboard.writeText(url.toString());
      toast.success("Link copiado! Agora é só enviar pelo WhatsApp.");
    } catch (err) {
      const input = document.createElement("input");
      input.value = url.toString();
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      toast.success("Link copiado!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl w-[calc(100vw-1rem)] p-0 overflow-hidden border-0 bg-white rounded-2xl shadow-2xl gap-0 [&>button]:hidden"
        style={{ maxHeight: "92vh" }}
      >
        <DialogTitle className="sr-only">
          {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Detalhes do veículo"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Ficha completa do veículo com fotos, especificações e contato via WhatsApp.
        </DialogDescription>

        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="overflow-y-auto" style={{ maxHeight: "92vh" }}>
          {isLoading ? (
            <div className="p-16 text-center text-zinc-500">Carregando…</div>
          ) : !vehicle ? (
            <div className="p-16 text-center">
              <p className="text-zinc-500 text-lg">Este veículo não está mais disponível.</p>
              <button
                onClick={() => onOpenChange(false)}
                className="mt-4 px-6 py-2 rounded-full bg-brand-red text-white font-bold"
              >
                Ver outros veículos
              </button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1.15fr_1fr]">
              {/* Gallery */}
              <div className="bg-white p-4 lg:p-6 flex flex-col gap-3">
                <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-zinc-100">
                  <AnimatePresence mode="wait">
                    {current ? (
                      <motion.img
                        key={current.id}
                        src={current.url}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
                        Sem imagem
                      </div>
                    )}
                  </AnimatePresence>

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImg((i) => (i - 1 + images.length) % images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur transition-colors"
                        aria-label="Foto anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setActiveImg((i) => (i + 1) % images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur transition-colors"
                        aria-label="Próxima foto"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/70 text-white text-xs font-medium">
                        {activeImg + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                    {images.map((img, i) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImg(i)}
                        className={cn(
                          "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                          i === activeImg ? "border-[#FFC400]" : "border-transparent opacity-60 hover:opacity-100",
                        )}
                      >
                        <img src={img.url} alt="" loading="lazy" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-6 lg:p-8 flex flex-col">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-zinc-500 font-semibold">
                  <span>{vehicle.brand}</span>
                  {vehicle.category && <><span>•</span><span>{vehicle.category}</span></>}
                </div>
                <h2 className="mt-2 text-2xl lg:text-3xl font-bold leading-tight text-[#0B0B0B]">
                  {vehicle.model}
                  {vehicle.version && <span className="text-zinc-500 font-medium"> {vehicle.version}</span>}
                </h2>

                <div className="mt-5 flex items-end gap-3 flex-wrap">
                  {vehicle.previous_price != null && vehicle.price != null && Number(vehicle.previous_price) > Number(vehicle.price) && (
                    <span className="text-sm line-through text-[#FFC400] font-semibold">
                      {priceFmt.format(Number(vehicle.previous_price))}
                    </span>
                  )}
                  <span className="text-3xl lg:text-4xl font-bold text-[#E30613] font-display">
                    {vehicle.price != null ? priceFmt.format(Number(vehicle.price)) : "Sob consulta"}
                  </span>
                  {vehicle.on_sale && (
                    <span className="px-2.5 py-1 rounded-full bg-[#FFC400] text-black text-[11px] font-bold uppercase">
                      Promoção
                    </span>
                  )}
                </div>

                {badges.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {badges.map((b) => (
                      <span
                        key={b.label}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[11px] font-medium"
                      >
                        <Check className="h-3 w-3 text-[#0B0B0B]" /> {b.label}
                      </span>
                    ))}
                  </div>
                )}

                {specs.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {specs.map((s) => (
                      <div
                        key={s.label}
                        className="flex items-start gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50/60 px-3 py-2.5"
                      >
                        <s.icon className="h-4 w-4 mt-0.5 text-[#0B0B0B]" />
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase tracking-widest text-zinc-500">{s.label}</div>
                          <div className="text-sm font-semibold text-[#0B0B0B] truncate">{s.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {vehicle.description && (
                  <div className="mt-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Descrição</h3>
                    <p className="mt-2 text-sm text-zinc-700 whitespace-pre-line leading-relaxed">
                      {vehicle.description}
                    </p>
                  </div>
                )}

                {standardItems.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Itens de série</h3>
                    <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {standardItems.map((it) => (
                        <li key={it} className="flex items-start gap-2 text-sm text-zinc-700">
                          <Check className="h-4 w-4 mt-0.5 text-[#FFC400]" /> {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {optionalItems.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Opcionais</h3>
                    <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {optionalItems.map((it) => (
                        <li key={it} className="flex items-start gap-2 text-sm text-zinc-700">
                          <Check className="h-4 w-4 mt-0.5 text-[#E30613]" /> {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {vehicle.notes && (
                  <div className="mt-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Observações</h3>
                    <p className="mt-2 text-sm text-zinc-600 whitespace-pre-line leading-relaxed">
                      {vehicle.notes}
                    </p>
                  </div>
                )}

                <div className="mt-8 sticky bottom-0 -mx-6 -mb-6 lg:-mx-8 lg:-mb-8 px-6 lg:px-8 py-4 bg-white/95 backdrop-blur border-t border-zinc-100 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleCopyLink}
                    className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-black font-bold text-base transition-colors border border-zinc-200"
                  >
                    <Link2 className="h-5 w-5" />
                    Copiar link
                  </button>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#25D366] hover:bg-[#20b858] text-white font-bold text-base shadow-lg shadow-[#25D366]/25 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Falar no WhatsApp sobre este veículo
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
