-- =============================================================
-- MEGA MIGRAÇÃO: Funcionalidades de Plataformas Grandes
-- =============================================================

-- 1. SISTEMA DE COMPARTILHAMENTO DE VIAGEM
-- Permitir que passageiros compartilhem link para familiares acompanharem
CREATE TABLE public.ride_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
    share_token VARCHAR(64) UNIQUE NOT NULL,
    shared_by UUID REFERENCES auth.users(id) NOT NULL,
    recipient_name VARCHAR(100),
    recipient_phone VARCHAR(20),
    recipient_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_ride_shares_token ON public.ride_shares(share_token);
CREATE INDEX idx_ride_shares_ride ON public.ride_shares(ride_id);

-- 2. SISTEMA DE CUPONS E PROMOÇÕES (expandindo tabela existente)
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS first_ride_only BOOLEAN DEFAULT false;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS new_users_only BOOLEAN DEFAULT false;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS max_discount_value NUMERIC(10,2);

-- Tabela de uso de cupons por usuário
CREATE TABLE public.coupon_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID REFERENCES public.promotions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    ride_id UUID REFERENCES public.rides(id),
    discount_applied NUMERIC(10,2) NOT NULL,
    used_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(promotion_id, user_id, ride_id)
);

CREATE INDEX idx_coupon_usages_user ON public.coupon_usages(user_id);

-- 3. PROGRAMA DE INDICAÇÃO (REFERRAL)
CREATE TABLE public.referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    code VARCHAR(20) UNIQUE NOT NULL,
    referral_bonus NUMERIC(10,2) DEFAULT 5.00,
    referee_bonus NUMERIC(10,2) DEFAULT 5.00,
    total_referrals INTEGER DEFAULT 0,
    total_earned NUMERIC(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID REFERENCES auth.users(id) NOT NULL,
    referee_user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    referral_code_id UUID REFERENCES public.referral_codes(id) NOT NULL,
    referrer_bonus_paid NUMERIC(10,2),
    referee_bonus_paid NUMERIC(10,2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'first_ride_completed', 'bonus_paid', 'expired')),
    first_ride_at TIMESTAMPTZ,
    bonus_paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_user_id);
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);

-- 4. SISTEMA DE GORJETAS
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS tip_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS tip_paid_at TIMESTAMPTZ;

CREATE TABLE public.tip_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
    passenger_id UUID REFERENCES public.passengers(id) NOT NULL,
    driver_id UUID REFERENCES public.drivers(id) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    franchise_id UUID REFERENCES public.franchises(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. SELFIE DE VERIFICAÇÃO DO MOTORISTA
CREATE TABLE public.driver_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
    verification_type VARCHAR(30) NOT NULL CHECK (verification_type IN ('selfie_daily', 'selfie_with_helmet', 'document_check')),
    photo_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_driver_verifications_driver ON public.driver_verifications(driver_id);
CREATE INDEX idx_driver_verifications_status ON public.driver_verifications(status);

-- Campo para última verificação no driver
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS last_verification_at TIMESTAMPTZ;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS requires_verification BOOLEAN DEFAULT false;

-- 6. MAPEAMENTO DE ÁREAS DE RISCO
CREATE TABLE public.risk_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    polygon_coords JSONB NOT NULL, -- Array de coordenadas [{lat, lng}]
    center_lat NUMERIC(10,7),
    center_lng NUMERIC(10,7),
    radius_meters INTEGER,
    is_blocked BOOLEAN DEFAULT false, -- Se true, bloqueia corridas nessa área
    block_reason TEXT,
    incidents_count INTEGER DEFAULT 0,
    last_incident_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_risk_zones_franchise ON public.risk_zones(franchise_id);
CREATE INDEX idx_risk_zones_level ON public.risk_zones(risk_level);

-- Incidentes em áreas de risco
CREATE TABLE public.risk_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES public.risk_zones(id) ON DELETE SET NULL,
    franchise_id UUID REFERENCES public.franchises(id) NOT NULL,
    ride_id UUID REFERENCES public.rides(id),
    incident_type VARCHAR(50) NOT NULL,
    description TEXT,
    lat NUMERIC(10,7) NOT NULL,
    lng NUMERIC(10,7) NOT NULL,
    reported_by UUID REFERENCES auth.users(id) NOT NULL,
    reporter_type VARCHAR(20) NOT NULL CHECK (reporter_type IN ('driver', 'passenger', 'admin', 'system')),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'confirmed', 'resolved', 'dismissed')),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_risk_incidents_franchise ON public.risk_incidents(franchise_id);
