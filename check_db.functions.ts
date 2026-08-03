import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getAuditData = createServerFn({ method: "GET" })
  .handler(async () => {
    return { status: "server-fn-works" };
  });
