
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'editor');
CREATE TYPE public.vehicle_status AS ENUM ('ativo', 'inativo', 'vendido', 'reservado', 'oculto');
CREATE TYPE public.fuel_type AS ENUM ('gasolina', 'etanol', 'flex', 'diesel', 'hibrido', 'eletrico', 'gnv');
CREATE TYPE public.transmission_type AS ENUM ('manual', 'automatico', 'automatizado', 'cvt');

-- ============ UPDATED_AT HELPER ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on new signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_self_select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- Admins can view all roles
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ COMPANY SETTINGS ============
CREATE TABLE public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Excelência Multimarcas',
  logo_url TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  instagram TEXT,
  facebook TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  cep TEXT,
  business_hours TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.company_settings TO anon, authenticated;
GRANT ALL ON public.company_settings TO service_role;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_public_read" ON public.company_settings FOR SELECT USING (true);
CREATE POLICY "company_admin_all" ON public.company_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_company_updated BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.company_settings (name, phone, whatsapp, email, instagram, facebook, address, city, state, cep, business_hours)
VALUES (
  'Excelência Multimarcas',
  '(42) 99978-4395',
  '5542999784395',
  NULL,
  'https://www.instagram.com/excelencia.multimarcas/',
  'https://www.facebook.com/profile.php?id=100063737730879',
  'R. Pres. João Café Filho, 200 | São Basílio Magno',
  'União da Vitória',
  'PR',
  '84600-658',
  'Seg a Sex: 08:00 às 18:30 | Sáb: 08:00 às 15:00 | Dom: Fechado'
);

-- ============ CATALOGS ============
CREATE TABLE public.catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.catalogs TO anon, authenticated;
GRANT ALL ON public.catalogs TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.catalogs TO authenticated;
ALTER TABLE public.catalogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalogs_public_read_active" ON public.catalogs FOR SELECT USING (active = true OR public.is_admin());
CREATE POLICY "catalogs_admin_all" ON public.catalogs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_catalogs_updated BEFORE UPDATE ON public.catalogs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ VEHICLES ============
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  version TEXT,
  category TEXT,
  year INT NOT NULL,
  model_year INT,
  km INT NOT NULL DEFAULT 0,
  color TEXT,
  fuel public.fuel_type,
  transmission public.transmission_type,
  engine TEXT,
  power TEXT,
  doors INT,
  plate_end TEXT,

  first_owner BOOLEAN DEFAULT false,
  single_owner BOOLEAN DEFAULT false,
  revised BOOLEAN DEFAULT true,
  accepts_trade BOOLEAN DEFAULT true,
  financeable BOOLEAN DEFAULT true,
  owner_manual BOOLEAN DEFAULT false,
  spare_key BOOLEAN DEFAULT false,
  warranty BOOLEAN DEFAULT false,

  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  previous_price NUMERIC(12,2),

  status public.vehicle_status NOT NULL DEFAULT 'ativo',
  featured BOOLEAN NOT NULL DEFAULT false,
  on_sale BOOLEAN NOT NULL DEFAULT false,
  is_new_arrival BOOLEAN NOT NULL DEFAULT false,

  description TEXT,
  standard_items TEXT,
  optional_items TEXT,
  notes TEXT,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT SELECT ON public.vehicles TO anon;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles_public_read_active" ON public.vehicles FOR SELECT USING (status = 'ativo' OR public.is_admin());
CREATE POLICY "vehicles_admin_all" ON public.vehicles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_vehicles_brand ON public.vehicles(brand);
CREATE INDEX idx_vehicles_featured ON public.vehicles(featured);

-- ============ VEHICLE IMAGES ============
CREATE TABLE public.vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vehicle_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.vehicle_images TO authenticated;
GRANT ALL ON public.vehicle_images TO service_role;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vimages_public_read" ON public.vehicle_images FOR SELECT USING (true);
CREATE POLICY "vimages_admin_all" ON public.vehicle_images FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE INDEX idx_vimages_vehicle ON public.vehicle_images(vehicle_id);

-- ============ VEHICLE <-> CATALOGS ============
CREATE TABLE public.vehicle_catalogs (
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  catalog_id UUID NOT NULL REFERENCES public.catalogs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (vehicle_id, catalog_id)
);
GRANT SELECT ON public.vehicle_catalogs TO anon, authenticated;
GRANT INSERT, DELETE ON public.vehicle_catalogs TO authenticated;
GRANT ALL ON public.vehicle_catalogs TO service_role;
ALTER TABLE public.vehicle_catalogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vcat_public_read" ON public.vehicle_catalogs FOR SELECT USING (true);
CREATE POLICY "vcat_admin_all" ON public.vehicle_catalogs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ LEADS ============
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  message TEXT,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  source TEXT,
  handled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_public_insert" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "leads_admin_all" ON public.leads FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ VISITS ============
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT,
  referer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.visits TO anon, authenticated;
GRANT SELECT ON public.visits TO authenticated;
GRANT ALL ON public.visits TO service_role;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visits_public_insert" ON public.visits FOR INSERT WITH CHECK (true);
CREATE POLICY "visits_admin_select" ON public.visits FOR SELECT TO authenticated USING (public.is_admin());
CREATE INDEX idx_visits_created ON public.visits(created_at DESC);

-- ============ ACTIVITY LOGS ============
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_admin_select" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "logs_authenticated_insert" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_logs_created ON public.activity_logs(created_at DESC);
