import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getAuditData = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      // Audit profiles
      const { data: profiles, error: pError } = await supabaseAdmin.from("profiles").select("*");
      
      // Audit user_roles
      const { data: roles, error: rError } = await supabaseAdmin.from("user_roles").select("*");
      
      // Try to see what tables exist
      const { data: tables, error: tError } = await supabaseAdmin.rpc('get_tables').catch(() => ({ data: null, error: 'RPC get_tables not found' }));

      // Check if we can find any user with "admin" in their email or name
      const { data: adminProfiles, error: apError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .or('email.ilike.%admin%,full_name.ilike.%admin%');

      return { 
        profiles: profiles || [], 
        roles: roles || [], 
        adminProfiles: adminProfiles || [],
        errors: { profile: pError, role: rError, adminProfile: apError, table: tError }
      };
    } catch (e: any) {
      return { error: e.message, stack: e.stack };
    }
  });
