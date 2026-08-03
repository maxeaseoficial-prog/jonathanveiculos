import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getAuditData = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const { data: profiles, error: pError } = await supabaseAdmin.from("profiles").select("*");
      const { data: roles, error: rError } = await supabaseAdmin.from("user_roles").select("*");
      
      // Try to get count of auth.users via a direct check if possible, 
      // or at least check if we can reach the profiles table
      return { 
        profiles: profiles || [], 
        roles: roles || [],
        errors: { profile: pError?.message, role: rError?.message }
      };
    } catch (e: any) {
      return { error: e.message };
    }
  });
