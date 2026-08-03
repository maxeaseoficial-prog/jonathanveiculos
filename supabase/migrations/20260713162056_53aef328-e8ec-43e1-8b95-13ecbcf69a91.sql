DROP POLICY IF EXISTS "leads_public_insert" ON public.leads;
CREATE POLICY "leads_public_insert" ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(name)) BETWEEN 2 AND 120
  AND (phone IS NOT NULL OR email IS NOT NULL)
  AND (phone IS NULL OR length(btrim(phone)) BETWEEN 8 AND 30)
  AND (email IS NULL OR email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
  AND (message IS NULL OR length(message) <= 1000)
  AND handled = false
);

DROP POLICY IF EXISTS "visits_public_insert" ON public.visits;
CREATE POLICY "visits_public_insert" ON public.visits
FOR INSERT
TO anon, authenticated
WITH CHECK (
  path IS NOT NULL
  AND length(path) BETWEEN 1 AND 300
  AND left(path, 1) = '/'
  AND (referer IS NULL OR length(referer) <= 500)
  AND (user_agent IS NULL OR length(user_agent) <= 500)
);