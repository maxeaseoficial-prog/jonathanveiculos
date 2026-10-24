import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const resolveUsernameInput = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/),
});

/**
 * Resolves the internal authentication e-mail for a given username.
 * The e-mail is never shown in the UI: it is only used to call
 * supabase.auth.signInWithPassword under the hood.
 */
export const resolveUsername = createServerFn({ method: "POST" })
  .inputValidator((data) => resolveUsernameInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .ilike("username", data.username)
      .maybeSingle();

    if (error) {
      console.error("[Admin Auth] Erro ao consultar o banco de usuários:", error);
      throw new Error("Serviço de cadastro temporariamente indisponível.");
    }

    return { email: profile?.email || null };
  });
