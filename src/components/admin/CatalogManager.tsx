import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Power,
  Loader2,
  FolderKanban,
  Car,
  Check,
  Upload,
  X,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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

const COVER_BUCKET = "catalog-covers";

interface Catalog {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  vehicle_count?: number;
  fallback_image?: string | null;
}

interface VehicleLite {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number | null;
  price: number | null;
  status: string;
  image_url: string | null;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function ensureUniqueSlug(base: string, ignoreId?: string): Promise<string> {
  let slug = base || `catalogo-${Date.now()}`;
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;
    const query = supabase.from("catalogs").select("id").eq("slug", candidate).limit(1);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0 || (ignoreId && data[0].id === ignoreId)) return candidate;
  }
  return `${slug}-${Date.now()}`;
}

function getCoverPathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/${COVER_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

interface FormState {
  name: string;
  description: string;
  active: boolean;
  display_order: number;
  cover_url: string | null;
  cover_file: File | null;
  cover_preview: string | null;
  selected: Set<string>;
}

function emptyForm(): FormState {
  return {
    name: "",
    description: "",
    active: true,
    display_order: 0,
    cover_url: null,
    cover_file: null,
    cover_preview: null,
    selected: new Set(),
  };
}

export function CatalogManager() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Catalog | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Catalog | null>(null);

  const loadCatalogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("catalogs")
        .select(
          "*, vehicle_catalogs(vehicle_id, vehicles(id, status, vehicle_images(url, is_primary, display_order)))",
        )
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows: Catalog[] = (data ?? []).map((c: any) => {
        const links = Array.isArray(c.vehicle_catalogs) ? c.vehicle_catalogs : [];
        let fallback: string | null = null;
        const activeVehicles = links
          .map((l: any) => l.vehicles)
          .filter((v: any) => v && v.status === "ativo");
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
          name: c.name,
          slug: c.slug,
          description: c.description,
          cover_url: c.cover_url,
          active: c.active,
          display_order: c.display_order,
          created_at: c.created_at,
          updated_at: c.updated_at,
          vehicle_count: links.length,
          fallback_image: fallback,
        };
      });
      setCatalogs(rows);
    } catch (err) {
      console.error("[CatalogManager] load error", err);
      toast.error("Não foi possível carregar os catálogos.");
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    void loadCatalogs();
    const channel = supabase
      .channel("catalogs-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "catalogs" }, () => {
        void loadCatalogs();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicle_catalogs" }, () => {
        void loadCatalogs();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadCatalogs]);

  const filtered = useMemo(() => {
    if (!search.trim()) return catalogs;
    const q = search.trim().toLowerCase();
    return catalogs.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
    );
  }, [catalogs, search]);

  async function openNew() {
    setEditing(null);
    setForm({ ...emptyForm(), display_order: catalogs.length });
    setFormOpen(true);
  }

  async function openEdit(c: Catalog) {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description ?? "",
      active: c.active,
      display_order: c.display_order,
      cover_url: c.cover_url,
      cover_file: null,
      cover_preview: null,
      selected: new Set(),
    });
    setFormOpen(true);
    // Load current vehicle selection
    try {
      const { data, error } = await supabase
        .from("vehicle_catalogs")
        .select("vehicle_id")
        .eq("catalog_id", c.id);
      if (error) throw error;
      setForm((f) => ({ ...f, selected: new Set((data ?? []).map((r: any) => r.vehicle_id)) }));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Informe o nome do catálogo.");
      return;
    }
    setSaving(true);
    try {
      // Cover upload if a new file was selected
      let coverUrl: string | null = form.cover_url;
      if (form.cover_file) {
        const ext = form.cover_file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(COVER_BUCKET)
          .upload(path, form.cover_file, {
            cacheControl: "3600",
            contentType: form.cover_file.type || undefined,
            upsert: false,
          });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path);
        coverUrl = pub.publicUrl;

        // Remove previous cover if replacing
        if (editing && editing.cover_url) {
          const prev = getCoverPathFromUrl(editing.cover_url);
          if (prev) await supabase.storage.from(COVER_BUCKET).remove([prev]);
        }
      } else if (editing && editing.cover_url && !form.cover_url) {
        // User removed the cover
        const prev = getCoverPathFromUrl(editing.cover_url);
        if (prev) await supabase.storage.from(COVER_BUCKET).remove([prev]);
        coverUrl = null;
      }

      const baseSlug = slugify(form.name);
      const slug = editing
        ? editing.slug === baseSlug
          ? editing.slug
          : await ensureUniqueSlug(baseSlug, editing.id)
        : await ensureUniqueSlug(baseSlug);

      const payload = {
        name: form.name.trim(),
        slug,
        description: form.description?.trim() || null,
        cover_url: coverUrl,
        active: form.active,
        display_order: Number.isFinite(form.display_order) ? form.display_order : 0,
      };

      let catalogId: string;
      if (editing) {
        const { error } = await supabase
          .from("catalogs")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editing.id);
        if (error) throw error;
        catalogId = editing.id;
      } else {
        const { data, error } = await supabase.from("catalogs").insert(payload).select("id").single();
        if (error) throw error;
        catalogId = data.id;
      }

      // Sync vehicle_catalogs
      const { data: currentAssign, error: caErr } = await supabase
        .from("vehicle_catalogs")
        .select("vehicle_id")
        .eq("catalog_id", catalogId);
      if (caErr) throw caErr;
      const currentSet = new Set((currentAssign ?? []).map((r: any) => r.vehicle_id));
      const toAdd = [...form.selected].filter((id) => !currentSet.has(id));
      const toRemove = [...currentSet].filter((id) => !form.selected.has(id));
      if (toAdd.length > 0) {
        const { error } = await supabase
          .from("vehicle_catalogs")
          .insert(toAdd.map((vehicle_id) => ({ vehicle_id, catalog_id: catalogId })));
        if (error) throw error;
      }
      if (toRemove.length > 0) {
        const { error } = await supabase
          .from("vehicle_catalogs")
          .delete()
          .eq("catalog_id", catalogId)
          .in("vehicle_id", toRemove);
        if (error) throw error;
      }

      toast.success(editing ? "Catálogo atualizado." : "Catálogo criado.");
      setFormOpen(false);
      await loadCatalogs();
    } catch (err: any) {
      console.error("[CatalogManager] save error", err);
      toast.error(err?.message ?? "Erro ao salvar catálogo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(c: Catalog) {
    try {
      const { error } = await supabase
        .from("catalogs")
        .update({ active: !c.active, updated_at: new Date().toISOString() })
        .eq("id", c.id);
      if (error) throw error;
      toast.success(c.active ? "Catálogo desativado." : "Catálogo ativado.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar status.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.cover_url) {
        const path = getCoverPathFromUrl(deleteTarget.cover_url);
        if (path) await supabase.storage.from(COVER_BUCKET).remove([path]);
      }
      const { error } = await supabase.from("catalogs").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      toast.success("Catálogo excluído.");
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir catálogo.");
    }
  }

  return (
    <div className="bg-white text-zinc-900 rounded-3xl border border-zinc-200/70 shadow-sm p-5 md:p-8 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="pl-9 bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-300"
          />
        </div>
        <Button
          className="bg-brand-red text-white hover:bg-brand-red/90 font-semibold"
        >
          <Plus className="h-4 w-4 mr-2" /> Novo catálogo
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#FFC400]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center">
          <FolderKanban className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
          <h3 className="font-[Sora] text-lg font-semibold">Nenhum catálogo ainda</h3>
          <p className="text-sm text-zinc-500 mt-1 mb-4">
            Crie catálogos para agrupar veículos por coleção, promoção ou segmento.
          </p>
          <Button onClick={openNew} className="bg-brand-red text-white hover:bg-brand-red/90 font-semibold">
            <Plus className="h-4 w-4 mr-2" /> Criar primeiro catálogo
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {filtered.map((c) => (
              <motion.article
                key={c.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white backdrop-blur-md hover:border-zinc-200 transition-colors"
              >
                <div className="relative aspect-[16/9] bg-gradient-to-br from-white/[0.04] to-transparent">
                  {c.cover_url || c.fallback_image ? (
                    <img
                      src={c.cover_url ?? c.fallback_image ?? ""}
                      alt={c.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <FolderKanban className="h-10 w-10 text-zinc-300" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge
                      variant="outline"
                      className={
                        c.active
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : "border-zinc-200 bg-white/80 text-zinc-500"
                      }
                    >
                      {c.active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline" className="border-zinc-200 bg-white/80 text-zinc-700">
                      <Car className="h-3 w-3 mr-1" /> {c.vehicle_count ?? 0}
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-[Sora] font-semibold text-base truncate">{c.name}</h3>
                  {c.description && (
                    <p className="text-sm text-zinc-500 mt-1.5 line-clamp-2">{c.description}</p>
                  )}

                  <div className="mt-4 flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(c)}
                      className="flex-1 border-zinc-200 bg-zinc-50 text-zinc-900 hover:bg-zinc-100 hover:text-brand-red"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleToggleActive(c)}
                      className="border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                      aria-label={c.active ? "Desativar" : "Ativar"}
                    >
                      <Power
                        className={`h-3.5 w-3.5 ${c.active ? "text-emerald-500" : "text-zinc-400"}`}
                      />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setDeleteTarget(c)}
                      className="border-zinc-200 bg-zinc-50 text-zinc-900 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      <CatalogFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        saving={saving}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-white border-zinc-200 text-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir catálogo?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500">
              O catálogo <strong className="text-zinc-900">{deleteTarget?.name}</strong> será removido
              permanentemente. Os veículos vinculados não serão excluídos, apenas desassociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-200 bg-transparent text-zinc-900 hover:bg-zinc-50">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-zinc-900 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CatalogFormDialog({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Catalog | null;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSave: () => void;
  saving: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [vehicles, setVehicles] = useState<VehicleLite[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vSearch, setVSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingVehicles(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select(
            "id, name, brand, model, year, price, status, vehicle_images(url, is_primary, display_order)",
          )
          .order("created_at", { ascending: false });
        if (error) throw error;
        const mapped: VehicleLite[] = (data ?? []).map((v: any) => {
          const imgs = (v.vehicle_images ?? []).slice().sort((a: any, b: any) => {
            if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
            return (a.display_order ?? 0) - (b.display_order ?? 0);
          });
          return {
            id: v.id,
            name: v.name,
            brand: v.brand,
            model: v.model,
            year: v.year,
            price: v.price,
            status: v.status,
            image_url: imgs[0]?.url ?? null,
          };
        });
        if (active) setVehicles(mapped);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar veículos.");
      } finally {
        if (active) setLoadingVehicles(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open]);

  const filteredVehicles = useMemo(() => {
    if (!vSearch.trim()) return vehicles;
    const q = vSearch.trim().toLowerCase();
    return vehicles.filter(
      (v) =>
        v.name?.toLowerCase().includes(q) ||
        v.brand?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q),
    );
  }, [vehicles, vSearch]);

  function handleFilePick(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Envie um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }
    const preview = URL.createObjectURL(file);
    setForm((f) => ({ ...f, cover_file: file, cover_preview: preview }));
  }

  function removeCover() {
    if (form.cover_preview) URL.revokeObjectURL(form.cover_preview);
    setForm((f) => ({ ...f, cover_file: null, cover_preview: null, cover_url: null }));
    if (fileRef.current) fileRef.current.value = "";
  }

  function toggleVehicle(id: string) {
    setForm((f) => {
      const next = new Set(f.selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...f, selected: next };
    });
  }

  const displayedCover = form.cover_preview ?? form.cover_url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-white border-zinc-200 text-zinc-900 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-[Sora]">
            {editing ? "Editar catálogo" : "Novo catálogo"}
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            Agrupe veículos em coleções (ex: SUVs Premium, Ofertas da semana, Motos esportivas).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Cover upload */}
          <div className="grid gap-2">
            <Label>Foto de capa (opcional)</Label>
            {displayedCover ? (
              <div className="relative group aspect-[16/9] overflow-hidden rounded-xl border border-zinc-200">
                <img src={displayedCover} alt="Capa" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    className="border-white/20 bg-zinc-100 text-zinc-900 hover:bg-white/20"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" /> Trocar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={removeCover}
                    className="border-white/20 bg-zinc-100 text-zinc-900 hover:bg-red-500/20 hover:border-red-500/40"
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" /> Remover
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="aspect-[16/9] flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 hover:bg-zinc-50 hover:border-[#FFC400]/40 transition-colors text-zinc-500"
              >
                <ImageIcon className="h-8 w-8" />
                <span className="text-sm">Clique para enviar uma imagem</span>
                <span className="text-xs text-zinc-300">PNG, JPG ou WEBP · até 5MB</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Basic info */}
          <div className="grid gap-2">
            <Label>Nome *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: SUVs Premium"
              className="bg-white border-zinc-200"
            />
          </div>

          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Um pequeno resumo desta coleção..."
              rows={3}
              className="bg-white border-zinc-200 resize-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Ordem de exibição</Label>
              <Input
                type="number"
                value={Number.isFinite(form.display_order) ? form.display_order : 0}
                onChange={(e) =>
                  setForm((f) => ({ ...f, display_order: Number(e.target.value) || 0 }))
                }
                className="bg-white border-zinc-200"
              />
            </div>
            <div className="flex items-end gap-3 pb-1">
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
              />
              <Label className="mb-0">Catálogo ativo</Label>
            </div>
          </div>

          {/* Vehicle selection */}
          <div className="grid gap-2 pt-2">
            <div className="flex items-center justify-between">
              <Label>Veículos no catálogo</Label>
              <span className="text-xs text-zinc-500">
                {form.selected.size} selecionado{form.selected.size === 1 ? "" : "s"}
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                value={vSearch}
                onChange={(e) => setVSearch(e.target.value)}
                placeholder="Buscar veículo por nome, marca ou modelo..."
                className="pl-9 bg-white border-zinc-200"
              />
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 max-h-[280px] overflow-y-auto p-1.5 space-y-1">
              {loadingVehicles ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[#FFC400]" />
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div className="text-center py-8 text-sm text-zinc-400">
                  Nenhum veículo encontrado.
                </div>
              ) : (
                filteredVehicles.map((v) => {
                  const checked = form.selected.has(v.id);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleVehicle(v.id)}
                      className={`w-full flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
                        checked
                          ? "border-[#FFC400]/40 bg-[#FFC400]/[0.06]"
                          : "border-transparent hover:bg-zinc-50"
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          checked ? "border-[#FFC400] bg-[#FFC400]" : "border-white/20"
                        }`}
                      >
                        {checked && <Check className="h-3.5 w-3.5 text-black" />}
                      </div>
                      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-100 border border-zinc-200">
                        {v.image_url ? (
                          <img
                            src={v.image_url}
                            alt={v.name}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Car className="h-4 w-4 text-zinc-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{v.name}</div>
                        <div className="text-xs text-zinc-500 truncate">
                          {v.brand} {v.model} {v.year ? `• ${v.year}` : ""} •{" "}
                          {v.price
                            ? new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                                maximumFractionDigits: 0,
                              }).format(v.price)
                            : "Sem preço"}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-zinc-200 bg-zinc-50 text-zinc-500 text-[10px] uppercase"
                      >
                        {v.status}
                      </Badge>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-zinc-200 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-200 bg-transparent text-zinc-900 hover:bg-zinc-50"
          >
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={saving}
            className="bg-[#FFC400] text-black hover:bg-[#FFC400]/90 font-semibold"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando
              </>
            ) : editing ? (
              "Salvar alterações"
            ) : (
              "Criar catálogo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
