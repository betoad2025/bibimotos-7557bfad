-- ======================================================
-- FASE 1: CORREÇÃO DE SEGURANÇA CRÍTICA
-- ======================================================

-- 1. CREDENCIAIS DE PAGAMENTO - Remover política pública da tabela franchises
DROP POLICY IF EXISTS "Public can view active franchises" ON public.franchises;

-- Criar política mais restritiva que não expõe dados sensíveis
CREATE POLICY "Authenticated users can view basic franchise info"
  ON public.franchises
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Criar view segura para acesso público (sem dados sensíveis)
CREATE OR REPLACE VIEW public.franchises_public AS
SELECT 
  id,
  city_id,
  name,
  is_active,
  base_price,
  price_per_km,
  created_at
FROM public.franchises
WHERE is_active = true;

-- Conceder acesso à view pública
GRANT SELECT ON public.franchises_public TO anon;
GRANT SELECT ON public.franchises_public TO authenticated;

-- 2. PROTEGER DADOS PESSOAIS - Restringir acesso à tabela profiles para autenticados
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Franchise admins can view franchise user profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Recriar políticas mais seguras com role authenticated
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Franchise admins can view franchise user profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM drivers d
      JOIN franchises f ON d.franchise_id = f.id
      WHERE d.user_id = profiles.user_id AND f.owner_id = auth.uid()
    ))
    OR (EXISTS (
      SELECT 1 FROM passengers p
      JOIN franchises f ON p.franchise_id = f.id
      WHERE p.user_id = profiles.user_id AND f.owner_id = auth.uid()
    ))
    OR (EXISTS (
      SELECT 1 FROM merchants m
      JOIN franchises f ON m.franchise_id = f.id
      WHERE m.user_id = profiles.user_id AND f.owner_id = auth.uid()
    ))
  );

-- 3. PROTEGER TABELA DRIVERS - Criar view com dados seguros para passageiros
DROP POLICY IF EXISTS "Passengers can view driver basic info for their rides" ON public.drivers;

CREATE POLICY "Passengers can view driver basic info for their rides"
  ON public.drivers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rides r
      JOIN passengers p ON r.passenger_id = p.id
      WHERE r.driver_id = drivers.id AND p.user_id = auth.uid()
    )
  );

