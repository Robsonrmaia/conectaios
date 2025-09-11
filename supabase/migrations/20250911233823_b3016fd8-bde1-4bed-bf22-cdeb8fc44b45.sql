-- Criar tabela para configurações globais do sistema
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança - apenas admins podem gerenciar
CREATE POLICY "Only admins can manage system settings"
ON public.system_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Inserir configurações padrão de manutenção
INSERT INTO public.system_settings (key, value, description) VALUES 
('maintenance_mode', '{"enabled": false, "message": "Sistema em manutenção. Voltaremos em breve!", "estimated_time": null}', 'Configurações do modo de manutenção'),
('construction_mode', '{"enabled": false, "message": "Estamos trabalhando em melhorias. Em breve teremos novidades!", "estimated_time": null}', 'Configurações do modo construção');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();