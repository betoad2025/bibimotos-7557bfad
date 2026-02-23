
-- 1. Criar franquia para Guaxupé seguindo o mesmo padrão das outras
INSERT INTO public.franchises (city_id, owner_id, name, is_active, base_price, price_per_km)
VALUES (
  '20099e16-fc90-4d70-baa0-ac284effc645',
  '81fb2a41-45ff-4585-9c37-d860a3b9db6a',
  'Bibi Motos Guaxupe',
  true,
  5.00,
  1.50
);

-- 2. Criar função trigger que auto-cria franquia quando uma cidade é inserida
CREATE OR REPLACE FUNCTION public.auto_create_franchise_for_city()
RETURNS TRIGGER AS $$
DECLARE
  default_owner_id uuid;
BEGIN
  -- Busca o owner_id da primeira franquia ativa (o Super Admin principal)
  SELECT owner_id INTO default_owner_id
  FROM public.franchises
  WHERE is_active = true AND owner_id IS NOT NULL
  ORDER BY created_at ASC
  LIMIT 1;

  -- Só cria se encontrou um owner padrão e se ainda não existe franquia para essa cidade
  IF default_owner_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.franchises WHERE city_id = NEW.id
  ) THEN
    INSERT INTO public.franchises (city_id, owner_id, name, is_active, base_price, price_per_km)
    VALUES (
      NEW.id,
      default_owner_id,
      'Bibi Motos ' || NEW.name,
      true,
      5.00,
      1.50
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Criar o trigger na tabela cities
DROP TRIGGER IF EXISTS trigger_auto_create_franchise ON public.cities;
CREATE TRIGGER trigger_auto_create_franchise
  AFTER INSERT ON public.cities
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_franchise_for_city();
