-- =============================================
-- SISTEMA COMPLETO DE FRANQUIAS BIBI MOTOS
-- =============================================

-- 1. Campos adicionais para franquias
ALTER TABLE public.franchises 
ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'active' CHECK (billing_status IN ('active', 'blocked', 'grace_period', 'trial')),
ADD COLUMN IF NOT EXISTS billing_blocked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS billing_grace_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_billing_date DATE,
ADD COLUMN IF NOT EXISTS last_payment_date DATE,
ADD COLUMN IF NOT EXISTS driver_charge_type TEXT DEFAULT 'per_ride' CHECK (driver_charge_type IN ('per_ride', 'percentage')),
ADD COLUMN IF NOT EXISTS driver_charge_value NUMERIC DEFAULT 2.00,
ADD COLUMN IF NOT EXISTS promo_absorb_cost BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS loyalty_rides_for_free INTEGER,
ADD COLUMN IF NOT EXISTS loyalty_enabled BOOLEAN DEFAULT false;

-- 2. Tabela de pagamentos de mensalidade da franquia
CREATE TABLE IF NOT EXISTS public.franchise_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  payment_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  is_prorated BOOLEAN DEFAULT false,
  prorate_days INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela para solicitações de transferência de motorista entre franquias
CREATE TABLE IF NOT EXISTS public.driver_transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  from_franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  to_franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  rejection_reason TEXT,
  notes TEXT
);

-- 4. Histórico de transferência de franquias
CREATE TABLE IF NOT EXISTS public.franchise_transfer_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  from_owner_id UUID,
  to_owner_id UUID,
  transferred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  transferred_by UUID,
  drivers_count INTEGER DEFAULT 0,
  passengers_count INTEGER DEFAULT 0,
  merchants_count INTEGER DEFAULT 0,
  notes TEXT
);

-- 5. Programa de fidelidade - tracking de corridas
CREATE TABLE IF NOT EXISTS public.loyalty_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  rides_count INTEGER DEFAULT 0,
  free_rides_earned INTEGER DEFAULT 0,
  free_rides_used INTEGER DEFAULT 0,
  last_free_ride_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, franchise_id)
);

-- 6. Adicionar campo de cortesia/desbloqueio confiança nas franquias
ALTER TABLE public.franchises
ADD COLUMN IF NOT EXISTS courtesy_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS courtesy_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS courtesy_granted_by UUID,
ADD COLUMN IF NOT EXISTS courtesy_reason TEXT;

-- 7. Adicionar absorção de promoção nas promoções
ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS absorb_driver_cost BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rides_required INTEGER,
ADD COLUMN IF NOT EXISTS promo_type TEXT DEFAULT 'coupon' CHECK (promo_type IN ('coupon', 'loyalty', 'cashback'));

-- 8. Índices para performance
CREATE INDEX IF NOT EXISTS idx_franchise_billing_franchise ON public.franchise_billing(franchise_id);
CREATE INDEX IF NOT EXISTS idx_franchise_billing_status ON public.franchise_billing(status);
CREATE INDEX IF NOT EXISTS idx_driver_transfer_status ON public.driver_transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_loyalty_progress_user ON public.loyalty_progress(user_id);

-- 9. RLS para franchise_billing
ALTER TABLE public.franchise_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all billing"
ON public.franchise_billing FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Franchise owners can view their billing"
ON public.franchise_billing FOR SELECT
USING (
  franchise_id IN (
    SELECT id FROM public.franchises WHERE owner_id = auth.uid()
  )
);

-- 10. RLS para driver_transfer_requests
ALTER TABLE public.driver_transfer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage all transfer requests"
ON public.driver_transfer_requests FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Franchise owners manage their transfer requests"
ON public.driver_transfer_requests FOR ALL
USING (
  from_franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid())
  OR to_franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid())
);

-- 11. RLS para franchise_transfer_history
ALTER TABLE public.franchise_transfer_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins view all transfer history"
ON public.franchise_transfer_history FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- 12. RLS para loyalty_progress
ALTER TABLE public.loyalty_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own loyalty progress"
ON public.loyalty_progress FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Franchise admins can view franchise loyalty"
ON public.loyalty_progress FOR SELECT
USING (
  franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid())
);

