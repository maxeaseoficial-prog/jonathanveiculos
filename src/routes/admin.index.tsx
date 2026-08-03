import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, LogIn, UserPlus, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import adminBgAsset from "@/assets/admin-bg.webp.asset.json";
import { ensureAdminAccount } from "@/lib/admin-auth.functions";
import { resolveUsername } from "@/lib/resolve-username.functions";
import { title, SITE_NAME } from "@/lib/site-meta";

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Informe seu e-mail ou usuário"),
  password: z.string().min(1, "Informe sua senha"),
});

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome completo"),
  username: z.string().trim().min(3, "O usuário deve ter ao menos 3 caracteres").regex(/^[a-zA-Z0-0._-]+$/, "Usuário inválido (use letras, números, pontos ou traços)"),
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
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
  const ensureAdminAccountFn = useServerFn(ensureAdminAccount);
  const resolveUsernameFn = useServerFn(resolveUsername);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [successMode, setSuccessMode] = useState(false);

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate({ to: "/admin/dashboard", replace: true });
      } else {
        setChecking(false);
      }
    }
    checkSession();
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
    try {
      let loginEmail = result.data.identifier;

      // Se não for um e-mail, resolvemos o username
      if (!loginEmail.includes("@")) {
        const { email: resolvedEmail } = await resolveUsernameFn({
          data: { identifier: loginEmail }
        });
        if (!resolvedEmail) {
          throw new Error("Usuário ou e-mail não encontrado.");
        }
        loginEmail = resolvedEmail;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: result.data.password,
      });

      if (error) throw error;

      // Garante que o perfil existe e tem role admin (para usuários legados ou novos)
      await ensureAdminAccountFn({ data: {} });

      toast.success("Acesso autorizado!");
      navigate({ to: "/admin/dashboard", replace: true });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message === "Invalid login credentials" ? "Dados de acesso incorretos." : err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const result = signupSchema.safeParse({ fullName, username, email, password });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          data: {
            full_name: result.data.fullName,
            username: result.data.username,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário.");

      // 2. Criar perfil e role via Server Function (para garantir transação simulada e bypass RLS)
      await ensureAdminAccountFn({
        data: {
          fullName: result.data.fullName,
          username: result.data.username,
        }
      });

      setSuccessMode(true);
      setIdentifier(result.data.email); // Pre-fill login
      
      setTimeout(() => {
        setSuccessMode(false);
        setMode("login");
      }, 1500);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
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
                <h2 className="text-2xl font-bold">Conta criada com sucesso!</h2>
                <p className="text-white/50 mt-2">Redirecionando para o login...</p>
              </motion.div>
            ) : mode === "login" ? (
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
                      placeholder="admin ou email@exemplo.com"
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
                    {loading ? <Loader2 className="animate-spin" /> : <><LogIn className="mr-2" size={20} /> Entrar no painel</>}
                  </Button>
                </form>
                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                  <button
                    onClick={() => setMode("signup")}
                    className="text-white/50 hover:text-white flex items-center justify-center mx-auto transition-colors"
                  >
                    Não tem uma conta? <span className="text-brand-red ml-1 font-medium">Criar conta</span>
                    <ArrowRight size={16} className="ml-1" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold mb-6">Criar conta</h2>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      placeholder="Seu nome"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-white/5 border-white/10 focus:border-brand-red h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user">Nome de usuário</Label>
                    <Input
                      id="user"
                      placeholder="ex: joao.veiculos"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-white/5 border-white/10 focus:border-brand-red h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/5 border-white/10 focus:border-brand-red h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-pass">Senha</Label>
                    <Input
                      id="new-pass"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white/5 border-white/10 focus:border-brand-red h-11"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-red hover:bg-brand-red/90 h-11 font-semibold mt-2"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <><UserPlus className="mr-2" size={18} /> Criar conta</>}
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setMode("login")}
                    className="text-white/50 hover:text-white transition-colors"
                  >
                    Já tem uma conta? <span className="text-white font-medium">Fazer login</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
