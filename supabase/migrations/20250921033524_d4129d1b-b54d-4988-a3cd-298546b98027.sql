-- Corrigir função com search_path
CREATE OR REPLACE FUNCTION notify_message_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'message_inserted',
    json_build_object(
      'thread_id', NEW.thread_id,
      'sender_name', NEW.sender_name,
      'content', NEW.content
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para a tabela messages
DROP TRIGGER IF EXISTS message_insert_trigger ON public.messages;
CREATE TRIGGER message_insert_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_message_insert();