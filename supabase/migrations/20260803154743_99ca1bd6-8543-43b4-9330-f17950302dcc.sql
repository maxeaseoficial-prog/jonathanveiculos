ALTER TABLE public.vehicles ADD COLUMN filial text DEFAULT 'Porto União' NOT NULL;
COMMENT ON COLUMN public.vehicles.filial IS 'Filial onde o veículo está localizado (Porto União ou Bituruna)';