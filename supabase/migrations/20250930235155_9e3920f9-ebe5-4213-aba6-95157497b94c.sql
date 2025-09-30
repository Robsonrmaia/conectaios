-- CORREÇÃO DEFINITIVA: Eliminar TODAS as políticas recursivas e usar SECURITY DEFINER

-- 1. Remover TODAS as políticas problemáticas de chat_participants
DROP POLICY IF EXISTS "participants_view_own" ON chat_participants;
DROP POLICY IF EXISTS "participants_view_thread_members" ON chat_participants;
DROP POLICY IF EXISTS "participants_insert_self" ON chat_participants;
DROP POLICY IF EXISTS "participants_insert_own" ON chat_participants;
DROP POLICY IF EXISTS "participants_update_own" ON chat_participants;
DROP POLICY IF EXISTS "participants_select_self" ON chat_participants;
DROP POLICY IF EXISTS "chat_participants_participants" ON chat_participants;

-- 2. Criar função SECURITY DEFINER para verificar participação (sem recursão)
CREATE OR REPLACE FUNCTION public.is_thread_participant(p_thread_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM chat_participants 
    WHERE thread_id = p_thread_id 
    AND user_id = p_user_id 
    AND left_at IS NULL
  );
END;
$$;

-- 3. Criar políticas simples usando a função (SEM recursão)
-- Usuários podem ver suas próprias participações diretamente
CREATE POLICY "participants_select_direct_own"
ON chat_participants
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Usuários podem ver outros participantes de threads onde estão (usando função)
CREATE POLICY "participants_select_via_function"
ON chat_participants
FOR SELECT
TO authenticated
USING (public.is_thread_participant(thread_id, auth.uid()));

-- Usuários só podem inserir a si mesmos
CREATE POLICY "participants_insert_self_only"
ON chat_participants
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Usuários só podem atualizar suas próprias participações
CREATE POLICY "participants_update_self_only"
ON chat_participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());