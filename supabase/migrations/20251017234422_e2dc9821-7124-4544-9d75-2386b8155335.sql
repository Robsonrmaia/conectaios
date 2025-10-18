-- Criar tabela para armazenar vídeos dos imóveis
CREATE TABLE IF NOT EXISTS imovel_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id UUID NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT,
  filename TEXT,
  size BIGINT,
  video_type TEXT CHECK (video_type IN ('upload', 'youtube', 'vimeo')),
  thumbnail TEXT,
  position INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_imovel_videos_imovel_id ON imovel_videos(imovel_id);
CREATE INDEX idx_imovel_videos_position ON imovel_videos(position);

-- Habilitar RLS
ALTER TABLE imovel_videos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Brokers podem ver vídeos de seus imóveis"
  ON imovel_videos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM imoveis
      WHERE imoveis.id = imovel_videos.imovel_id
      AND imoveis.owner_id = auth.uid()
    )
  );

CREATE POLICY "Brokers podem inserir vídeos em seus imóveis"
  ON imovel_videos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM imoveis
      WHERE imoveis.id = imovel_videos.imovel_id
      AND imoveis.owner_id = auth.uid()
    )
  );

CREATE POLICY "Brokers podem atualizar vídeos de seus imóveis"
  ON imovel_videos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM imoveis
      WHERE imoveis.id = imovel_videos.imovel_id
      AND imoveis.owner_id = auth.uid()
    )
  );

CREATE POLICY "Brokers podem deletar vídeos de seus imóveis"
  ON imovel_videos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM imoveis
      WHERE imoveis.id = imovel_videos.imovel_id
      AND imoveis.owner_id = auth.uid()
    )
  );