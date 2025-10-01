-- ============================================
-- VIEWS OTIMIZADAS PARA MENSAGERIA
-- ============================================

-- 1. VIEW: Threads com última mensagem e contadores
CREATE OR REPLACE VIEW chat_threads_enriched AS
SELECT 
    t.id,
    t.title,
    t.is_group,
    t.created_at,
    t.updated_at,
    
    -- Última mensagem
    lm.id as last_message_id,
    lm.content as last_message_content,
    lm.created_at as last_message_at,
    lm.sender_id as last_message_sender_id,
    
    -- Nome do último remetente
    COALESCE(
        cb.name,
        p.name,
        'Usuário'
    ) as last_message_sender_name,
    
    -- Contadores
    (
        SELECT COUNT(*)
        FROM chat_messages cm
        WHERE cm.thread_id = t.id
    ) as message_count
    
FROM chat_threads t

-- Última mensagem (subconsulta lateral otimizada)
LEFT JOIN LATERAL (
    SELECT id, content, created_at, sender_id
    FROM chat_messages
    WHERE thread_id = t.id
    ORDER BY created_at DESC
    LIMIT 1
) lm ON true

-- Nome do remetente
LEFT JOIN conectaios_brokers cb ON lm.sender_id = cb.user_id
LEFT JOIN profiles p ON lm.sender_id = p.id;

-- 2. VIEW: Participantes com informações do usuário
CREATE OR REPLACE VIEW chat_participants_enriched AS
SELECT 
    cp.id,
    cp.thread_id,
    cp.user_id,
    cp.joined_at,
    cp.left_at,
    cp.role,
    
    -- Informações do usuário
    COALESCE(cb.name, p.name, 'Usuário') as user_name,
    COALESCE(cb.avatar_url, p.avatar_url) as user_avatar,
    cb.creci as user_creci,
    
    -- Status online (últimos 5 minutos)
    CASE 
        WHEN pr.last_seen > NOW() - INTERVAL '5 minutes' 
        THEN true 
        ELSE false 
    END as is_online
    
FROM chat_participants cp
LEFT JOIN conectaios_brokers cb ON cp.user_id = cb.user_id
LEFT JOIN profiles p ON cp.user_id = p.id
LEFT JOIN chat_presence pr ON cp.user_id = pr.user_id;

