-- This is an empty migration.
-- Add the new column to the profiles table
ALTER TABLE public.profiles
ADD COLUMN personal_phone_number TEXT;

-- Update the handle_new_user function to include the new column
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role, avatar_url, phone_number, personal_phone_number, supervisor_id, address, team_shift)
  VALUES (
    new.id, 
    NULLIF(new.raw_user_meta_data ->> 'first_name', ''), 
    NULLIF(new.raw_user_meta_data ->> 'last_name', ''), 
    COALESCE(new.raw_user_meta_data ->> 'role', 'standard')::app_role,
    NULLIF(new.raw_user_meta_data ->> 'avatar_url', ''), 
    NULLIF(new.raw_user_meta_data ->> 'phone_number', ''),
    NULLIF(new.raw_user_meta_data ->> 'personal_phone_number', ''), -- Novo campo
    CASE 
      WHEN new.raw_user_meta_data ->> 'supervisor_id' IS NULL OR new.raw_user_meta_data ->> 'supervisor_id' = '' OR new.raw_user_meta_data ->> 'supervisor_id' = 'null' THEN NULL
      ELSE (new.raw_user_meta_data ->> 'supervisor_id')::uuid
    END,
    NULLIF(new.raw_user_meta_data ->> 'address', ''),
    COALESCE(new.raw_user_meta_data ->> 'team_shift', 'day')::team_shift_type
  );
  RETURN new;
END;
$$;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();