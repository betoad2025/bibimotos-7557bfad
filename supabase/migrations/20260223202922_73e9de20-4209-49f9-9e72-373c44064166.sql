
-- Create updated_at function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create city_marketing table for per-city marketing pixels
CREATE TABLE public.city_marketing (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  facebook_pixel_id text,
  facebook_access_token text,
  google_ads_id text,
  google_ads_conversion_id text,
  google_analytics_id text,
  tiktok_pixel_id text,
  taboola_pixel_id text,
  resend_api_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(city_id)
);

-- Add min_credit_purchase to franchises
ALTER TABLE public.franchises ADD COLUMN IF NOT EXISTS min_credit_purchase numeric DEFAULT 10.00;

-- Enable RLS
ALTER TABLE public.city_marketing ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all city marketing
CREATE POLICY "Super admins can manage all city marketing"
ON public.city_marketing FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Franchise owners can view/edit marketing for cities of their franchises
CREATE POLICY "Franchise owners can view city marketing"
ON public.city_marketing FOR SELECT
USING (city_id IN (
  SELECT f.city_id FROM franchises f WHERE f.owner_id = auth.uid()
));

CREATE POLICY "Franchise owners can update city marketing"
ON public.city_marketing FOR UPDATE
USING (city_id IN (
  SELECT f.city_id FROM franchises f WHERE f.owner_id = auth.uid()
));

CREATE POLICY "Franchise owners can insert city marketing"
ON public.city_marketing FOR INSERT
WITH CHECK (city_id IN (
  SELECT f.city_id FROM franchises f WHERE f.owner_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_city_marketing_updated_at
BEFORE UPDATE ON public.city_marketing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
