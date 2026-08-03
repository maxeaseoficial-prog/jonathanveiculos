-- Adicionar coluna username se não existir
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Garantir que a função de criação de admin trate o username
CREATE OR REPLACE FUNCTION public.ensure_admin_account(_full_name text DEFAULT NULL, _username text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _email text := COALESCE(auth.jwt() ->> 'email', '');
  _safe_name text := NULLIF(BTRIM(_full_name), '');
  _safe_username text := NULLIF(BTRIM(_username), '');
  _is_admin boolean := false;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('excelencia_multimarcas_first_admin'));

  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (
    _user_id,
    NULLIF(_email, ''),
    COALESCE(
      _safe_name,
      NULLIF(auth.jwt() -> 'user_metadata' ->> 'full_name', ''),
      NULLIF(split_part(_email, '@', 1), ''),
      'Usuário'
    ),
    COALESCE(
      _safe_username,
      NULLIF(auth.jwt() -> 'user_metadata' ->> 'username', ''),
      NULLIF(split_part(_email, '@', 1), '')
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    username = COALESCE(NULLIF(EXCLUDED.username, ''), public.profiles.username),
    updated_at = now();

  -- Todo usuário criado por este fluxo agora é promovido a admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  ) INTO _is_admin;

  RETURN jsonb_build_object('ok', true, 'isAdmin', _is_admin);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_admin_account(text, text) TO authenticated;
