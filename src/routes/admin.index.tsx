import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, LogIn, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import adminBgAsset from "@/assets/admin-bg.webp.asset.json";
import { title, SITE_NAME } from "@/lib/site-meta";

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Informe seu e-mail ou usuário"),
  password: z.string().min(1, "Informe sua senha"),
});

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: title("Acesso ao Painel") },
      { name: "description", content: `Área restrita ${SITE_NAME}.` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminAuthPage,
});

function AdminAuthPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [successMode, setSuccessMode] = useState(false);

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Demo session check
    const demoSession = sessionStorage.getItem("demo_admin_session");
    if (demoSession === "true") {
      navigate({ to: "/admin/dashboard", replace: true });
    } else {
      setChecking(false);
    }
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const result = loginSchema.safeParse({ identifier, password });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    
    // Demo credentials check
    const isValidUser = result.data.identifier === "admin" || result.data.identifier === "admin@demo.com";
    const isValidPass = result.data.password === "admin";

    setTimeout(() => {
      if (isValidUser && isValidPass) {
        sessionStorage.setItem("demo_admin_session", "true");
        setSuccessMode(true);
        toast.success("Acesso autorizado!");
        
        setTimeout(() => {
          navigate({ to: "/admin/dashboard", replace: true });
        }, 1000);
      } else {
        toast.error("Usuário ou senha inválidos.");
        setLoading(false);
      }
    }, 800);
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-6 w-6 animate-spin text-brand-red" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black text-white overflow-hidden p-6">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={adminBgAsset.url}
          alt="Fachada"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-[Sora] tracking-tight text-white">
            Jonathan <span className="text-brand-red">Veículos</span>
          </h1>
          <p className="text-white/50 mt-2">Painel de Gestão Administrativa</p>
        </div>

        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            {successMode ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="py-12 text-center"
              >
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Acesso autorizado!</h2>
                <p className="text-white/50 mt-2">Entrando no painel...</p>
              </motion.div>
            ) : (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h2 className="text-2xl font-bold mb-6 text-white">Entrar no painel</h2>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="id">E-mail ou Usuário</Label>
                    <Input
                      id="id"
                      placeholder="admin ou admin@demo.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="bg-white/5 border-white/10 focus:border-brand-red h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pass">Senha</Label>
                    <div className="relative">
                      <Input
                        id="pass"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/5 border-white/10 focus:border-brand-red h-12 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-red hover:bg-brand-red/90 h-12 text-lg font-semibold"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <><LogIn className="mr-2" size={20} /> <span className="text-white">Entrar no painel</span></>}
                  </Button>
                </form>
                <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-white/30">
                  Acesso Restrito - Demonstração
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
