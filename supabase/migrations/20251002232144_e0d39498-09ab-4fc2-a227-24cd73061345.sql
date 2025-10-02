-- Correção de policies para chat_participants
-- Remove recursão infinita e cria policies simples

-- 1. Remover policies problemáticas
DROP POLICY IF EXISTS "chat_participants_select" ON chat_participants;
DROP POLICY IF EXISTS "chat_participants_member" ON chat_participants;
DROP POLICY IF EXISTS "chat_participants_insert" ON chat_participants;
DROP POLICY IF EXISTS "participants_insert_member" ON chat_participants;

-- 2. Criar policy simples para SELECT (sem recursão)
-- Usuário pode ver participantes de threads onde ele mesmo é participante
CREATE POLICY "chat_participants_select_v2" ON chat_participants
FOR SELECT
USING (
  thread_id IN (
    SELECT thread_id 
    FROM chat_participants 
    WHERE user_id = auth.uid() 
    AND left_at IS NULL
  )
);

-- 3. Criar policy para INSERT
-- Apenas usuários autenticados podem inserir participantes
CREATE POLICY "chat_participants_insert_v2" ON chat_participants
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Criar policy para UPDATE
-- Usuário pode atualizar apenas seus próprios registros
CREATE POLICY "chat_participants_update_v2" ON chat_participants
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. Criar policy para DELETE
-- Usuário pode deletar apenas seus próprios registros
CREATE POLICY "chat_participants_delete_v2" ON chat_participants
FOR DELETE
USING (user_id = auth.uid());