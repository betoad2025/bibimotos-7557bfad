-- =============================================
-- TABELA DE MARKETING PIXELS POR FRANQUIA
-- =============================================
CREATE TABLE IF NOT EXISTS public.franchise_marketing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  
  -- Google Ads
  google_ads_id TEXT,
  google_ads_conversion_id TEXT,
  google_analytics_id TEXT,
  
  -- Facebook/Meta
  facebook_pixel_id TEXT,
  facebook_access_token TEXT,
  
  -- TikTok
  tiktok_pixel_id TEXT,
  
  -- Instagram (geralmente usa o mesmo do Facebook)
  instagram_business_id TEXT,
  
  -- Outros
  custom_pixels JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(franchise_id)
);

-- Enable RLS
ALTER TABLE public.franchise_marketing ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Franchise owners can view own marketing settings"
  ON public.franchise_marketing FOR SELECT
  USING (franchise_id IN (
    SELECT id FROM public.franchises WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Franchise owners can update own marketing settings"
  ON public.franchise_marketing FOR UPDATE
  USING (franchise_id IN (
    SELECT id FROM public.franchises WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Franchise owners can insert own marketing settings"
  ON public.franchise_marketing FOR INSERT
  WITH CHECK (franchise_id IN (
    SELECT id FROM public.franchises WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Super admins can manage all marketing settings"
  ON public.franchise_marketing FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- =============================================
-- TABELA DE CRÉDITOS DE FRANQUIA (separado dos motoristas)
-- =============================================
CREATE TABLE IF NOT EXISTS public.franchise_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  
  balance NUMERIC NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(franchise_id)
);

-- Enable RLS
ALTER TABLE public.franchise_credits ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Franchise owners can view own credits"
  ON public.franchise_credits FOR SELECT
  USING (franchise_id IN (
    SELECT id FROM public.franchises WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Super admins can manage all credits"
  ON public.franchise_credits FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- =============================================
-- TABELA DE TRANSAÇÕES DE CRÉDITOS DE FRANQUIA
-- =============================================
CREATE TABLE IF NOT EXISTS public.franchise_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL, -- 'recharge', 'monthly_fee', 'bonus', 'adjustment'
  description TEXT,
  
  -- Payment info
  payment_id TEXT,
  payment_method TEXT, -- 'pix', 'credit_card', 'manual'
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  
  -- Metadata
  processed_by UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.franchise_credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Franchise owners can view own transactions"
  ON public.franchise_credit_transactions FOR SELECT
  USING (franchise_id IN (
    SELECT id FROM public.franchises WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Super admins can manage all transactions"
  ON public.franchise_credit_transactions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- =============================================
-- FUNÇÃO: AUTO-CRIAR ESTRUTURA PARA NOVA FRANQUIA
-- =============================================
CREATE OR REPLACE FUNCTION public.setup_new_franchise()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar registro de marketing
  INSERT INTO public.franchise_marketing (franchise_id)
  VALUES (NEW.id)
  ON CONFLICT (franchise_id) DO NOTHING;
  
  -- Criar registro de créditos
  INSERT INTO public.franchise_credits (franchise_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (franchise_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para auto-criação
DROP TRIGGER IF EXISTS on_franchise_created ON public.franchises;
CREATE TRIGGER on_franchise_created
  AFTER INSERT ON public.franchises
  FOR EACH ROW
  EXECUTE FUNCTION public.setup_new_franchise();

-- =============================================
-- FUNÇÃO: PROCESSAR RECARGA DE CRÉDITOS (chamada pelo webhook)
-- =============================================
CREATE OR REPLACE FUNCTION public.process_franchise_credit_recharge(
  p_franchise_id UUID,
  p_amount NUMERIC,
  p_payment_id TEXT,
  p_payment_method TEXT DEFAULT 'pix'
)
RETURNS JSON AS $$
DECLARE
  v_transaction_id UUID;
  v_new_balance NUMERIC;
BEGIN
  -- Verificar se franquia existe
  IF NOT EXISTS (SELECT 1 FROM public.franchises WHERE id = p_franchise_id) THEN
    RETURN json_build_object('success', false, 'error', 'Franquia não encontrada');
  END IF;
  
  -- Criar transação
  INSERT INTO public.franchise_credit_transactions (
    franchise_id, amount, type, description, payment_id, payment_method, payment_status
  ) VALUES (
    p_franchise_id, p_amount, 'recharge', 'Recarga via ' || p_payment_method,
    p_payment_id, p_payment_method, 'completed'
  )
  RETURNING id INTO v_transaction_id;
  
  -- Atualizar saldo
  UPDATE public.franchise_credits
  SET balance = balance + p_amount, updated_at = now()
  WHERE franchise_id = p_franchise_id
  RETURNING balance INTO v_new_balance;
  
  -- Se não existir, criar
  IF v_new_balance IS NULL THEN
    INSERT INTO public.franchise_credits (franchise_id, balance)
    VALUES (p_franchise_id, p_amount)
    RETURNING balance INTO v_new_balance;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- FUNÇÃO: DEDUZIR CRÉDITO POR CORRIDA
-- =============================================
CREATE OR REPLACE FUNCTION public.deduct_franchise_credit(
  p_franchise_id UUID,
  p_amount NUMERIC,
  p_ride_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT 'Débito de corrida'
)
RETURNS JSON AS $$
DECLARE
  v_current_balance NUMERIC;
  v_transaction_id UUID;
BEGIN
  -- Verificar saldo atual
  SELECT balance INTO v_current_balance
  FROM public.franchise_credits
  WHERE franchise_id = p_franchise_id;
  
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Saldo insuficiente');
  END IF;
  
  -- Criar transação de débito
  INSERT INTO public.franchise_credit_transactions (
    franchise_id, amount, type, description, payment_status
  ) VALUES (
    p_franchise_id, -p_amount, 'debit', p_description, 'completed'
  )
  RETURNING id INTO v_transaction_id;
  
  -- Atualizar saldo
  UPDATE public.franchise_credits
  SET balance = balance - p_amount, updated_at = now()
  WHERE franchise_id = p_franchise_id;
  
  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_current_balance - p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_franchise_credit_transactions_franchise 
  ON public.franchise_credit_transactions(franchise_id);
CREATE INDEX IF NOT EXISTS idx_franchise_credit_transactions_created 
  ON public.franchise_credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_franchise_marketing_franchise 
  ON public.franchise_marketing(franchise_id);

-- =============================================
-- CONFIGURAR EXISTENTES (backfill)
-- =============================================
INSERT INTO public.franchise_marketing (franchise_id)
SELECT id FROM public.franchises
WHERE NOT EXISTS (
  SELECT 1 FROM public.franchise_marketing fm WHERE fm.franchise_id = franchises.id
);

INSERT INTO public.franchise_credits (franchise_id, balance)
SELECT id, 0 FROM public.franchises
WHERE NOT EXISTS (
  SELECT 1 FROM public.franchise_credits fc WHERE fc.franchise_id = franchises.id
);