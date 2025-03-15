-- Tabela para armazenar o histórico de atividades de segurança
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS security_logs_user_id_idx ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS security_logs_activity_type_idx ON public.security_logs(activity_type);
CREATE INDEX IF NOT EXISTS security_logs_created_at_idx ON public.security_logs(created_at);

-- Comentários na tabela
COMMENT ON TABLE public.security_logs IS 'Armazena o histórico de atividades de segurança dos usuários';
COMMENT ON COLUMN public.security_logs.activity_type IS 'Tipo de atividade: login, logout, password_change, etc.';
COMMENT ON COLUMN public.security_logs.description IS 'Descrição detalhada da atividade';
COMMENT ON COLUMN public.security_logs.ip_address IS 'Endereço IP de onde a atividade foi realizada';
COMMENT ON COLUMN public.security_logs.user_agent IS 'User agent do navegador/dispositivo';
COMMENT ON COLUMN public.security_logs.metadata IS 'Dados adicionais específicos para cada tipo de atividade';

-- Políticas RLS para garantir que os usuários só vejam seus próprios logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas seus próprios logs de segurança"
  ON public.security_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Função para registrar atividades de segurança
CREATE OR REPLACE FUNCTION public.log_security_activity(
  activity_type VARCHAR(50),
  description TEXT,
  metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_uid UUID;
  client_ip VARCHAR(45);
  client_user_agent TEXT;
  log_id UUID;
BEGIN
  -- Obter o ID do usuário autenticado
  auth_uid := auth.uid();
  
  -- Verificar se o usuário está autenticado
  IF auth_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Obter informações do cliente
  client_ip := request.header('X-Forwarded-For');
  client_user_agent := request.header('User-Agent');
  
  -- Inserir o log
  INSERT INTO public.security_logs (
    user_id,
    activity_type,
    description,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    auth_uid,
    activity_type,
    description,
    client_ip,
    client_user_agent,
    metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Conceder acesso à função para usuários autenticados
GRANT EXECUTE ON FUNCTION public.log_security_activity(VARCHAR(50), TEXT, JSONB) TO authenticated;

-- Função para obter os logs de segurança do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_security_logs(
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  activity_type VARCHAR(50),
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ,
  metadata JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_uid UUID;
BEGIN
  -- Obter o ID do usuário autenticado
  auth_uid := auth.uid();
  
  -- Verificar se o usuário está autenticado
  IF auth_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Retornar os logs do usuário
  RETURN QUERY
  SELECT 
    l.id,
    l.activity_type,
    l.description,
    l.ip_address,
    l.user_agent,
    l.created_at,
    l.metadata
  FROM 
    public.security_logs l
  WHERE 
    l.user_id = auth_uid
  ORDER BY 
    l.created_at DESC
  LIMIT 
    limit_count
  OFFSET 
    offset_count;
END;
$$;

-- Conceder acesso à função para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_user_security_logs(INTEGER, INTEGER) TO authenticated;

-- Gatilhos para registrar automaticamente atividades de segurança

-- Gatilho para registrar alterações de senha
CREATE OR REPLACE FUNCTION public.on_auth_user_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se houve alteração de senha
  IF OLD.encrypted_password != NEW.encrypted_password THEN
    PERFORM public.log_security_activity(
      'password_change',
      'Senha alterada com sucesso',
      jsonb_build_object('email', NEW.email)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar o gatilho na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.on_auth_user_updated(); 