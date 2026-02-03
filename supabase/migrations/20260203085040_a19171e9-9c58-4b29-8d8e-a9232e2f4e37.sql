
-- Correções finais de políticas permissivas

-- 1. Remover políticas antigas permissivas que ainda restam
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limit_attempts;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "Authenticated users can insert analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.api_key_audit_log;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.franchise_leads;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.support_conversations;

-- 2. Política restritiva para rate_limit - somente funções SECURITY DEFINER podem usar
-- A tabela rate_limit_attempts deve ser acessada apenas via check_rate_limit()
CREATE POLICY "No direct user access to rate limits"
  ON public.rate_limit_attempts
  FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);

-- 3. Política para security_audit_log via funções apenas
CREATE POLICY "Security log via definer functions only"
  ON public.security_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- 4. Política restritiva para analytics events
CREATE POLICY "Analytics insert user validation"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 5. Política para api_key_audit_log via trigger apenas
CREATE POLICY "API audit via trigger only"
  ON public.api_key_audit_log
  FOR INSERT
  TO public
  WITH CHECK (false);

-- 6. Rate limiting para franchise_leads
CREATE POLICY "Leads with rate limiting"
  ON public.franchise_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    check_rate_limit(
      COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown'),
      'lead_insert',
      10,
      60,
      60
    )
  );

-- 7. Support conversations com validação de franquia
CREATE POLICY "Support conversations franchise validation"
  ON public.support_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );
