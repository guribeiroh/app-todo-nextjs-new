-- Função para obter todas as sessões ativas do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_sessions()
RETURNS TABLE (
  id text,
  created_at timestamptz,
  user_agent text,
  ip text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_uid uuid;
BEGIN
  -- Obter o ID do usuário autenticado
  auth_uid := auth.uid();
  
  -- Verificar se o usuário está autenticado
  IF auth_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Retornar todas as sessões ativas do usuário
  RETURN QUERY
  SELECT 
    s.id::text,
    s.created_at,
    s.user_agent,
    s.ip::text
  FROM 
    auth.sessions s
  WHERE 
    s.user_id = auth_uid
  ORDER BY 
    s.created_at DESC;
END;
$$;

-- Conceder acesso à função para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_user_sessions() TO authenticated;

-- Função para encerrar uma sessão específica
CREATE OR REPLACE FUNCTION public.terminate_session(session_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_uid uuid;
BEGIN
  -- Obter o ID do usuário autenticado
  auth_uid := auth.uid();
  
  -- Verificar se o usuário está autenticado
  IF auth_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Verificar se a sessão pertence ao usuário atual
  IF NOT EXISTS (
    SELECT 1 FROM auth.sessions 
    WHERE id = session_id::uuid AND user_id = auth_uid
  ) THEN
    RAISE EXCEPTION 'Sessão não encontrada ou não pertence ao usuário atual';
  END IF;
  
  -- Encerrar a sessão
  DELETE FROM auth.sessions 
  WHERE id = session_id::uuid AND user_id = auth_uid;
END;
$$;

-- Conceder acesso à função para usuários autenticados
GRANT EXECUTE ON FUNCTION public.terminate_session(text) TO authenticated;

-- Função para encerrar todas as sessões exceto a atual
CREATE OR REPLACE FUNCTION public.terminate_all_sessions_except_current()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_uid uuid;
  current_session_id uuid;
BEGIN
  -- Obter o ID do usuário autenticado e a sessão atual
  auth_uid := auth.uid();
  current_session_id := auth.jwt() ->> 'session_id';
  
  -- Verificar se o usuário está autenticado
  IF auth_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Encerrar todas as sessões exceto a atual
  DELETE FROM auth.sessions 
  WHERE user_id = auth_uid AND id != current_session_id;
END;
$$;

-- Conceder acesso à função para usuários autenticados
GRANT EXECUTE ON FUNCTION public.terminate_all_sessions_except_current() TO authenticated;

-- Comentários sobre segurança:
-- 
-- Estas funções são marcadas como SECURITY DEFINER, o que significa que elas
-- são executadas com os privilégios do usuário que as criou (geralmente um superusuário).
-- Isso é necessário para acessar as tabelas do esquema auth, que normalmente não são
-- acessíveis aos usuários comuns.
--
-- O parâmetro SET search_path = public é uma medida de segurança para evitar
-- ataques de "search path injection", garantindo que as funções acessem apenas
-- os objetos do esquema public.
--
-- Todas as funções verificam se o usuário está autenticado e se tem permissão
-- para acessar os dados solicitados, garantindo que um usuário não possa
-- manipular sessões de outros usuários. 