CREATE INDEX idx_risk_incidents_zone ON public.risk_incidents(zone_id);

-- 7. BÔNUS POR DEMANDA (expandindo surge pricing)
CREATE TABLE public.demand_bonuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    bonus_type VARCHAR(20) NOT NULL CHECK (bonus_type IN ('fixed', 'percentage', 'per_ride')),
    bonus_value NUMERIC(10,2) NOT NULL,
    min_rides_required INTEGER DEFAULT 1,
    start_time TIME,
    end_time TIME,
    days_of_week TEXT[], -- ['monday', 'tuesday', etc]
    zone_lat NUMERIC(10,7),
    zone_lng NUMERIC(10,7),
    zone_radius_km NUMERIC(5,2),
    max_claims INTEGER,
    current_claims INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.demand_bonus_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bonus_id UUID REFERENCES public.demand_bonuses(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.drivers(id) NOT NULL,
    rides_completed INTEGER DEFAULT 0,
    bonus_earned NUMERIC(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paid', 'expired')),
    completed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. CLUBE DE VANTAGENS (ASSINATURA)
CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE,
    is_global BOOLEAN DEFAULT false,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    billing_period VARCHAR(20) NOT NULL CHECK (billing_period IN ('weekly', 'monthly', 'yearly')),
    discount_percentage INTEGER DEFAULT 0,
    priority_matching BOOLEAN DEFAULT false,
    free_cancellations INTEGER DEFAULT 0,
    exclusive_promotions BOOLEAN DEFAULT false,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
    franchise_id UUID REFERENCES public.franchises(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
    started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    payment_method VARCHAR(50),
    last_payment_at TIMESTAMPTZ,
    next_payment_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);

-- 9. EXTRATOS FINANCEIROS (relatórios)
CREATE TABLE public.driver_financial_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
    franchise_id UUID REFERENCES public.franchises(id) NOT NULL,
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_rides INTEGER DEFAULT 0,
    total_earnings NUMERIC(10,2) DEFAULT 0,
    total_tips NUMERIC(10,2) DEFAULT 0,
    total_bonuses NUMERIC(10,2) DEFAULT 0,
    total_credits_used NUMERIC(10,2) DEFAULT 0,
    net_earnings NUMERIC(10,2) DEFAULT 0,
    average_rating NUMERIC(3,2),
    cancellation_rate NUMERIC(5,2),
    online_hours NUMERIC(6,2),
    peak_hours_worked NUMERIC(6,2),
    breakdown JSONB,
    generated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(driver_id, report_type, period_start)
);

CREATE INDEX idx_driver_reports_driver ON public.driver_financial_reports(driver_id);
CREATE INDEX idx_driver_reports_period ON public.driver_financial_reports(period_start, period_end);

-- 10. WALLET/CARTEIRA DE CRÉDITOS PARA USUÁRIOS (bônus de indicação, etc)
CREATE TABLE public.user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance NUMERIC(10,2) DEFAULT 0,
    total_earned NUMERIC(10,2) DEFAULT 0,
    total_spent NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.user_wallets(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('referral_bonus', 'promotional_credit', 'ride_payment', 'refund', 'subscription', 'tip_refund')),
    description TEXT,
    reference_id UUID, -- ride_id, referral_id, etc
    reference_type VARCHAR(30),
    balance_after NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_wallet_transactions_wallet ON public.wallet_transactions(wallet_id);

-- =============================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================

-- Ride Shares
ALTER TABLE public.ride_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their shared rides"
ON public.ride_shares FOR SELECT
USING (
    shared_by = auth.uid() OR
    EXISTS (SELECT 1 FROM rides r WHERE r.id = ride_id AND r.passenger_id IN (
        SELECT id FROM passengers WHERE user_id = auth.uid()
    ))
);

CREATE POLICY "Users can create ride shares"
ON public.ride_shares FOR INSERT
WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Public can view active shares by token"
ON public.ride_shares FOR SELECT
USING (is_active = true AND expires_at > now());

-- Coupon Usages
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coupon usages"
ON public.coupon_usages FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can insert coupon usages"
ON public.coupon_usages FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Referral Codes
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral code"
ON public.referral_codes FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Anyone can view active codes"
ON public.referral_codes FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can create own referral code"
ON public.referral_codes FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
ON public.referrals FOR SELECT
USING (referrer_user_id = auth.uid() OR referee_user_id = auth.uid());

-- Tip Transactions
ALTER TABLE public.tip_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Franchise admins and super admins can view tips"
ON public.tip_transactions FOR SELECT
USING (
    public.has_role(auth.uid(), 'super_admin') OR
    franchise_id IN (SELECT id FROM franchises WHERE owner_id = auth.uid())
);

CREATE POLICY "Drivers can view own tips"
ON public.tip_transactions FOR SELECT
USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- Driver Verifications
ALTER TABLE public.driver_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view own verifications"
ON public.driver_verifications FOR SELECT
USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can create verifications"
ON public.driver_verifications FOR INSERT
WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage verifications"
ON public.driver_verifications FOR ALL
USING (
    public.has_role(auth.uid(), 'super_admin') OR
    EXISTS (
        SELECT 1 FROM drivers d
        JOIN franchises f ON d.franchise_id = f.id
        WHERE d.id = driver_id AND f.owner_id = auth.uid()
    )
);

-- Risk Zones
ALTER TABLE public.risk_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view risk zones"
ON public.risk_zones FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage risk zones"
ON public.risk_zones FOR ALL
USING (
    public.has_role(auth.uid(), 'super_admin') OR
    franchise_id IN (SELECT id FROM franchises WHERE owner_id = auth.uid())
);

-- Risk Incidents
ALTER TABLE public.risk_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can report incidents"
ON public.risk_incidents FOR INSERT
TO authenticated
WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Admins can view incidents"
ON public.risk_incidents FOR SELECT
USING (
    public.has_role(auth.uid(), 'super_admin') OR
    franchise_id IN (SELECT id FROM franchises WHERE owner_id = auth.uid()) OR
    reported_by = auth.uid()
);

-- Demand Bonuses
ALTER TABLE public.demand_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view active bonuses"
ON public.demand_bonuses FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage bonuses"
ON public.demand_bonuses FOR ALL
USING (
    public.has_role(auth.uid(), 'super_admin') OR
    franchise_id IN (SELECT id FROM franchises WHERE owner_id = auth.uid())
);

-- Demand Bonus Claims
ALTER TABLE public.demand_bonus_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view own claims"
ON public.demand_bonus_claims FOR SELECT
USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can create claims"
ON public.demand_bonus_claims FOR INSERT
WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- Subscription Plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage plans"
ON public.subscription_plans FOR ALL
USING (
    public.has_role(auth.uid(), 'super_admin') OR
    franchise_id IN (SELECT id FROM franchises WHERE owner_id = auth.uid())
);

-- User Subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
ON public.user_subscriptions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create subscriptions"
ON public.user_subscriptions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions"
ON public.user_subscriptions FOR UPDATE
USING (user_id = auth.uid());

-- Driver Financial Reports
ALTER TABLE public.driver_financial_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view own reports"
ON public.driver_financial_reports FOR SELECT
USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view franchise reports"
ON public.driver_financial_reports FOR SELECT
USING (
    public.has_role(auth.uid(), 'super_admin') OR
    franchise_id IN (SELECT id FROM franchises WHERE owner_id = auth.uid())
);

-- User Wallets
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
ON public.user_wallets FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own wallet"
ON public.user_wallets FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Wallet Transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
ON public.wallet_transactions FOR SELECT
USING (wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid()));

