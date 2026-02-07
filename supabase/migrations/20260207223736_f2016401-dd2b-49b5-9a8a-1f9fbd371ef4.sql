-- ================================================================
-- FIX SECURITY: Restrict access to profiles and drivers tables
-- ================================================================

-- Drop existing overly permissive policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- Drop existing overly permissive policies on drivers
DROP POLICY IF EXISTS "Drivers can view their own data" ON public.drivers;
DROP POLICY IF EXISTS "Anyone can view drivers" ON public.drivers;
DROP POLICY IF EXISTS "Public drivers access" ON public.drivers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.drivers;
DROP POLICY IF EXISTS "Franchise users can view their drivers" ON public.drivers;

-- ================================================================
-- PROFILES TABLE POLICIES
-- ================================================================

-- Users can ONLY view their own profile
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Super admins can view all profiles
CREATE POLICY "profiles_select_super_admin"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Franchise admins can view profiles of users in their franchise
CREATE POLICY "profiles_select_franchise_admin"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_franchise_admin_for_user(auth.uid(), user_id));

-- Users can update ONLY their own profile
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can insert their own profile (for registration)
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ================================================================
-- DRIVERS TABLE POLICIES
-- ================================================================

-- Drivers can ONLY view their own data
CREATE POLICY "drivers_select_own"
ON public.drivers FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Super admins can view all drivers
CREATE POLICY "drivers_select_super_admin"
ON public.drivers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Franchise admins can view drivers in their franchise
CREATE POLICY "drivers_select_franchise_admin"
ON public.drivers FOR SELECT
TO authenticated
USING (public.is_owner_of_franchise(auth.uid(), franchise_id));

-- Passengers/merchants can view BASIC driver info (via security definer function only)
-- This is handled by the get_driver_basic_info() function which is SECURITY DEFINER

-- Drivers can update their own data
CREATE POLICY "drivers_update_own"
ON public.drivers FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Franchise admins can update drivers in their franchise (for approval)
CREATE POLICY "drivers_update_franchise_admin"
ON public.drivers FOR UPDATE
TO authenticated
USING (public.is_owner_of_franchise(auth.uid(), franchise_id));

-- Drivers can insert their own record (for registration)
CREATE POLICY "drivers_insert_own"
ON public.drivers FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Super admins can manage all drivers
CREATE POLICY "drivers_all_super_admin"
ON public.drivers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- ================================================================
-- Create a secure function for passengers to get limited driver info
-- ================================================================
CREATE OR REPLACE FUNCTION public.get_ride_driver_info(p_ride_id uuid)
RETURNS TABLE(
  driver_id uuid,
  driver_name text,
  driver_avatar text,
  driver_phone text,
  vehicle_model text,
  vehicle_color text,
  vehicle_plate text,
  rating numeric,
  current_lat numeric,
  current_lng numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    d.id as driver_id,
    p.full_name as driver_name,
    p.avatar_url as driver_avatar,
    p.phone as driver_phone,
    d.vehicle_model,
    d.vehicle_color,
    d.vehicle_plate,
    d.rating,
    d.current_lat,
    d.current_lng
  FROM rides r
  JOIN drivers d ON d.id = r.driver_id
  JOIN profiles p ON p.user_id = d.user_id
  WHERE r.id = p_ride_id
    AND (
      -- Passenger of the ride can see
      r.passenger_id IN (SELECT id FROM passengers WHERE user_id = auth.uid())
      -- Or driver of the ride
      OR d.user_id = auth.uid()
      -- Or super admin
      OR public.has_role(auth.uid(), 'super_admin')
      -- Or franchise admin
      OR public.is_owner_of_franchise(auth.uid(), r.franchise_id)
    )
$$;