import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getAuditData = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const { data: profiles, error: pError } = await supabaseAdmin.from("profiles").select("*");
      const { data: roles, error: rError } = await supabaseAdmin.from("user_roles").select("*");
      
      // We also want to know the emails in auth.users if possible
      // Profiles usually has them if they were created via the normal flow
      
      return { 
        profiles: profiles || [], 
        roles: roles || [],
        errors: { profile: pError?.message, role: rError?.message }
      };
    } catch (e: any) {
      return { error: e.message };
    }
  });
