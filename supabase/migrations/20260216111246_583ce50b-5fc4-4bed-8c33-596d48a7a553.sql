-- Recriar view como security invoker = false para permitir leitura anônima
DROP VIEW IF EXISTS public.franchises_public;

CREATE VIEW public.franchises_public 
WITH (security_invoker = false)
AS
SELECT 
  id,
  city_id,
  name,
  is_active,
  base_price,
  price_per_km,
  created_at
FROM franchises;

-- Garantir acesso
GRANT SELECT ON public.franchises_public TO anon, authenticated;