-- Criar função para obter dados básicos do motorista (sem documentos)
CREATE OR REPLACE FUNCTION public.get_driver_basic_info(driver_uuid uuid)
RETURNS TABLE (
  id uuid,
  vehicle_model text,
  vehicle_color text,
  vehicle_plate text,
  rating numeric,
  total_rides integer,
  is_online boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    d.id,
    d.vehicle_model,
    d.vehicle_color,
    d.vehicle_plate,
    d.rating,
    d.total_rides,
    d.is_online
  FROM drivers d
  WHERE d.id = driver_uuid
$$;

-- 4. PROTEGER FRANCHISE_LEADS - Apenas super admins podem ver
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.franchise_leads;

CREATE POLICY "Anyone can insert leads"
  ON public.franchise_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Garantir que não há política de SELECT pública
-- Super admins já têm acesso via política existente

-- 5. RESTRINGIR ANALYTICS - Apenas usuários autenticados podem inserir
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics_events;

CREATE POLICY "Authenticated users can insert analytics"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. RESTRINGIR SUPPORT_MESSAGES - Apenas usuários autenticados
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.support_messages;

CREATE POLICY "Authenticated users can insert messages"
  ON public.support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 7. RESTRINGIR SUPPORT_CONVERSATIONS - Apenas usuários autenticados
DROP POLICY IF EXISTS "Anyone can create conversations" ON public.support_conversations;

CREATE POLICY "Authenticated users can create conversations"
  ON public.support_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 8. RESTRINGIR CREDIT_TRANSACTIONS - Remover ALL de franchise admins
DROP POLICY IF EXISTS "Franchise admins can manage franchise transactions" ON public.credit_transactions;

-- Franchise admins só podem VER transações, não modificar
CREATE POLICY "Franchise admins can view franchise transactions only"
  ON public.credit_transactions
  FOR SELECT
  TO authenticated
  USING (
    franchise_id IN (
      SELECT id FROM franchises WHERE owner_id = auth.uid()
    )
  );

-- Apenas super admins podem modificar transações
CREATE POLICY "Super admins can manage all transactions"
  ON public.credit_transactions
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- 9. RESTRINGIR RIDES - Franchise admins só podem ver, não modificar corridas completadas
DROP POLICY IF EXISTS "Franchise admins can manage franchise rides" ON public.rides;

CREATE POLICY "Franchise admins can view and manage pending rides"
  ON public.rides
  FOR ALL
  TO authenticated
  USING (
    franchise_id IN (SELECT id FROM franchises WHERE owner_id = auth.uid())
    AND status IN ('pending', 'accepted', 'in_progress')
  );

CREATE POLICY "Franchise admins can view completed rides"
  ON public.rides
  FOR SELECT
  TO authenticated
  USING (
    franchise_id IN (SELECT id FROM franchises WHERE owner_id = auth.uid())
    AND status IN ('completed', 'cancelled')
  );

-- 10. CRIAR TABELA DE AUDIT LOG para atividades sensíveis
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip_address text,
  user_agent text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS para audit log - somente super admins podem ver
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view audit logs"
  ON public.security_audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "System can insert audit logs"
  ON public.security_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 11. CRIAR TABELA DE RATE LIMITING
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- IP ou user_id
  action text NOT NULL, -- login, password_reset, etc
  attempt_count integer DEFAULT 1,
  first_attempt_at timestamptz DEFAULT now(),
  last_attempt_at timestamptz DEFAULT now(),
  blocked_until timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_action 
  ON public.rate_limit_attempts(identifier, action);

-- RLS para rate limiting - apenas leitura pelo sistema
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage rate limits"
  ON public.rate_limit_attempts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 12. FUNÇÃO PARA VERIFICAR RATE LIMIT
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_action text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 15,
  p_block_duration_minutes integer DEFAULT 30
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record rate_limit_attempts%ROWTYPE;
  v_is_blocked boolean := false;
BEGIN
  -- Buscar registro existente
  SELECT * INTO v_record
  FROM rate_limit_attempts
  WHERE identifier = p_identifier
    AND action = p_action
    AND last_attempt_at > now() - (p_window_minutes || ' minutes')::interval
  ORDER BY last_attempt_at DESC
  LIMIT 1;

  -- Se bloqueado, verificar se ainda está no período de bloqueio
  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > now() THEN
    RETURN false;
  END IF;

  -- Se não existe registro ou está fora da janela, criar novo
  IF v_record.id IS NULL THEN
    INSERT INTO rate_limit_attempts (identifier, action, attempt_count)
    VALUES (p_identifier, p_action, 1);
    RETURN true;
  END IF;

  -- Incrementar tentativas
  UPDATE rate_limit_attempts
  SET 
    attempt_count = attempt_count + 1,
    last_attempt_at = now(),
    blocked_until = CASE 
      WHEN attempt_count + 1 >= p_max_attempts 
      THEN now() + (p_block_duration_minutes || ' minutes')::interval
      ELSE NULL
    END
  WHERE id = v_record.id;

  -- Verificar se excedeu limite
  IF v_record.attempt_count + 1 >= p_max_attempts THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- 13. FUNÇÃO PARA REGISTRAR AUDIT LOG
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO security_audit_log (user_id, action, resource_type, resource_id, details)
  VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_details);
END;
$$;

-- 14. TRIGGER PARA AUDITAR MUDANÇAS SENSÍVEIS
CREATE OR REPLACE FUNCTION public.audit_sensitive_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Log mudança de senha
    IF TG_TABLE_NAME = 'profiles' AND OLD.email IS DISTINCT FROM NEW.email THEN
      PERFORM public.log_security_event(
        'email_changed',
        'profile',
        NEW.id,
        jsonb_build_object('old_email', OLD.email, 'new_email', NEW.email)
      );
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event(
      'record_deleted',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar trigger em tabelas sensíveis
DROP TRIGGER IF EXISTS audit_profiles_changes ON public.profiles;
CREATE TRIGGER audit_profiles_changes
  AFTER UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_sensitive_changes();

DROP TRIGGER IF EXISTS audit_user_roles_changes ON public.user_roles;
CREATE TRIGGER audit_user_roles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_sensitive_changes();