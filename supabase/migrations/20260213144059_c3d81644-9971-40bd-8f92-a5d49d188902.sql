
DROP VIEW IF EXISTS public.profiles_with_email;

CREATE OR REPLACE VIEW public.profiles_with_email
WITH (security_invoker=off)
AS
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.avatar_url,
  p.updated_at,
  p.phone_number,
  p.personal_phone_number,
  p.role,
  p.supervisor_id,
  p.address,
  p.team_shift,
  p.team_name,
  p.motorcycle_model,
  p.license_plate,
  p.email,
  au.email AS user_email
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id;

GRANT SELECT ON public.profiles_with_email TO authenticated;
