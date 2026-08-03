import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ensureAdminInput = z.object({
  fullName: z.string().trim().max(100).optional(),
  username: z.string().trim().min(1).optional(),
});

export const ensureAdminAccount = createServerFn({ method: "POST" })
  .inputValidator((data) => ensureAdminInput.parse(data ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    
    // Auth token is attached via functionMiddleware in src/start.ts
    const authHeader = getRequestHeader("Authorization");
    
    let userId: string;
    let email: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (authError || !user) {
        console.error("[Admin Auth] Erro ao validar token:", authError);
        throw new Error("Não autenticado ou sessão expirada.");
      }
      
      userId = user.id;
      email = user.email;
    } else {
      throw new Error("Não autenticado.");
    }

    const fallbackName = email?.split("@")[0] || "Usuário";
    const fullName = data.fullName?.trim() || fallbackName;
    const username = data.username?.trim() || email?.split("@")[0];

    console.info("[Admin Auth] Garantindo conta administrativa...", { userId, username });

    // 1. Upsert profile
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email,
      full_name: fullName,
      username: username,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("[Admin Auth] Erro ao criar perfil:", profileError);
      throw new Error("Erro ao preparar perfil.");
    }

    // 2. Grant admin role
    const { error: roleError } = await supabaseAdmin.from("user_roles").upsert({
      user_id: userId,
      role: "admin",
    });

    if (roleError) {
      console.error("[Admin Auth] Erro ao conceder admin:", roleError);
      throw new Error("Erro ao conceder permissão.");
    }

    return { ok: true, isAdmin: true };
  });
