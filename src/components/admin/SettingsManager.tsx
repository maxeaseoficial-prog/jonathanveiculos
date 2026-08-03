import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Save, KeyRound, Building2, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CompanySettings {
  id?: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  cep: string;
  city: string;
  state: string;
  instagram: string;
  facebook: string;
  business_hours: string;
}

const EMPTY: CompanySettings = {
  name: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  cep: "",
  city: "",
  state: "",
  instagram: "",
  facebook: "",
  business_hours: "",
};

const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres")
  .max(72, "A senha deve ter no máximo 72 caracteres");

const emailSchema = z.string().trim().email("E-mail inválido").max(255);

export function SettingsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<CompanySettings>(EMPTY);

  const [userEmail, setUserEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (mounted && userData.user?.email) {
          setUserEmail(userData.user.email);
          setNewEmail(userData.user.email);
        }

        const { data, error } = await supabase
          .from("company_settings")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (mounted && data) {
          setCompany({
            id: data.id,
            name: data.name ?? "",
            phone: data.phone ?? "",
            whatsapp: data.whatsapp ?? "",
            email: data.email ?? "",
            address: data.address ?? "",
            cep: data.cep ?? "",
            city: data.city ?? "",
            state: data.state ?? "",
            instagram: data.instagram ?? "",
            facebook: data.facebook ?? "",
            business_hours: data.business_hours ?? "",
          });
        }
      } catch (err) {
        console.error("[Settings] Falha ao carregar configurações", err);
        toast.error("Não foi possível carregar as configurações");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSaveCompany() {
    if (!company.name.trim()) {
      toast.error("O nome da empresa é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: company.name.trim(),
        phone: company.phone.trim() || null,
        whatsapp: company.whatsapp.trim() || null,
        email: company.email.trim() || null,
        address: company.address.trim() || null,
        cep: company.cep.trim() || null,
        city: company.city.trim() || null,
        state: company.state.trim() || null,
        instagram: company.instagram.trim() || null,
        facebook: company.facebook.trim() || null,
        business_hours: company.business_hours.trim() || null,
      };

      if (company.id) {
        const { error } = await supabase
          .from("company_settings")
          .update(payload)
          .eq("id", company.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("company_settings")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        setCompany((c) => ({ ...c, id: data.id }));
      }
      toast.success("Informações da empresa atualizadas");
    } catch (err) {
      console.error("[Settings] Falha ao salvar empresa", err);
      toast.error("Erro ao salvar informações da empresa");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeEmail() {
    const parsed = emailSchema.safeParse(newEmail);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (parsed.data === userEmail) {
      toast.info("Este já é o seu e-mail atual");
      return;
    }
    setSavingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: parsed.data });
      if (error) throw error;
      toast.success("Confirme a alteração pelo link enviado ao novo e-mail");
    } catch (err) {
      console.error("[Settings] Falha ao atualizar e-mail", err);
      toast.error("Erro ao atualizar e-mail");
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleChangePassword() {
    const parsed = passwordSchema.safeParse(newPassword);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Senha alterada com sucesso");
    } catch (err) {
      console.error("[Settings] Falha ao atualizar senha", err);
      toast.error("Erro ao alterar senha");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Conta */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="h-4 w-4 text-[#E30613]" />
          <h3 className="font-[Sora] text-lg font-semibold text-zinc-900">Conta de acesso</h3>
        </div>
        <p className="text-sm text-zinc-500 mb-5">
          Altere o e-mail e a senha usados para entrar no painel.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
              <Mail className="h-3.5 w-3.5" /> E-mail de login
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-atual" className="text-xs text-zinc-500">
                E-mail atual
              </Label>
              <Input id="email-atual" value={userEmail} disabled className="bg-zinc-50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-novo">Novo e-mail</Label>
              <Input
                id="email-novo"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="voce@dominio.com"
              />
            </div>
            <Button
              onClick={handleChangeEmail}
              disabled={savingEmail}
              className="bg-zinc-900 text-white hover:bg-zinc-800"
            >
              {savingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Atualizar e-mail
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
              <KeyRound className="h-3.5 w-3.5" /> Senha
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha-nova">Nova senha</Label>
              <Input
                id="senha-nova"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha-confirmar">Confirmar nova senha</Label>
              <Input
                id="senha-confirmar"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={savingPassword || !newPassword}
              className="bg-[#E30613] text-white hover:bg-[#c40510]"
            >
              {savingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Alterar senha
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Empresa */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="h-4 w-4 text-brand-red" />
          <h3 className="font-[Sora] text-lg font-semibold text-zinc-900">Informações da empresa</h3>
        </div>
        <p className="text-sm text-zinc-500 mb-5">
          Dados institucionais usados no site e nos contatos com clientes.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome da empresa *">
            <Input
              value={company.name}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
              placeholder="Excelência Multimarcas"
            />
          </Field>
          <Field label="E-mail de contato">
            <Input
              type="email"
              value={company.email}
              onChange={(e) => setCompany({ ...company, email: e.target.value })}
              placeholder="contato@empresa.com"
            />
          </Field>
          <Field label="Telefone">
            <Input
              value={company.phone}
              onChange={(e) => setCompany({ ...company, phone: e.target.value })}
              placeholder="(00) 0000-0000"
            />
          </Field>
          <Field label="WhatsApp">
            <Input
              value={company.whatsapp}
              onChange={(e) => setCompany({ ...company, whatsapp: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </Field>
          <Field label="Instagram">
            <Input
              value={company.instagram}
              onChange={(e) => setCompany({ ...company, instagram: e.target.value })}
              placeholder="@usuario ou URL completa"
            />
          </Field>
          <Field label="Facebook">
            <Input
              value={company.facebook}
              onChange={(e) => setCompany({ ...company, facebook: e.target.value })}
              placeholder="URL da página"
            />
          </Field>
          <Field label="Endereço" className="md:col-span-2">
            <Input
              value={company.address}
              onChange={(e) => setCompany({ ...company, address: e.target.value })}
              placeholder="Rua, número, bairro"
            />
          </Field>
          <Field label="CEP">
            <Input
              value={company.cep}
              onChange={(e) => setCompany({ ...company, cep: e.target.value })}
              placeholder="00000-000"
            />
          </Field>
          <Field label="Cidade">
            <Input
              value={company.city}
              onChange={(e) => setCompany({ ...company, city: e.target.value })}
              placeholder="Cidade"
            />
          </Field>
          <Field label="Estado">
            <Input
              value={company.state}
              onChange={(e) => setCompany({ ...company, state: e.target.value })}
              placeholder="UF"
              maxLength={2}
            />
          </Field>
          <Field label="Horário de funcionamento" className="md:col-span-2">
            <Textarea
              value={company.business_hours}
              onChange={(e) => setCompany({ ...company, business_hours: e.target.value })}
              placeholder="Seg a Sex: 8h às 18h&#10;Sáb: 8h às 13h"
              rows={3}
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSaveCompany}
            disabled={saving}
            className="bg-brand-red text-white hover:bg-brand-red/90 shadow-red-glow"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar informações
          </Button>
        </div>
      </motion.section>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs text-zinc-600">{label}</Label>
      {children}
    </div>
  );
}
