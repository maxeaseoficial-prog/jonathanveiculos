import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Car,
  FolderKanban,
  Settings,
  LogOut,
  Loader2,
  TrendingUp,
  Eye,
  Bike,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";


import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

import { StockManager } from "@/components/admin/StockManager";
import { CatalogManager } from "@/components/admin/CatalogManager";
import { SettingsManager } from "@/components/admin/SettingsManager";
import logoAsset from "@/assets/logo-new.png.asset.json";

const MOTO_CATEGORIES = new Set([
  "Street",
  "Naked",
  "Custom",
  "Esportiva",
  "Trail / Big Trail",
  "Scooter",
  "Cub",
  "Off-Road",
  "Touring",
]);

const DASHBOARD_LOG_PREFIX = "[Admin Dashboard]";

function logDashboard(message: string, details?: unknown) {
  if (details === undefined) {
    console.info(`${DASHBOARD_LOG_PREFIX} ${message}`);
    return;
  }
  console.info(`${DASHBOARD_LOG_PREFIX} ${message}`, details);
}

function logDashboardError(message: string, error: unknown) {
  console.error(`${DASHBOARD_LOG_PREFIX} ${message}`, error);
}

import { title } from "@/lib/site-meta";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: title("Dashboard") },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardPage,
});


type VehicleRow = {
  id: string;
  brand: string | null;
  category: string | null;
  status: string | null;
  featured: boolean | null;
  price: number | null;
  created_at: string | null;
};

type TabKey = "dashboard" | "estoque" | "catalogos" | "config";

