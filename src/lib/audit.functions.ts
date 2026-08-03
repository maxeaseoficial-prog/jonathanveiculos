import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getAuditData = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: profiles, error: pError } = await supabaseAdmin.from("profiles").select("*");
    const { data: roles, error: rError } = await supabaseAdmin.from("user_roles").select("*");
    
    return {
      profiles,
      roles,
      errors: { profiles: pError, roles: rError }
    };
  });
