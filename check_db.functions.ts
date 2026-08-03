import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getAuditData = createServerFn({ method: "GET" })
  .handler(async () => {
    // Audit profiles (this is where usernames might live if they exist)
    const { data: profiles, error: pError } = await supabaseAdmin.from("profiles").select("*");
    
    // Audit user_roles
    const { data: roles, error: rError } = await supabaseAdmin.from("user_roles").select("*");
    
    // We can't query auth.users directly via PostgREST easily without RPC, 
    // but we can try to find the "admin" user if it exists in profiles or roles.
    
    return { 
      profiles: profiles || [], 
      roles: roles || [], 
      errors: { profile: pError, role: rError }
    };
  });
