import { createServerFn } from "@tanstack/react-start";

export const getAuditData = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: profiles } = await supabaseAdmin.from("profiles").select("*");
    const { data: roles } = await supabaseAdmin.from("user_roles").select("*");
    
    return {
      profiles: profiles || [],
      roles: roles || []
    };
  });
