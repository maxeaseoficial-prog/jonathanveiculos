import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import adminBgAsset from "@/assets/admin-bg.webp.asset.json";
import { ensureAdminAccount } from "@/lib/admin-auth.functions";

const AUTH_LOG_PREFIX = "[Admin Auth]";

function logAuth(message: string, details?: unknown) {
  if (details === undefined) {
    console.info(`${AUTH_LOG_PREFIX} ${message}`);
    return;
  }

  console.info(`${AUTH_LOG_PREFIX} ${message}`, details);
}

function logAuthError(message: string, error: unknown) {
  console.error(`${AUTH_LOG_PREFIX} ${message}`, error);
}

function getAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos. Confira os dados e tente novamente.";
  }

  if (normalized.includes("email not confirmed") || normalized.includes("email_not_confirmed")) {
    return "Seu cadastro foi criado, mas o e-mail ainda precisa ser confirmado antes do login.";
  }

  if (normalized.includes("user already registered") || normalized.includes("already registered")) {
    return "Este e-mail já possui cadastro. Use Entrar no painel.";
  }

  if (normalized.includes("password") && normalized.includes("weak")) {
    return "Senha muito fraca. Use uma senha com letras, números e pelo menos 6 caracteres.";
  }

  if (
    normalized.includes("password") &&
    (normalized.includes("pwned") || normalized.includes("compromised") || normalized.includes("breached"))
  ) {
    return "Essa senha é muito comum ou já apareceu em vazamentos. Use uma senha mais forte e exclusiva.";
  }

  if (normalized.includes("signup") && normalized.includes("disabled")) {
    return "O cadastro estava desativado no backend. Já foi reativado, tente criar a conta novamente.";
  }

  if (normalized.includes("email") && normalized.includes("invalid")) {
    return "Informe um e-mail válido.";
  }

  if (normalized.includes("database") || normalized.includes("unexpected failure")) {
    return "Não foi possível concluir o cadastro agora. Tente novamente em instantes.";
  }

  return message || "Não foi possível autenticar. Tente novamente.";
}

const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe seu e-mail").email("E-mail inválido").max(255),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres").max(72),
});
const signupSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Informe seu nome completo").max(100),
});

import { title, SITE_NAME } from "@/lib/site-meta";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: title("Painel Administrativo") },
      { name: "description", content: `Acesso restrito da equipe ${SITE_NAME}.` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});


