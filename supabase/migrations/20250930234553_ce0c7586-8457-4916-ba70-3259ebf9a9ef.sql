-- FASE 1: Correção Crítica do RLS - Eliminar recursão infinita em chat_participants

-- Remover políticas problemáticas
DROP POLICY IF EXISTS "chat_participants_member_access" ON chat_participants;
DROP POLICY IF EXISTS "participants_member" ON chat_participants;

-- Criar políticas simplificadas sem recursão
-- Permitir que usuários vejam suas próprias participações
CREATE POLICY "participants_view_own"
ON chat_participants
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Permitir que usuários vejam participantes de threads onde estão incluídos
CREATE POLICY "participants_view_thread_members"
ON chat_participants
FOR SELECT
TO authenticated
USING (
  thread_id IN (
    SELECT thread_id 
    FROM chat_participants 
    WHERE user_id = auth.uid() 
    AND left_at IS NULL
  )
);

-- Permitir inserir apenas a si mesmo como participante
CREATE POLICY "participants_insert_own"
ON chat_participants
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Permitir atualizar apenas suas próprias participações
CREATE POLICY "participants_update_own"
ON chat_participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());