import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ensureAdminInput = z.object({
  fullName: z.string().trim().max(100).optional(),
});

export const ensureAdminAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => ensureAdminInput.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    console.info("[Admin Auth] Preparando conta administrativa no servidor...", {
      userId: context.userId,
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = typeof context.claims.email === "string" ? context.claims.email : null;
    const fallbackName = email?.split("@")[0] || "Usuário";
    const fullName = data.fullName?.trim() || fallbackName;

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: context.userId,
      email,
      full_name: fullName,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("[Admin Auth] Falha ao criar/atualizar perfil:", profileError);
      throw new Error("Não foi possível preparar o perfil administrativo.");
    }

    const { count: adminCount, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if (countError) {
      console.error("[Admin Auth] Falha ao verificar administradores:", countError);
      throw new Error("Não foi possível verificar as permissões administrativas.");
    }

    if ((adminCount ?? 0) === 0) {
      const { error: roleError } = await supabaseAdmin.from("user_roles").upsert({
        user_id: context.userId,
        role: "admin",
      });

      if (roleError) {
        console.error("[Admin Auth] Falha ao conceder primeiro administrador:", roleError);
        throw new Error("Não foi possível conceder a permissão administrativa inicial.");
      }
    }

    const { data: roleData, error: roleReadError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleReadError) {
      console.error("[Admin Auth] Falha ao confirmar permissão administrativa:", roleReadError);
      throw new Error("Não foi possível confirmar sua permissão administrativa.");
    }

    const isAdmin = roleData?.role === "admin";
    console.info("[Admin Auth] Conta administrativa pronta.", { isAdmin });
    return { ok: true, isAdmin };
  });