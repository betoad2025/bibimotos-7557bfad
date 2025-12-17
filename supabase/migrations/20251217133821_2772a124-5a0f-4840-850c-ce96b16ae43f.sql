-- Security hardening: restrict anonymous access explicitly, lock down storage documents, and prevent payment credential exposure

-- 1) Make sure sensitive table policies apply only to authenticated users
-- Profiles
ALTER POLICY "Users can view own profile" ON public.profiles TO authenticated;
ALTER POLICY "Users can update own profile" ON public.profiles TO authenticated;
ALTER POLICY "Users can insert own profile" ON public.profiles TO authenticated;
ALTER POLICY "Franchise admins can view franchise user profiles" ON public.profiles TO authenticated;
ALTER POLICY "Super admins can view all profiles" ON public.profiles TO authenticated;

-- Drivers
ALTER POLICY "Drivers can view own data" ON public.drivers TO authenticated;
ALTER POLICY "Drivers can update own data" ON public.drivers TO authenticated;
ALTER POLICY "Franchise admins can view franchise drivers" ON public.drivers TO authenticated;
ALTER POLICY "Franchise admins can manage franchise drivers" ON public.drivers TO authenticated;
ALTER POLICY "Passengers can view driver basic info for their rides" ON public.drivers TO authenticated;
ALTER POLICY "Super admins can manage all drivers" ON public.drivers TO authenticated;

-- 2) Prevent public exposure of payment credentials in franchises table
-- Public policy stays for pricing fields, but we revoke selecting sensitive columns for anon/authenticated.
REVOKE SELECT (payment_api_key, payment_webhook_url) ON public.franchises FROM anon;
REVOKE SELECT (payment_api_key, payment_webhook_url) ON public.franchises FROM authenticated;

-- Allow only service role (bypasses RLS anyway) to read those columns; owners can set via RPC below.

CREATE OR REPLACE FUNCTION public.set_franchise_payment_settings(
  _franchise_id uuid,
  _payment_gateway text,
  _payment_webhook_url text,
  _payment_api_key text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_is_owner boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.franchises f
    WHERE f.id = _franchise_id
      AND (f.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  UPDATE public.franchises
  SET payment_gateway = _payment_gateway,
      payment_webhook_url = _payment_webhook_url,
      payment_api_key = _payment_api_key,
      updated_at = now()
  WHERE id = _franchise_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_franchise_payment_settings(
  _franchise_id uuid
) RETURNS TABLE(
  payment_gateway text,
  payment_webhook_url text,
  has_api_key boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT f.payment_gateway,
         f.payment_webhook_url,
         (f.payment_api_key IS NOT NULL AND length(f.payment_api_key) > 0) AS has_api_key
  FROM public.franchises f
  WHERE f.id = _franchise_id
    AND (f.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'::public.app_role));
$$;

-- 3) Storage: make documents bucket private + add franchise-admin access to driver documents
DO $$
BEGIN
  -- Ensure avatars bucket exists (public)
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
  END IF;

  -- Make documents bucket private
  UPDATE storage.buckets SET public = false WHERE id = 'documents';
END$$;

-- Documents policies (ensure they exist and are correct)
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can view all documents" ON storage.objects;
DROP POLICY IF EXISTS "Franchise admins can view franchise driver documents" ON storage.objects;

CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Super admins can view all documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE POLICY "Franchise admins can view franchise driver documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1
    FROM public.drivers d
    JOIN public.franchises f ON f.id = d.franchise_id
    WHERE f.owner_id = auth.uid()
      AND d.user_id::text = (storage.foldername(name))[1]
  )
);

-- Avatars upload policy
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