function DashboardPage() {
  const navigate = useNavigate();
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      logDashboard("Dashboard iniciado (Modo Demo).");
      setAuthError(null);

      // Demo session check
      const demoSession = sessionStorage.getItem("demo_admin_session");
      if (demoSession !== "true") {
        navigate({ to: "/admin", replace: true });
        return;
      }

      if (!active) return;
      
      setUserEmail("admin@demo.com");
      setIsAdmin(true);
      setAuthLoading(false);

      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select("id, brand, category, status, featured, price, created_at");
        if (error) throw error;
        if (!active) return;
        setVehicles((data ?? []) as VehicleRow[]);
      } catch (err) {
        logDashboardError("Falha ao carregar veículos:", err);
      } finally {
        if (active) setDataLoading(false);
      }
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleLogout() {
    sessionStorage.removeItem("demo_admin_session");
    toast.success("Sessão encerrada");
    navigate({ to: "/admin", replace: true });
  }

  const stats = useMemo(() => {
    const total = vehicles.length;
    const activeCount = vehicles.filter((v) => v.status === "ativo").length;
    const featuredCount = vehicles.filter((v) => v.featured).length;
    const soldCount = vehicles.filter((v) => v.status === "vendido").length;

    let carros = 0;
    let motos = 0;
    for (const v of vehicles) {
      if (v.category && MOTO_CATEGORIES.has(v.category)) motos++;
      else carros++;
    }

    const brandMap = new Map<string, number>();
    for (const v of vehicles) {
      const b = (v.brand ?? "Sem marca").trim() || "Sem marca";
      brandMap.set(b, (brandMap.get(b) ?? 0) + 1);
    }
    const topBrands = Array.from(brandMap, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const categoryMap = new Map<string, { name: string; carros: number; motos: number }>();
    for (const v of vehicles) {
      const c = v.category ?? "Sem categoria";
      const isMoto = v.category ? MOTO_CATEGORIES.has(v.category) : false;
      const entry = categoryMap.get(c) ?? { name: c, carros: 0, motos: 0 };
      if (isMoto) entry.motos++;
      else entry.carros++;
      categoryMap.set(c, entry);
    }
    const byCategory = Array.from(categoryMap.values())
      .sort((a, b) => b.carros + b.motos - (a.carros + a.motos))
      .slice(0, 8);

    // últimos 6 meses
    const now = new Date();
    const months: { key: string; label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      months.push({ key, label, count: 0 });
    }
    for (const v of vehicles) {
      if (!v.created_at) continue;
      const d = new Date(v.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const m = months.find((x) => x.key === key);
      if (m) m.count++;
    }

    // faixas de preço
    const buckets = [
      { name: "Até 30k", min: 0, max: 30000, value: 0 },
      { name: "30–60k", min: 30000, max: 60000, value: 0 },
      { name: "60–100k", min: 60000, max: 100000, value: 0 },
      { name: "100–200k", min: 100000, max: 200000, value: 0 },
      { name: "200k+", min: 200000, max: Infinity, value: 0 },
    ];
    for (const v of vehicles) {
      const p = Number(v.price ?? 0);
      const b = buckets.find((x) => p >= x.min && p < x.max);
      if (b) b.value++;
    }

    const inativos = total - activeCount - soldCount;
    const statusData = [
      { name: "Ativos", value: activeCount, color: "#22c55e" },
      { name: "Vendidos", value: soldCount, color: "#3b82f6" },
      { name: "Inativos", value: Math.max(0, inativos), color: "#94a3b8" },
    ].filter((s) => s.value > 0);

    return {
      total,
      activeCount,
      featuredCount,
      soldCount,
      carros,
      motos,
      topBrands,
      byCategory,
      months,
      buckets,
      statusData,
    };
  }, [vehicles]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-brand-red" />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-zinc-900 p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Sessão inválida</h1>
          <p className="mt-2 text-zinc-500 text-sm">{authError}</p>
          <Button onClick={() => navigate({ to: "/admin", replace: true })} variant="outline" className="mt-6 border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50">
            Ir para login
          </Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-zinc-900 p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Acesso negado</h1>
          <p className="mt-2 text-zinc-500 text-sm">
            Sua conta ({userEmail}) não possui permissão de administrador.
          </p>
          <Button onClick={handleLogout} variant="outline" className="mt-6 border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </div>
    );
  }

  const navItems: Array<{ icon: typeof Car; label: string; key: TabKey }> = [
    { icon: LayoutDashboard, label: "Dashboard", key: "dashboard" },
    { icon: Car, label: "Estoque", key: "estoque" },
    { icon: FolderKanban, label: "Catálogos", key: "catalogos" },
    { icon: Settings, label: "Configurações", key: "config" },
  ];

  const cards: Array<{ label: string; value: number; icon: typeof Car; accent: string }> = [
    { label: "Veículos totais", value: stats.total, icon: Car, accent: "#E30613" },
    { label: "Anúncios ativos", value: stats.activeCount, icon: Eye, accent: "#22c55e" },
    { label: "Em destaque", value: stats.featuredCount, icon: TrendingUp, accent: "#E30613" },
    { label: "Motos cadastradas", value: stats.motos, icon: Bike, accent: "#E30613" },
  ];

  const tabTitles: Record<TabKey, { title: string; subtitle: string }> = {
    dashboard: { title: "Dashboard", subtitle: "Visão geral da operação" },
    estoque: { title: "Estoque", subtitle: "Gerencie os veículos publicados" },
    catalogos: { title: "Catálogos", subtitle: "Marcas, categorias e atributos" },
    config: { title: "Configurações", subtitle: "Dados da empresa e integrações" },
  };

  const BRAND_COLORS = ["#0B0B0B", "#E30613", "#22c55e", "#3b82f6", "#a855f7"];

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-zinc-200 bg-white p-4 sticky top-0 h-screen">
          <div className="px-3 py-4 mb-4">
            <img
              src={logoAsset.url}
              alt="Jonathan Veículos"
              className="h-16 w-auto object-contain brightness-0 invert"
            />
            <div className="mt-2 text-[10px] uppercase tracking-widest text-white/70 font-semibold">Painel Admin</div>
          </div>
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="border-t border-zinc-200 pt-4 mt-4">
            <div className="px-3 pb-3">
              <div className="text-xs text-zinc-400">Logado como</div>
              <div className="text-sm truncate text-zinc-700">{userEmail}</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 md:p-10">
          {/* Mobile tabs */}
          <div className="lg:hidden -mx-6 md:-mx-10 px-6 md:px-10 mb-6 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {navItems.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs whitespace-nowrap transition-colors ${
                      isActive ? "bg-zinc-900 text-white" : "text-zinc-600 bg-zinc-100"
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-[Sora] text-3xl font-bold tracking-tight text-zinc-900">{tabTitles[activeTab].title}</h1>
              <p className="text-sm text-zinc-500 mt-1">{tabTitles[activeTab].subtitle}</p>
            </div>
            <Link
              to="/"
              className="text-xs text-zinc-500 hover:text-brand-red transition-colors"
            >
              Ver site público →
            </Link>
          </div>

          {activeTab === "dashboard" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, i) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.05 }}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-zinc-500">{card.label}</span>
                      <card.icon className="h-4 w-4" style={{ color: card.accent }} />
                    </div>
                    <div className="mt-3 font-[Sora] text-3xl font-bold text-zinc-900">
                      {dataLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                      ) : (
                        card.value
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Gráficos */}
              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                {/* Carros vs Motos */}
                <ChartCard title="Carros vs Motos" subtitle="Distribuição do estoque">
                  {stats.total === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Carros", value: stats.carros, color: "#0B0B0B" },
                            { name: "Motos", value: stats.motos, color: "#E30613" },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={2}
                        >
                          <Cell fill="#0B0B0B" />
                          <Cell fill="#E30613" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                {/* Status */}
                <ChartCard title="Status dos anúncios" subtitle="Ativos, vendidos e inativos">
                  {stats.statusData.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={stats.statusData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={2}
                        >
                          {stats.statusData.map((s) => (
                            <Cell key={s.name} fill={s.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                {/* Faixa de preço */}
                <ChartCard title="Faixa de preço" subtitle="Distribuição por valor">
                  {stats.total === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={stats.buckets}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                        <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#FFC400" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {/* Cadastros por mês */}
                <ChartCard title="Cadastros nos últimos 6 meses" subtitle="Novos veículos publicados">
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={stats.months}>
                      <defs>
                        <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FFC400" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#FFC400" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                      <XAxis dataKey="label" stroke="#71717a" fontSize={11} />
                      <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#FFC400" strokeWidth={2} fill="url(#fillCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Top marcas */}
                <ChartCard title="Top marcas" subtitle="Marcas com mais unidades">
                  {stats.topBrands.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={stats.topBrands} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" horizontal={false} />
                        <XAxis type="number" stroke="#71717a" fontSize={11} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={11} width={90} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                          {stats.topBrands.map((_, i) => (
                            <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>

              {/* Categorias empilhadas */}
              <div className="mt-4">
                <ChartCard title="Categorias — carros x motos" subtitle="Composição do estoque por categoria">
                  {stats.byCategory.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.byCategory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                        <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="carros" stackId="a" fill="#0B0B0B" name="Carros" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="motos" stackId="a" fill="#E30613" name="Motos" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>
            </>
          )}

          {activeTab === "estoque" && <StockManager />}
          {activeTab === "catalogos" && <CatalogManager />}
          {activeTab === "config" && <SettingsManager />}
        </main>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4">
        <h3 className="font-semibold text-zinc-900">{title}</h3>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-zinc-400">
      Sem dados suficientes
    </div>
  );
}
