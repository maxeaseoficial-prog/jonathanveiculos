import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getAuditData = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const { data: profiles, error: pError } = await supabaseAdmin.from("profiles").select("*");
      
      // Try to create the admin user via RPC if it exists, or just try to see if we can do ANY insert
      // Note: we don't want to mess up the DB, but we need to know if it's reachable
      
      return { 
        profiles: profiles || [], 
        env: {
          hasAdminKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          hasUrl: !!process.env.SUPABASE_URL
        },
        errors: { profile: pError }
      };
    } catch (e: any) {
      return { error: e.message };
    }
  });
