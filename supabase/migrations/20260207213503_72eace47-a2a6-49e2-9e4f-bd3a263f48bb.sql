-- Create favorite_addresses table for user saved addresses
CREATE TABLE IF NOT EXISTS public.favorite_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  franchise_id uuid NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text DEFAULT 'favorite',
  address text NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.favorite_addresses ENABLE ROW LEVEL SECURITY;

-- Users can view their own addresses
CREATE POLICY "Users can view own favorite addresses"
ON public.favorite_addresses
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own addresses
CREATE POLICY "Users can create own favorite addresses"
ON public.favorite_addresses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses
CREATE POLICY "Users can update own favorite addresses"
ON public.favorite_addresses
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own addresses
CREATE POLICY "Users can delete own favorite addresses"
ON public.favorite_addresses
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_favorite_addresses_user_id ON public.favorite_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_addresses_franchise_id ON public.favorite_addresses(franchise_id);

-- Add trigger for updated_at
CREATE TRIGGER update_favorite_addresses_updated_at
BEFORE UPDATE ON public.favorite_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();