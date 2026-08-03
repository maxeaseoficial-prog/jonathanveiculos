import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '../../integrations/supabase/client.server'

export const Route = createFileRoute('/api/audit')({
  loader: async () => {
    return { audit: true }
  }
})

// Since this is a server route in TanStack Start, we use server handlers
export const APIRoute = {
  GET: async () => {
    try {
      const { data: profiles, error: pError } = await supabaseAdmin.from("profiles").select("*");
      const { data: roles, error: rError } = await supabaseAdmin.from("user_roles").select("*");
      
      return new Response(JSON.stringify({ 
        profiles: profiles || [], 
        roles: roles || [],
        errors: { profile: pError?.message, role: rError?.message }
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }
}
