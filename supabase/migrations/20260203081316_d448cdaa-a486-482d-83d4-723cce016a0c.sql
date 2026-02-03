-- Add index for faster ride queries by status
CREATE INDEX IF NOT EXISTS idx_rides_status_franchise ON public.rides(franchise_id, status);
CREATE INDEX IF NOT EXISTS idx_rides_driver_status ON public.rides(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_rides_passenger_status ON public.rides(passenger_id, status);

-- Add index for online drivers
CREATE INDEX IF NOT EXISTS idx_drivers_online_franchise ON public.drivers(franchise_id, is_online) WHERE is_online = true;

-- Create function to get available drivers for a ride
CREATE OR REPLACE FUNCTION public.get_available_drivers(p_franchise_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  vehicle_model text,
  vehicle_color text,
  vehicle_plate text,
  rating numeric,
  total_rides integer,
  current_lat numeric,
  current_lng numeric,
  profile_name text,
  profile_avatar text,
  profile_phone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    d.id,
    d.user_id,
    d.vehicle_model,
    d.vehicle_color,
    d.vehicle_plate,
    d.rating,
    d.total_rides,
    d.current_lat,
    d.current_lng,
    p.full_name as profile_name,
    p.avatar_url as profile_avatar,
    p.phone as profile_phone
  FROM drivers d
  JOIN profiles p ON p.user_id = d.user_id
  WHERE d.franchise_id = p_franchise_id
    AND d.is_online = true
    AND d.is_approved = true
    AND d.credits > 0
  ORDER BY d.rating DESC
  LIMIT p_limit
$$;

-- Create function to accept a ride
CREATE OR REPLACE FUNCTION public.accept_ride(p_ride_id uuid, p_driver_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ride rides%ROWTYPE;
  v_driver drivers%ROWTYPE;
BEGIN
  -- Get ride
  SELECT * INTO v_ride FROM rides WHERE id = p_ride_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Corrida não disponível');
  END IF;
  
  -- Get driver
  SELECT * INTO v_driver FROM drivers WHERE id = p_driver_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Motorista não encontrado');
  END IF;
  
  -- Check driver has credits
  IF v_driver.credits <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Sem créditos');
  END IF;
  
  -- Check driver is online and approved
  IF NOT v_driver.is_online OR NOT v_driver.is_approved THEN
    RETURN json_build_object('success', false, 'error', 'Motorista não disponível');
  END IF;
  
  -- Update ride
  UPDATE rides 
  SET driver_id = p_driver_id, status = 'accepted', updated_at = now()
  WHERE id = p_ride_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Corrida já foi aceita por outro motorista');
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$;

-- Create function to complete a ride and handle credits/ratings
CREATE OR REPLACE FUNCTION public.complete_ride(
  p_ride_id uuid,
  p_final_price numeric,
  p_driver_rating integer DEFAULT NULL,
  p_passenger_rating integer DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ride rides%ROWTYPE;
  v_franchise franchises%ROWTYPE;
  v_credit_amount numeric;
BEGIN
  -- Get ride
  SELECT * INTO v_ride FROM rides WHERE id = p_ride_id AND status = 'in_progress';
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Corrida não encontrada');
  END IF;
  
  -- Get franchise settings
  SELECT * INTO v_franchise FROM franchises WHERE id = v_ride.franchise_id;
  v_credit_amount := COALESCE(v_franchise.credit_debit_per_ride, 1.00);
  
  -- Update ride
  UPDATE rides 
  SET 
    status = 'completed', 
    final_price = p_final_price,
    completed_at = now(),
    driver_rating = p_driver_rating,
    passenger_rating = p_passenger_rating,
    updated_at = now()
  WHERE id = p_ride_id;
  
  -- Debit driver credits
  UPDATE drivers 
  SET credits = credits - v_credit_amount, total_rides = total_rides + 1
  WHERE id = v_ride.driver_id;
  
  -- Update passenger total rides
  UPDATE passengers 
  SET total_rides = total_rides + 1
  WHERE id = v_ride.passenger_id;
  
  -- Record credit transaction
  INSERT INTO credit_transactions (driver_id, franchise_id, amount, ride_id, type, description)
  VALUES (v_ride.driver_id, v_ride.franchise_id, -v_credit_amount, p_ride_id, 'ride_debit', 'Débito por corrida completada');
  
  RETURN json_build_object('success', true);
END;
$$;

-- Add RLS policy for drivers to accept rides in their franchise
CREATE POLICY "Drivers can accept pending rides"
ON public.rides
FOR UPDATE
USING (
  status = 'pending' 
  AND franchise_id IN (
    SELECT franchise_id FROM drivers WHERE user_id = auth.uid()
  )
);

-- Allow passengers to create rides
CREATE POLICY "Passengers can create rides"
ON public.rides
FOR INSERT
WITH CHECK (
  passenger_id IN (
    SELECT id FROM passengers WHERE user_id = auth.uid()
  )
);

-- Allow ride participants to update ride status
CREATE POLICY "Ride participants can update ride status"
ON public.rides
FOR UPDATE
USING (
  (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()))
  OR
  (passenger_id IN (SELECT id FROM passengers WHERE user_id = auth.uid()))
);