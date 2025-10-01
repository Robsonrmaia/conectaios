-- Migrar conteúdo existente de body para content
UPDATE chat_messages 
SET content = body 
WHERE content IS NULL AND body IS NOT NULL;

-- Corrigir função msg_send_message para usar ambos os campos
CREATE OR REPLACE FUNCTION public.msg_send_message(thread_id uuid, content text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  me uuid := auth.uid();
  mid uuid;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  -- valida participação
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE thread_id = msg_send_message.thread_id AND user_id = me AND left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'not_a_participant';
  END IF;

  INSERT INTO chat_messages(thread_id, sender_id, body, content)
  VALUES (thread_id, me, content, content)
  RETURNING id INTO mid;

  UPDATE chat_threads SET last_message_at = now() WHERE id = thread_id;

  RETURN mid;
END $function$;

-- Corrigir função msg_get_thread_messages para usar COALESCE
CREATE OR REPLACE FUNCTION public.msg_get_thread_messages(p_thread_id uuid, p_user_id uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS TABLE(id uuid, thread_id uuid, sender_id uuid, content text, created_at timestamp with time zone, updated_at timestamp with time zone, sender_name text, sender_avatar text, is_read boolean, read_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
        COALESCE(cm.content, cm.body) as content,
        cm.created_at,
        cm.updated_at,
        
        COALESCE(cb.name, p.name, 'Usuário') as sender_name,
        COALESCE(cb.avatar_url, p.avatar_url) as sender_avatar,
        
        cr.read_at IS NOT NULL as is_read,
        cr.read_at
        
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
$function$;