DROP TRIGGER IF EXISTS set_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER set_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_vehicle_images_updated_at ON public.vehicle_images;
CREATE TRIGGER set_vehicle_images_updated_at
BEFORE UPDATE ON public.vehicle_images
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();