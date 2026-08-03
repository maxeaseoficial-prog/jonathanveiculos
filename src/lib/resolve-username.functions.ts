import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const resolveUsernameInput = z.object({
  identifier: z.string().trim().min(1),
});

export const resolveUsername = createServerFn({ method: "POST" })
  .inputValidator((data) => resolveUsernameInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Resolve email from profiles table where username or email matches
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .or(`username.eq."${data.identifier}",email.eq."${data.identifier}"`)
      .maybeSingle();

    if (error) {
      console.error("[Admin Auth] Erro ao resolver identificador:", error);
      return { email: null };
    }

    return { email: profile?.email || null };
  });