function AdminLoginPage() {
  const navigate = useNavigate();
  const ensureAdminAccountFn = useServerFn(ensureAdminAccount);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [formMessage, setFormMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      logAuth("Inicializando autenticação...");
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!active) return;

        if (data.session) {
          logAuth("Sessão existente encontrada. Redirecionando...");
          navigate({ to: "/admin/dashboard", replace: true });
          return;
        }

        logAuth("Nenhuma sessão ativa encontrada.");
        setChecking(false);
      } catch (err) {
        logAuthError("Erro encontrado ao inicializar autenticação:", err);
        if (!active) return;
        setFormMessage({
          type: "error",
          text: "Não foi possível verificar sua sessão agora. Tente entrar novamente.",
        });
        setChecking(false);
      }
    }

    void initializeAuth();

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    logAuth(mode === "login" ? "Iniciando login..." : "Iniciando criação de usuário...");
    setErrors({});
    setFormMessage(null);

    const parsed =
      mode === "login"
        ? loginSchema.safeParse({ email, password })
        : signupSchema.safeParse({ email, password, name });

    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof typeof errors;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setFormMessage({ type: "error", text: "Preencha os campos obrigatórios corretamente." });
      toast.error("Preencha os campos corretamente.");
      logAuth("Validação bloqueou o envio do formulário.", fieldErrors);
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        logAuth("Enviando credenciais de login...");
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        logAuth("Login realizado.");

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) throw new Error("Sessão não foi criada após o login.");
        logAuth("Sessão criada.", { userId: sessionData.session.user.id });

        logAuth("Garantindo perfil e permissão administrativa...");
        await ensureAdminAccountFn({ data: {} });
        logAuth("Conta administrativa verificada.");
        toast.success("Bem-vindo de volta!");
        setFormMessage({ type: "success", text: "Login realizado com sucesso. Redirecionando..." });
        logAuth("Redirecionando para o dashboard...");
        navigate({ to: "/admin/dashboard", replace: true });
      } else {
        logAuth("Criando usuário...");
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/admin`,
          },
        });
        if (error) throw error;
        logAuth("Cadastro solicitado com sucesso.");

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (sessionData.session) {
          logAuth("Sessão criada após cadastro.", { userId: sessionData.session.user.id });
          logAuth("Garantindo perfil e permissão administrativa...");
          await ensureAdminAccountFn({ data: { fullName: name.trim() } });
          logAuth("Conta administrativa verificada.");
          toast.success("Conta criada com sucesso!");
          setFormMessage({ type: "success", text: "Conta criada com sucesso. Redirecionando..." });
          logAuth("Redirecionando para o dashboard...");
          navigate({ to: "/admin/dashboard", replace: true });
          return;
        }

        toast.success("Conta criada com sucesso!");
        setFormMessage({
          type: "info",
          text: "Conta criada. Confirme o e-mail e depois faça login para acessar o painel.",
        });
        logAuth("Cadastro criado sem sessão imediata. Aguardando confirmação de e-mail.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao autenticar";
      const friendlyMessage = getAuthErrorMessage(msg);
      logAuthError("Erro encontrado:", err);
      setFormMessage({ type: "error", text: friendlyMessage });
      toast.error(friendlyMessage);
    } finally {
      logAuth("Finalizando operação de autenticação.");
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
    <div className="relative min-h-screen grid md:grid-cols-2 bg-black text-white overflow-hidden">
      {/* Full-bleed store photo background */}
      <div className="absolute inset-0 z-0">
        <img
          src={adminBgAsset.url}
          alt="Fachada da loja Jonathan Veículos"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/85" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(227,6,19,0.18),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(227,6,19,0.15),transparent_55%)]" />
      </div>

      {/* Left: brand panel — anchored to bottom-left */}
      <div className="relative z-10 hidden md:flex flex-col justify-center overflow-hidden p-12">
        <div className="relative">
          <h1 className="font-[Sora] text-5xl font-bold leading-tight tracking-tight text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.5)]">
            Painel <span className="text-brand-red">Jonathan</span>
            <br />Veículos
          </h1>
          <p className="mt-4 max-w-md text-white/70">
            Gerencie estoque, catálogos, leads e a operação inteira em um único lugar.
          </p>
          <div className="mt-6 flex items-center gap-3 text-xs text-white/50">
            <div className="h-px w-8 bg-white/30" />
            Uso interno da equipe autorizada
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="relative z-10 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/50 p-8 backdrop-blur-xl shadow-2xl"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              {mode === "login" ? "Entrar no painel" : "Criar acesso"}
            </h2>
            <p className="mt-1 text-sm text-white/50">
              {mode === "login"
                ? "Use seu e-mail e senha para acessar."
                : "O primeiro cadastro se torna administrador."}
            </p>
            <div className="mt-4 p-3 rounded-lg border border-white/10 bg-white/5 text-xs text-white/40">
              Consulte o arquivo <code className="text-brand-red">.lovable/admin-credentials.md</code> para ver ou definir suas credenciais padrão.
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {formMessage && (
              <div
                className={`rounded-xl border px-3 py-2 text-sm ${
                  formMessage.type === "error"
                    ? "border-[#E30613]/40 bg-[#E30613]/10 text-white"
                    : formMessage.type === "success"
                      ? "border-brand-red/40 bg-brand-red/10 text-white"
                      : "border-white/10 bg-white/5 text-white/70"
                }`}
              >
                {formMessage.text}
              </div>
            )}
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/80">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={!!errors.name}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-brand-red"
                />
                {errors.name && <p className="text-xs text-[#E30613]">{errors.name}</p>}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-brand-red"
              />
              {errors.email && <p className="text-xs text-[#E30613]">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-brand-red pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-xs text-[#E30613]">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red text-white hover:brightness-110 font-semibold h-11 shadow-red-glow"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar no painel
                </>
              )}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="mt-6 text-sm text-white/50 hover:text-white transition-colors"
          >
            {mode === "login" ? "Não tem acesso? Criar conta" : "Já tem conta? Entrar"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
