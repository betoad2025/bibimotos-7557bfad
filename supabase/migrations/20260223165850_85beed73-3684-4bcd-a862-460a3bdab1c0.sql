
-- 1. Remover policies duplicadas/circulares de drivers
DROP POLICY IF EXISTS "Passengers can view driver basic info for their rides" ON drivers;
DROP POLICY IF EXISTS "Drivers can view own data" ON drivers;
DROP POLICY IF EXISTS "Drivers can update own data" ON drivers;
DROP POLICY IF EXISTS "Super admins can manage all drivers" ON drivers;
DROP POLICY IF EXISTS "Franchise admins can view franchise drivers" ON drivers;
DROP POLICY IF EXISTS "Franchise admins can manage franchise drivers" ON drivers;

-- 2. Criar função SECURITY DEFINER para quebrar recursão completamente
CREATE OR REPLACE FUNCTION public.get_passenger_driver_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT r.driver_id 
  FROM rides r
  JOIN passengers p ON r.passenger_id = p.id
  WHERE p.user_id = _user_id
    AND r.driver_id IS NOT NULL;
$$;

-- 3. Criar policy segura para passageiros (sem recursão via SECURITY DEFINER)
CREATE POLICY "Passengers can view their ride drivers"
ON drivers FOR SELECT
USING (
  id IN (SELECT public.get_passenger_driver_ids(auth.uid()))
);

-- 4. Remover UNIQUE constraint de city_id para permitir 1 Franquia = N Cidades
ALTER TABLE franchises DROP CONSTRAINT IF EXISTS franchises_city_id_key;
