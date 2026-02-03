-- Tabela para chaves de API por franquia (criptografadas)
CREATE TABLE public.franchise_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL, -- 'asaas', 'woovi', 'openai', 'anthropic', 'comtele', 'resend'
  api_key_encrypted TEXT NOT NULL, -- chave criptografada
  api_secret_encrypted TEXT, -- secret adicional se necessário
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_validated BOOLEAN NOT NULL DEFAULT false,
  validated_at TIMESTAMPTZ,
  environment TEXT NOT NULL DEFAULT 'production', -- 'sandbox', 'production'
  metadata JSONB DEFAULT '{}', -- configurações extras do serviço
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(franchise_id, service_name, environment)
);

-- Tabela para configurações padrão do Super Admin
CREATE TABLE public.default_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL UNIQUE,
  api_key_encrypted TEXT NOT NULL,
  api_secret_encrypted TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  environment TEXT NOT NULL DEFAULT 'production',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para histórico de mudanças de configuração
CREATE TABLE public.api_key_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'validated', 'invalidated'
  performed_by UUID REFERENCES auth.users(id),
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para franchise_api_keys
ALTER TABLE public.franchise_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Franchise owners can view own keys"
ON public.franchise_api_keys FOR SELECT
USING (franchise_id IN (SELECT id FROM franchises WHERE owner_id = auth.uid()));

CREATE POLICY "Franchise owners can insert own keys"
ON public.franchise_api_keys FOR INSERT
WITH CHECK (franchise_id IN (SELECT id FROM franchises WHERE owner_id = auth.uid()));

CREATE POLICY "Franchise owners can update own keys"
ON public.franchise_api_keys FOR UPDATE
USING (franchise_id IN (SELECT id FROM franchises WHERE owner_id = auth.uid()));

CREATE POLICY "Franchise owners can delete own keys"
ON public.franchise_api_keys FOR DELETE
USING (franchise_id IN (SELECT id FROM franchises WHERE owner_id = auth.uid()));

CREATE POLICY "Super admins can manage all keys"
ON public.franchise_api_keys FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS para default_api_keys (somente Super Admin)
ALTER TABLE public.default_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage default keys"
ON public.default_api_keys FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS para api_key_audit_log
ALTER TABLE public.api_key_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Franchise owners can view own audit logs"
ON public.api_key_audit_log FOR SELECT
USING (
  franchise_id IN (SELECT id FROM franchises WHERE owner_id = auth.uid())
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "System can insert audit logs"
ON public.api_key_audit_log FOR INSERT
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_franchise_api_keys_updated_at
BEFORE UPDATE ON public.franchise_api_keys
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_default_api_keys_updated_at
BEFORE UPDATE ON public.default_api_keys
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Função para obter chave de API (com fallback para default)
CREATE OR REPLACE FUNCTION public.get_api_key(
  p_franchise_id UUID,
  p_service_name TEXT,
  p_environment TEXT DEFAULT 'production'
)
RETURNS TABLE(
  api_key TEXT,
  api_secret TEXT,
  is_franchise_key BOOLEAN,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Primeiro tenta buscar chave da franquia
  RETURN QUERY
  SELECT 
    fak.api_key_encrypted,
    fak.api_secret_encrypted,
    true::boolean,
    fak.metadata
  FROM franchise_api_keys fak
  WHERE fak.franchise_id = p_franchise_id
    AND fak.service_name = p_service_name
    AND fak.environment = p_environment
    AND fak.is_active = true;
  
  -- Se não encontrou, retorna a chave padrão
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      dak.api_key_encrypted,
      dak.api_secret_encrypted,
      false::boolean,
      dak.metadata
    FROM default_api_keys dak
    WHERE dak.service_name = p_service_name
      AND dak.environment = p_environment
      AND dak.is_active = true;
  END IF;
END;
$$;

-- Função para registrar auditoria de chaves
CREATE OR REPLACE FUNCTION public.log_api_key_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO api_key_audit_log (franchise_id, service_name, action, performed_by, new_values)
    VALUES (NEW.franchise_id, NEW.service_name, 'created', auth.uid(), 
      jsonb_build_object('service', NEW.service_name, 'environment', NEW.environment, 'is_active', NEW.is_active));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO api_key_audit_log (franchise_id, service_name, action, performed_by, old_values, new_values)
    VALUES (NEW.franchise_id, NEW.service_name, 'updated', auth.uid(),
      jsonb_build_object('is_active', OLD.is_active, 'environment', OLD.environment),
      jsonb_build_object('is_active', NEW.is_active, 'environment', NEW.environment));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO api_key_audit_log (franchise_id, service_name, action, performed_by, old_values)
    VALUES (OLD.franchise_id, OLD.service_name, 'deleted', auth.uid(),
      jsonb_build_object('service', OLD.service_name, 'environment', OLD.environment));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_franchise_api_keys
AFTER INSERT OR UPDATE OR DELETE ON public.franchise_api_keys
FOR EACH ROW EXECUTE FUNCTION public.log_api_key_change();