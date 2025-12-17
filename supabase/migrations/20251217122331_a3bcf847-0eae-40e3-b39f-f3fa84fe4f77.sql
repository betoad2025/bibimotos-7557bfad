-- Fix security vulnerabilities: Remove any public access to sensitive tables

-- Drop potentially problematic policies on profiles if they exist
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Drop potentially problematic policies on drivers if they exist
DROP POLICY IF EXISTS "Public can view drivers" ON public.drivers;
DROP POLICY IF EXISTS "Anyone can view drivers" ON public.drivers;
DROP POLICY IF EXISTS "Drivers are viewable by everyone" ON public.drivers;

-- Create policy for franchise admins to view profiles of users in their franchise
-- (drivers, passengers, merchants)
CREATE POLICY "Franchise admins can view franchise user profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.drivers d
    JOIN public.franchises f ON d.franchise_id = f.id
    WHERE d.user_id = profiles.user_id AND f.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.passengers p
    JOIN public.franchises f ON p.franchise_id = f.id
    WHERE p.user_id = profiles.user_id AND f.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.merchants m
    JOIN public.franchises f ON m.franchise_id = f.id
    WHERE m.user_id = profiles.user_id AND f.owner_id = auth.uid()
  )
);

-- Ensure drivers table only allows appropriate access
-- Passengers need to see basic driver info when viewing their rides
CREATE POLICY "Passengers can view driver basic info for their rides"
ON public.drivers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rides r
    JOIN public.passengers p ON r.passenger_id = p.id
    WHERE r.driver_id = drivers.id AND p.user_id = auth.uid()
  )
);