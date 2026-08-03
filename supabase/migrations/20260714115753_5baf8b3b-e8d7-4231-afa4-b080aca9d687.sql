CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER set_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.touch_vehicle_from_image_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  target_vehicle_id uuid;
BEGIN
  target_vehicle_id := COALESCE(NEW.vehicle_id, OLD.vehicle_id);

  IF target_vehicle_id IS NOT NULL THEN
    UPDATE public.vehicles
       SET updated_at = now()
     WHERE id = target_vehicle_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS touch_vehicle_after_image_insert ON public.vehicle_images;
DROP TRIGGER IF EXISTS touch_vehicle_after_image_update ON public.vehicle_images;
DROP TRIGGER IF EXISTS touch_vehicle_after_image_delete ON public.vehicle_images;

CREATE TRIGGER touch_vehicle_after_image_insert
AFTER INSERT ON public.vehicle_images
FOR EACH ROW
EXECUTE FUNCTION public.touch_vehicle_from_image_change();

CREATE TRIGGER touch_vehicle_after_image_update
AFTER UPDATE ON public.vehicle_images
FOR EACH ROW
EXECUTE FUNCTION public.touch_vehicle_from_image_change();

CREATE TRIGGER touch_vehicle_after_image_delete
AFTER DELETE ON public.vehicle_images
FOR EACH ROW
EXECUTE FUNCTION public.touch_vehicle_from_image_change();

ALTER TABLE public.vehicles REPLICA IDENTITY FULL;
ALTER TABLE public.vehicle_images REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'vehicles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'vehicle_images'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_images;
  END IF;
END $$;