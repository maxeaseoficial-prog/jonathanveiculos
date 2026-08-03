
-- Remove auditoria test accounts and promote real user to admin
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email LIKE 'auditoria%@example.com'
);

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM public.profiles WHERE email = 'maxeaseoficial@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM auth.users WHERE email LIKE 'auditoria%@example.com';
