ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS whatsapp_porto_uniao text,
ADD COLUMN IF NOT EXISTS whatsapp_bituruna text;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_settings TO authenticated;
GRANT ALL ON public.company_settings TO service_role;
GRANT SELECT ON public.company_settings TO anon;