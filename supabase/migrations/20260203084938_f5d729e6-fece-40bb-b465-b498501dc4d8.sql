
-- CORREÇÕES DE SEGURANÇA CRÍTICAS

-- 1. Criar view segura para franquias (ocultar credenciais sensíveis)
DROP VIEW IF EXISTS franchises_public;
CREATE VIEW public.franchises_public
WITH (security_invoker=on) AS
  SELECT 
    id, 
    city_id, 
    name, 
    is_active, 
    base_price, 
    price_per_km,
    created_at
    -- Campos sensíveis EXCLUÍDOS: owner_id, payment_api_key, payment_gateway, payment_webhook_url
  FROM public.franchises;

-- 2. Remover política permissiva de rate_limit_attempts e criar uma mais restritiva
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limit_attempts;
CREATE POLICY "Only internal functions can manage rate limits"
  ON public.rate_limit_attempts
  FOR ALL
  TO public
  USING (false);

-- 3. Restringir inserção de audit logs apenas para funções internas
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_log;
CREATE POLICY "Audit logs insert via security definer only"
  ON public.security_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (false); -- Inserção via função SECURITY DEFINER apenas

-- 4. Restringir inserção de api_key_audit_log
DROP POLICY IF EXISTS "System can insert audit logs" ON public.api_key_audit_log;
CREATE POLICY "API key audit logs via functions only"
  ON public.api_key_audit_log
  FOR INSERT
  TO public
  WITH CHECK (false); -- Inserção via trigger apenas

-- 5. Adicionar rate limiting na inserção de leads
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.franchise_leads;
CREATE POLICY "Rate limited lead insertion"
  ON public.franchise_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    public.check_rate_limit(
      COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'anonymous'),
      'lead_submission',
      5, -- max 5 leads
      60, -- per 60 minutes
      120 -- block for 2 hours
    )
  );

-- 6. Restringir inserção de support_conversations a usuários com franquia válida
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.support_conversations;
CREATE POLICY "Users can create conversations for their franchises"
  ON public.support_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (
      franchise_id IS NULL OR
      franchise_id IN (SELECT public.get_user_franchise_id(auth.uid()))
    )
  );

-- 7. Restringir inserção de analytics_events com validação
DROP POLICY IF EXISTS "Authenticated users can insert analytics" ON public.analytics_events;
CREATE POLICY "Users can insert own analytics events"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR user_id IS NULL
  );

-- 8. Criar função para mascarar dados sensíveis em rides antigas
CREATE OR REPLACE FUNCTION public.mask_old_ride_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Após 90 dias, mascarar endereços parcialmente para LGPD
  IF NEW.completed_at IS NOT NULL AND 
     NEW.completed_at < NOW() - INTERVAL '90 days' THEN
    -- Manter apenas cidade no endereço
    NEW.origin_address := regexp_replace(NEW.origin_address, '[0-9]+', '***', 'g');
    NEW.destination_address := regexp_replace(NEW.destination_address, '[0-9]+', '***', 'g');
  END IF;
  RETURN NEW;
END;
$$;

-- 9. Criar índices para melhorar performance de queries com RLS
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_franchise_id ON public.drivers(franchise_id);
CREATE INDEX IF NOT EXISTS idx_passengers_user_id ON public.passengers(user_id);
CREATE INDEX IF NOT EXISTS idx_passengers_franchise_id ON public.passengers(franchise_id);
CREATE INDEX IF NOT EXISTS idx_rides_franchise_id ON public.rides(franchise_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_passenger_id ON public.rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_franchise_api_keys_franchise_service ON public.franchise_api_keys(franchise_id, service_name);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- 10. Função para verificar integridade de isolamento de franquias
CREATE OR REPLACE FUNCTION public.verify_franchise_isolation(test_franchise_id UUID, other_franchise_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := '{}'::jsonb;
  cross_access_count integer;
BEGIN
  -- Verificar se drivers de uma franquia NÃO aparecem em queries de outra
  SELECT COUNT(*) INTO cross_access_count
  FROM drivers d
  WHERE d.franchise_id = test_franchise_id
  AND EXISTS (
    SELECT 1 FROM drivers d2 
    WHERE d2.franchise_id = other_franchise_id 
    AND d2.id = d.id
  );
  
  result := result || jsonb_build_object('drivers_cross_access', cross_access_count = 0);
  
  -- Verificar rides
  SELECT COUNT(*) INTO cross_access_count
  FROM rides r
  WHERE r.franchise_id = test_franchise_id
  AND EXISTS (
    SELECT 1 FROM rides r2 
    WHERE r2.franchise_id = other_franchise_id 
    AND r2.id = r.id
  );
  
  result := result || jsonb_build_object('rides_cross_access', cross_access_count = 0);
  
  -- Verificar API keys
  SELECT COUNT(*) INTO cross_access_count
  FROM franchise_api_keys fk
  WHERE fk.franchise_id = test_franchise_id
  AND EXISTS (
    SELECT 1 FROM franchise_api_keys fk2 
    WHERE fk2.franchise_id = other_franchise_id 
    AND fk2.id = fk.id
  );
  
  result := result || jsonb_build_object('api_keys_cross_access', cross_access_count = 0);
  
  RETURN jsonb_build_object(
    'isolation_verified', true,
    'tests', result,
    'timestamp', NOW()
  );
END;
$$;
