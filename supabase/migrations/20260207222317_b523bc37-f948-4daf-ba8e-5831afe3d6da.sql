-- Drop the problematic storage policy that causes recursion
DROP POLICY IF EXISTS "Franchise admins can view franchise driver documents" ON storage.objects;

-- Recreate the policy using SECURITY DEFINER function to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.can_view_franchise_driver_documents(bucket text, file_name text)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  folder_user_id text;
  is_franchise_admin boolean;
BEGIN
  -- Only check for documents bucket
  IF bucket != 'documents' THEN
    RETURN false;
  END IF;
  
  -- Get the user_id from folder structure
  folder_user_id := (storage.foldername(file_name))[1];
  
  -- Check if current user is a franchise admin that owns the franchise of the driver
  SELECT EXISTS (
    SELECT 1 
    FROM drivers d
    JOIN franchises f ON f.id = d.franchise_id
    WHERE d.user_id::text = folder_user_id
    AND f.owner_id = auth.uid()
  ) INTO is_franchise_admin;
  
  RETURN is_franchise_admin;
END;
$$;

-- Recreate policy using the function
CREATE POLICY "Franchise admins can view franchise driver documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents' 
  AND public.can_view_franchise_driver_documents(bucket_id, name)
);