-- 3. FUNÇÃO: Buscar threads do usuário (OTIMIZADA)
CREATE OR REPLACE FUNCTION msg_get_user_threads(p_user_id uuid)
RETURNS TABLE (
    thread_id uuid,
    title text,
    is_group boolean,
    created_at timestamptz,
    updated_at timestamptz,
    
    last_message_id uuid,
    last_message_content text,
    last_message_at timestamptz,
    last_message_sender_id uuid,
    last_message_sender_name text,
    
    unread_count bigint,
    other_participant_id uuid,
    other_participant_name text,
    other_participant_avatar text,
    other_participant_online boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        te.id,
        CASE 
            WHEN te.is_group THEN te.title
            ELSE other.user_name
        END as title,
        te.is_group,
        te.created_at,
        te.updated_at,
        
        te.last_message_id,
        te.last_message_content,
        te.last_message_at,
        te.last_message_sender_id,
        te.last_message_sender_name,
        
        -- Mensagens não lidas (usando status)
        COALESCE((
            SELECT COUNT(*)
            FROM chat_messages cm
            WHERE cm.thread_id = te.id
            AND cm.sender_id != p_user_id
            AND NOT EXISTS (
                SELECT 1 FROM chat_receipts cr
                WHERE cr.message_id = cm.id
                AND cr.user_id = p_user_id
                AND cr.status = 'read'
            )
        ), 0)::bigint as unread_count,
        
        -- Outro participante (para threads 1:1)
        other.user_id,
        other.user_name,
        other.user_avatar,
        other.is_online
        
    FROM chat_threads_enriched te
    
    -- Minha participação
    INNER JOIN chat_participants my_part ON (
        my_part.thread_id = te.id 
        AND my_part.user_id = p_user_id
        AND my_part.left_at IS NULL
    )
    
    -- Outro participante (para threads 1:1)
    LEFT JOIN chat_participants_enriched other ON (
        NOT te.is_group
        AND other.thread_id = te.id
        AND other.user_id != p_user_id
        AND other.left_at IS NULL
    )
    
    ORDER BY te.last_message_at DESC NULLS LAST;
END;
$$;

-- 4. FUNÇÃO: Buscar mensagens com informações do remetente
CREATE OR REPLACE FUNCTION msg_get_thread_messages(
    p_thread_id uuid,
    p_user_id uuid,
    p_limit int DEFAULT 50,
    p_offset int DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    thread_id uuid,
    sender_id uuid,
    content text,
    created_at timestamptz,
    updated_at timestamptz,
    
    sender_name text,
    sender_avatar text,
    
    is_read boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se usuário participa da thread
    IF NOT is_thread_participant(p_thread_id, p_user_id) THEN
        RAISE EXCEPTION 'User is not a participant of this thread';
    END IF;
    
    RETURN QUERY
    SELECT 
        cm.id,
        cm.thread_id,
        cm.sender_id,
        cm.content,
        cm.created_at,
        cm.updated_at,
        
        COALESCE(cb.name, p.name, 'Usuário') as sender_name,
        COALESCE(cb.avatar_url, p.avatar_url) as sender_avatar,
        
        COALESCE(cr.status = 'read', false) as is_read
        
    FROM chat_messages cm
    
    LEFT JOIN conectaios_brokers cb ON cm.sender_id = cb.user_id
    LEFT JOIN profiles p ON cm.sender_id = p.id
    LEFT JOIN chat_receipts cr ON (
        cr.message_id = cm.id 
        AND cr.user_id = p_user_id
    )
    
    WHERE cm.thread_id = p_thread_id
    ORDER BY cm.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 5. FUNÇÃO: Marcar mensagens como lidas (BATCH)
CREATE OR REPLACE FUNCTION msg_mark_messages_read(
    p_thread_id uuid,
    p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Inserir/atualizar receipts para todas mensagens não lidas
    INSERT INTO chat_receipts (message_id, thread_id, user_id, status)
    SELECT 
        cm.id,
        cm.thread_id,
        p_user_id,
        'read'
    FROM chat_messages cm
    WHERE cm.thread_id = p_thread_id
    AND cm.sender_id != p_user_id
    AND NOT EXISTS (
        SELECT 1 FROM chat_receipts cr
        WHERE cr.message_id = cm.id
        AND cr.user_id = p_user_id
    )
    ON CONFLICT (message_id, user_id) 
    DO UPDATE SET status = 'read';
END;
$$;

-- 6. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created 
    ON chat_messages(thread_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_receipts_user_message_unread 
    ON chat_receipts(user_id, message_id) WHERE status != 'read';

CREATE INDEX IF NOT EXISTS idx_chat_participants_user_active 
    ON chat_participants(user_id, thread_id) WHERE left_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chat_presence_last_seen 
    ON chat_presence(user_id, last_seen DESC);

-- 7. TRIGGER: Atualizar updated_at em threads quando houver nova mensagem
CREATE OR REPLACE FUNCTION update_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_threads
    SET updated_at = NEW.created_at
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chat_messages_update_thread ON chat_messages;
CREATE TRIGGER chat_messages_update_thread
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_thread_timestamp();

-- ============================================
-- PERMISSÕES
-- ============================================

GRANT SELECT ON chat_threads_enriched TO authenticated;
GRANT SELECT ON chat_participants_enriched TO authenticated;
GRANT EXECUTE ON FUNCTION msg_get_user_threads TO authenticated;
GRANT EXECUTE ON FUNCTION msg_get_thread_messages TO authenticated;
GRANT EXECUTE ON FUNCTION msg_mark_messages_read TO authenticated;