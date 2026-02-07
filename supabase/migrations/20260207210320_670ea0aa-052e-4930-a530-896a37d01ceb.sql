
-- Criar função security definer para verificar se usuário é admin de franquia
-- Isso evita a recursão infinita ao fazer query na própria tabela durante verificação RLS
CREATE OR REPLACE FUNCTION public.is_franchise_admin_for_user(_admin_user_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Verificar se é admin de franquia onde o target é driver
    SELECT 1 FROM drivers d
    JOIN franchises f ON d.franchise_id = f.id
    WHERE d.user_id = _target_user_id 
    AND f.owner_id = _admin_user_id
  )
  OR EXISTS (
    -- Verificar se é admin de franquia onde o target é passenger
    SELECT 1 FROM passengers p
    JOIN franchises f ON p.franchise_id = f.id
    WHERE p.user_id = _target_user_id 
    AND f.owner_id = _admin_user_id
  )
  OR EXISTS (
    -- Verificar se é admin de franquia onde o target é merchant
    SELECT 1 FROM merchants m
    JOIN franchises f ON m.franchise_id = f.id
    WHERE m.user_id = _target_user_id 
    AND f.owner_id = _admin_user_id
  )
$$;

-- Dropar a política problemática que causa recursão
DROP POLICY IF EXISTS "Franchise admins can view franchise user profiles" ON public.profiles;

-- Recriar a política usando a função security definer
CREATE POLICY "Franchise admins can view franchise user profiles" 
ON public.profiles 
FOR SELECT 
USING (
  public.is_franchise_admin_for_user(auth.uid(), user_id)
);

-- Também verificar e corrigir políticas de drivers que possam causar recursão
-- Adicionar função para verificar se usuário é dono de franquia
CREATE OR REPLACE FUNCTION public.is_owner_of_franchise(_user_id uuid, _franchise_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM franchises 
    WHERE id = _franchise_id 
    AND owner_id = _user_id
  )
$$;

-- Atualizar políticas de drivers para usar função
DROP POLICY IF EXISTS "Franchise admins can manage franchise drivers" ON public.drivers;
DROP POLICY IF EXISTS "Franchise admins can view franchise drivers" ON public.drivers;

CREATE POLICY "Franchise admins can manage franchise drivers" 
ON public.drivers 
FOR ALL 
USING (public.is_owner_of_franchise(auth.uid(), franchise_id));

CREATE POLICY "Franchise admins can view franchise drivers" 
ON public.drivers 
FOR SELECT 
USING (public.is_owner_of_franchise(auth.uid(), franchise_id));

-- Fazer o mesmo para passengers
DROP POLICY IF EXISTS "Franchise admins can view franchise passengers" ON public.passengers;

CREATE POLICY "Franchise admins can view franchise passengers" 
ON public.passengers 
FOR SELECT 
USING (public.is_owner_of_franchise(auth.uid(), franchise_id));

-- E para merchants
DROP POLICY IF EXISTS "Franchise admins can view franchise merchants" ON public.merchants;

CREATE POLICY "Franchise admins can view franchise merchants" 
ON public.merchants 
FOR SELECT 
USING (public.is_owner_of_franchise(auth.uid(), franchise_id));