-- =============================================================
-- FUNCTIONS
-- =============================================================

-- Função para gerar código de indicação único
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_code VARCHAR(10);
    code_exists BOOLEAN;
BEGIN
    LOOP
        new_code := upper(substring(md5(random()::text) from 1 for 8));
        SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    INSERT INTO referral_codes (user_id, code)
    VALUES (NEW.user_id, new_code)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Trigger para criar código de indicação quando passageiro é criado
CREATE TRIGGER create_referral_code_on_passenger
    AFTER INSERT ON public.passengers
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_referral_code();

-- Função para criar wallet quando usuário é criado
CREATE OR REPLACE FUNCTION public.create_user_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO user_wallets (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Trigger para criar wallet
CREATE TRIGGER create_wallet_on_profile
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_wallet();

-- Função para aplicar bônus de indicação
CREATE OR REPLACE FUNCTION public.process_referral_bonus(p_referee_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referral referrals%ROWTYPE;
    v_code referral_codes%ROWTYPE;
BEGIN
    -- Buscar referral pendente
    SELECT * INTO v_referral
    FROM referrals
    WHERE referee_user_id = p_referee_user_id
    AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Nenhuma indicação pendente');
    END IF;
    
    -- Buscar código
    SELECT * INTO v_code FROM referral_codes WHERE id = v_referral.referral_code_id;
    
    -- Atualizar status
    UPDATE referrals
    SET status = 'first_ride_completed', first_ride_at = now()
    WHERE id = v_referral.id;
    
    -- Creditar bônus para quem indicou
    UPDATE user_wallets
    SET balance = balance + v_code.referral_bonus,
        total_earned = total_earned + v_code.referral_bonus
    WHERE user_id = v_referral.referrer_user_id;
    
    -- Creditar bônus para quem foi indicado
    UPDATE user_wallets
    SET balance = balance + v_code.referee_bonus,
        total_earned = total_earned + v_code.referee_bonus
    WHERE user_id = p_referee_user_id;
    
    -- Atualizar estatísticas do código
    UPDATE referral_codes
    SET total_referrals = total_referrals + 1,
        total_earned = total_earned + v_code.referral_bonus
    WHERE id = v_code.id;
    
    -- Marcar bônus como pago
    UPDATE referrals
    SET status = 'bonus_paid',
        referrer_bonus_paid = v_code.referral_bonus,
        referee_bonus_paid = v_code.referee_bonus,
        bonus_paid_at = now()
    WHERE id = v_referral.id;
    
    RETURN json_build_object(
        'success', true,
        'referrer_bonus', v_code.referral_bonus,
        'referee_bonus', v_code.referee_bonus
    );
END;
$$;

-- Função para gerar token de compartilhamento
CREATE OR REPLACE FUNCTION public.create_ride_share(p_ride_id UUID, p_recipient_name TEXT DEFAULT NULL, p_recipient_phone TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_token VARCHAR(64);
    v_share_id UUID;
BEGIN
    v_token := encode(gen_random_bytes(32), 'hex');
    
    INSERT INTO ride_shares (ride_id, share_token, shared_by, recipient_name, recipient_phone, expires_at)
    VALUES (p_ride_id, v_token, auth.uid(), p_recipient_name, p_recipient_phone, now() + interval '24 hours')
    RETURNING id INTO v_share_id;
    
    RETURN json_build_object(
        'success', true,
        'share_id', v_share_id,
        'token', v_token
    );
END;
$$;

-- Enable realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.risk_zones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.risk_incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.demand_bonuses;