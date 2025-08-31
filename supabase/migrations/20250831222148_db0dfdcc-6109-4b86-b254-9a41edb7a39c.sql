-- FASE 3: Criar tabelas restantes

-- Criar conectaios_clients
CREATE TABLE public.conectaios_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  tipo TEXT NOT NULL,
  classificacao TEXT DEFAULT 'novo_lead',
  stage TEXT DEFAULT 'novo_lead',
  photo TEXT,
  opp TEXT,
  responsavel UUID,
  valor NUMERIC,
  pipeline_id UUID,
  last_contact_at TIMESTAMP WITH TIME ZONE,
  score INTEGER DEFAULT 0,
  historico JSONB DEFAULT '[]'::jsonb,
  documents TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conectaios_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own clients" ON public.conectaios_clients
  FOR ALL USING (auth.uid() = user_id);

-- Criar conectaios_tasks  
CREATE TABLE public.conectaios_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  txt TEXT NOT NULL,
  done BOOLEAN DEFAULT false,
  responsavel UUID,
  quando TEXT,
  onde TEXT,
  porque TEXT,
  quem TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conectaios_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tasks" ON public.conectaios_tasks
  FOR ALL USING (auth.uid() = user_id);

-- Criar conectaios_notes
CREATE TABLE public.conectaios_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  client_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conectaios_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notes" ON public.conectaios_notes
  FOR ALL USING (auth.uid() = user_id);

-- Migrar dados das tabelas
INSERT INTO conectaios_clients (
  id, user_id, nome, telefone, tipo, classificacao, stage, photo, opp, responsavel,
  valor, pipeline_id, last_contact_at, score, historico, documents, created_at, updated_at
)
SELECT 
  id, user_id, nome, telefone, tipo, classificacao, stage, photo, opp, responsavel,
  valor, pipeline_id, last_contact_at, score, historico, documents, created_at, updated_at
FROM clients;

INSERT INTO conectaios_tasks (
  id, user_id, txt, done, responsavel, quando, onde, porque, quem, created_at, updated_at
)
SELECT 
  id, user_id, txt, done, responsavel, quando, onde, porque, quem, created_at, updated_at
FROM tasks;

INSERT INTO conectaios_notes (
  id, user_id, content, client_id, created_at, updated_at
)
SELECT 
  id, user_id, content, client_id, created_at, updated_at
FROM notes;