CREATE POLICY "Super admins manage all loyalty"
ON public.loyalty_progress FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- 13. Função para bloquear franquia automaticamente
CREATE OR REPLACE FUNCTION public.check_franchise_billing_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bloquear franquias com faturas vencidas há mais de 3 dias (sem cortesia)
  UPDATE public.franchises f
  SET 
    billing_status = 'blocked',
    billing_blocked_at = now(),
    is_active = false
  WHERE f.billing_status = 'active'
    AND f.courtesy_until IS NULL OR f.courtesy_until < now()
    AND EXISTS (
      SELECT 1 FROM public.franchise_billing fb
      WHERE fb.franchise_id = f.id
        AND fb.status = 'pending'
        AND fb.due_date < CURRENT_DATE - INTERVAL '3 days'
    );
  
  -- Marcar faturas como vencidas
  UPDATE public.franchise_billing
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$;

-- 14. Função para dar cortesia a franquia
CREATE OR REPLACE FUNCTION public.grant_franchise_courtesy(
  p_franchise_id UUID,
  p_days INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RETURN json_build_object('success', false, 'error', 'Não autorizado');
  END IF;

  UPDATE public.franchises
  SET 
    courtesy_days = p_days,
    courtesy_until = now() + (p_days || ' days')::interval,
    courtesy_granted_by = auth.uid(),
    courtesy_reason = p_reason,
    billing_status = 'grace_period',
    is_active = true
  WHERE id = p_franchise_id;

  RETURN json_build_object('success', true, 'courtesy_until', now() + (p_days || ' days')::interval);
END;
$$;

-- 15. Função para transferir franquia
CREATE OR REPLACE FUNCTION public.transfer_franchise(
  p_franchise_id UUID,
  p_new_owner_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_owner_id UUID;
  v_drivers_count INTEGER;
  v_passengers_count INTEGER;
  v_merchants_count INTEGER;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RETURN json_build_object('success', false, 'error', 'Não autorizado');
  END IF;

  -- Pegar dados atuais
  SELECT owner_id INTO v_old_owner_id FROM public.franchises WHERE id = p_franchise_id;
  SELECT COUNT(*) INTO v_drivers_count FROM public.drivers WHERE franchise_id = p_franchise_id;
  SELECT COUNT(*) INTO v_passengers_count FROM public.passengers WHERE franchise_id = p_franchise_id;
  SELECT COUNT(*) INTO v_merchants_count FROM public.merchants WHERE franchise_id = p_franchise_id;

  -- Registrar histórico
  INSERT INTO public.franchise_transfer_history (
    franchise_id, from_owner_id, to_owner_id, transferred_by,
    drivers_count, passengers_count, merchants_count, notes
  ) VALUES (
    p_franchise_id, v_old_owner_id, p_new_owner_id, auth.uid(),
    v_drivers_count, v_passengers_count, v_merchants_count, p_notes
  );

  -- Transferir
  UPDATE public.franchises
  SET owner_id = p_new_owner_id, updated_at = now()
  WHERE id = p_franchise_id;

  -- Adicionar role ao novo dono se não tiver
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_new_owner_id, 'franchise_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN json_build_object(
    'success', true,
    'drivers_transferred', v_drivers_count,
    'passengers_transferred', v_passengers_count,
    'merchants_transferred', v_merchants_count
  );
END;
$$;

-- 16. Função para incrementar progresso de fidelidade
CREATE OR REPLACE FUNCTION public.increment_loyalty_progress(
  p_user_id UUID,
  p_franchise_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rides_for_free INTEGER;
  v_current_count INTEGER;
  v_earned_free BOOLEAN := false;
BEGIN
  -- Buscar configuração da franquia
  SELECT loyalty_rides_for_free INTO v_rides_for_free
  FROM public.franchises
  WHERE id = p_franchise_id AND loyalty_enabled = true;

  IF v_rides_for_free IS NULL THEN
    RETURN json_build_object('success', true, 'loyalty_enabled', false);
  END IF;

  -- Upsert progresso
  INSERT INTO public.loyalty_progress (user_id, franchise_id, rides_count)
  VALUES (p_user_id, p_franchise_id, 1)
  ON CONFLICT (user_id, franchise_id) 
  DO UPDATE SET 
    rides_count = loyalty_progress.rides_count + 1,
    updated_at = now()
  RETURNING rides_count INTO v_current_count;

  -- Verificar se ganhou corrida grátis
  IF v_current_count >= v_rides_for_free THEN
    UPDATE public.loyalty_progress
    SET 
      rides_count = 0,
      free_rides_earned = free_rides_earned + 1,
      last_free_ride_at = now()
    WHERE user_id = p_user_id AND franchise_id = p_franchise_id;
    
    v_earned_free := true;
  END IF;

  RETURN json_build_object(
    'success', true,
    'loyalty_enabled', true,
    'current_count', v_current_count,
    'rides_for_free', v_rides_for_free,
    'earned_free_ride', v_earned_free
  );
END;
$$;

-- 17. Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.franchise_billing;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_transfer_requests;