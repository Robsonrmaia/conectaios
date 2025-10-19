# Marketplace – Vídeos

## Resumo

Sistema de vídeos para anúncios do marketplace com upload e exibição integrados no grid de mídia.

## Especificações

- **Formato**: MP4 (H.264 + AAC)
- **Limite**: 2 vídeos por imóvel
- **Tamanho máximo**: 100 MB por vídeo
- **Storage**: Bucket `property-videos` do Supabase
- **Persistência**: Tabela `public.imovel_media` (kind='video')

## Estrutura de Dados

### Tabela: `public.imovel_media`

```sql
CREATE TABLE public.imovel_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id UUID NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'video')),
  url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT false,
  filename TEXT,
  size_bytes BIGINT,
  duration_seconds INTEGER,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Validações Automáticas

- **Trigger `check_video_limit`**: Bloqueia inserção se já existem 2 vídeos para o imóvel
- **RLS Policies**: Acesso público para imóveis publicados, apenas owner pode modificar

## Componentes

### `VideoUploader` (`src/components/VideoUploader.tsx`)

Componente de upload com validações:
- Aceita apenas MP4
- Valida tamanho (máx 100MB)
- Verifica limite de 2 vídeos
- Feedback visual de progresso

**Props:**
```typescript
{
  propertyId: string;
  currentVideoCount: number;
  onVideoUploaded: (data: { url: string; filename: string; size: number }) => void;
}
```

### `MediaGrid` (`src/components/MediaGrid.tsx`)

Grid unificado para fotos e vídeos:
- Thumbnails com badge de tipo (foto/vídeo)
- Ícone de play para vídeos
- Modal de player para vídeos
- Integração com `PhotoGallery` para imagens
- Ações de edição (definir capa, remover)

**Props:**
```typescript
{
  items: Array<{ kind: 'image' | 'video'; url: string; is_cover?: boolean; filename?: string }>;
  onRemove?: (index: number) => void;
  onSetCover?: (index: number) => void;
  editable?: boolean;
}
```

## Hook: `usePropertyVideoUpload`

Hook para gerenciar upload de vídeos (`src/hooks/usePropertyVideoUpload.tsx`):

```typescript
const { uploadVideo, deleteVideo, isUploading, uploadProgress } = usePropertyVideoUpload();

// Upload
const result = await uploadVideo(file, propertyId);
// Retorna: { type: 'upload', url: string, filename: string, size: number }

// Delete
await deleteVideo(propertyId, videoUrl);
```

## Integração na Página Imoveis.tsx

### Salvamento

Ao salvar/editar um imóvel:
1. Salvar imóvel na tabela `imoveis`
2. Salvar imagens na tabela `imovel_images` (comportamento existente mantido)
3. **NOVO**: Salvar vídeos na tabela `imovel_media` (linhas 756-816)

```typescript
// Exemplo simplificado
const videoRecords = formData.videos
  .filter(v => v.type === 'upload')
  .map((video, index) => ({
    imovel_id: propertyId,
    kind: 'video',
    url: video.url,
    filename: video.filename,
    size_bytes: video.size,
    position: index
  }));

await supabase.from('imovel_media').insert(videoRecords);
```

### Carregamento

Ao buscar imóveis (`fetchProperties`, linhas 419-444):
1. Buscar imóveis da tabela `imoveis`
2. Buscar imagens da tabela `imovel_images` (mantido)
3. **NOVO**: Buscar vídeos da tabela `imovel_media` WHERE kind='video'
4. Mapear vídeos para o formato `PropertyVideo[]`

## Como Usar

### 1. Upload de Vídeo

Na página de edição de imóvel:
1. Ir para aba "Mídia & Vídeos"
2. Clicar em "Adicionar vídeo" ou arrastar arquivo MP4
3. Aguardar upload (barra de progresso)
4. Vídeo aparece no grid com ícone de play

### 2. Definir Vídeo como Capa

1. Passar mouse sobre o vídeo no grid
2. Clicar em "Definir capa"
3. Badge "Capa" aparece no canto superior direito

### 3. Visualizar Vídeo

1. Clicar no thumbnail do vídeo
2. Player abre em modal fullscreen
3. Controles nativos do HTML5 video (play, pause, volume, fullscreen)

### 4. Remover Vídeo

1. Passar mouse sobre o vídeo
2. Clicar no ícone X vermelho
3. Confirmar remoção (toast de feedback)

## Limitações e Notas

### MVP
- **Formato**: Apenas MP4 neste MVP (H.264 + AAC)
- **Thumbnails**: Gerados automaticamente pelo navegador (`preload="metadata"`)
- **Poster frame**: Não implementado (usa primeiro frame do vídeo)

### Compatibilidade
- **Navegadores modernos**: Chrome, Firefox, Safari, Edge
- **Mobile**: Funciona via HTML5 `<video>` nativo com `playsInline`
- **Autoplay**: Desabilitado por padrão (UX)

### Performance
- Vídeos não são carregados até o usuário clicar (lazy loading nativo)
- URLs públicas do Supabase Storage (CDN)
- Pré-carregamento de metadados apenas (`preload="metadata"`)

## Rollback

Para remover a feature:

```sql
-- 1. Remover trigger e função
DROP TRIGGER IF EXISTS trigger_check_video_limit ON public.imovel_media;
DROP FUNCTION IF EXISTS public.check_video_limit();

-- 2. Remover dados de vídeo
DELETE FROM public.imovel_media WHERE kind = 'video';

-- 3. (Opcional) Remover tabela completa
DROP TABLE IF EXISTS public.imovel_media;
```

Remover componentes:
- `src/components/VideoUploader.tsx`
- `src/components/MediaGrid.tsx`
- Hook: `src/hooks/usePropertyVideoUpload.tsx`

Reverter mudanças em:
- `src/pages/app/Imoveis.tsx` (linhas 387, 419-444, 756-816, 490)

## Suporte e Debugging

### Logs

Upload:
```
📤 Uploading video: {propertyId}/{timestamp}-{filename}
✅ Video uploaded: {publicUrl}
```

Salvamento:
```
=== SALVANDO VÍDEOS NA TABELA ===
🎬 Registros de vídeos preparados: [{...}]
✅ Vídeos salvos com sucesso
```

Carregamento:
```
🎬 [ADMIN] Buscando vídeos para {count} imóveis
✅ [ADMIN] Vídeos carregados: {count}
```

### Erros Comuns

1. **"Limite de 2 vídeos atingido"**
   - Solução: Remover um vídeo existente antes de adicionar novo

2. **"Vídeo muito grande"**
   - Solução: Comprimir vídeo para menos de 100MB (usar HandBrake, ffmpeg, etc)

3. **"Formato não suportado"**
   - Solução: Converter para MP4 H.264 + AAC

### Configuração de Tamanho Máximo

Editar constante em `src/hooks/usePropertyVideoUpload.tsx`:

```typescript
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // Alterar valor aqui
```

### Feature Flag (Opcional)

Para ativar/desativar vídeos via feature flag:

```typescript
// src/config/features.ts
export const FEATURES = {
  VIDEO_UPLOAD: true // Alterar para false para desabilitar
};

// Uso no componente
if (FEATURES.VIDEO_UPLOAD) {
  return <VideoUploader />;
}
```

## Próximos Passos (Fora do MVP)

- [ ] Suporte a WEBM/MOV
- [ ] Geração de thumbnail/poster automático
- [ ] Indicador de duração do vídeo
- [ ] Preview antes do upload
- [ ] Compressão automática no cliente
- [ ] Upload resumível (chunks)
- [ ] Transcodificação no servidor
