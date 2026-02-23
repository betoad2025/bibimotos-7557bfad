
-- Corrigir o trigger: franquias sem dono devem ser vinculadas ao Master Admin
-- Regra: toda cidade DEVE ter franquia, e se não houver dono, vincula ao admin master
CREATE OR REPLACE FUNCTION public.auto_create_franchise_for_city()
RETURNS TRIGGER AS $$
DECLARE
  master_owner_id uuid;
BEGIN
  -- Busca o Super Admin master (primeiro super_admin cadastrado)
  SELECT ur.user_id INTO master_owner_id
  FROM public.user_roles ur
  WHERE ur.role = 'super_admin'
  ORDER BY ur.created_at ASC
  LIMIT 1;

  -- Se não encontrou super_admin, tenta o owner da primeira franquia
  IF master_owner_id IS NULL THEN
    SELECT owner_id INTO master_owner_id
    FROM public.franchises
    WHERE is_active = true AND owner_id IS NOT NULL
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- Só cria se ainda não existe franquia para essa cidade
  IF NOT EXISTS (
    SELECT 1 FROM public.franchises WHERE city_id = NEW.id
  ) THEN
    INSERT INTO public.franchises (city_id, owner_id, name, is_active, base_price, price_per_km)
    VALUES (
      NEW.id,
      master_owner_id, -- vincula ao Master Admin
      'Bibi Motos ' || NEW.name,
      true,
      5.00,
      1.50
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
