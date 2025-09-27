import { useEffect, useState } from 'react';
import { uploadImovelImage, listImovelImages, setCover, supabase } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, Crown, Trash2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { ImovelImage } from '@/lib/storage';

type Props = { imovelId: string };

export default function ImovelImageManager({ imovelId }: Props) {
  const [images, setImages] = useState<ImovelImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  async function refresh() {
    try { 
      const data = await listImovelImages(imovelId);
      setImages(data);
    } catch (e: any) { 
      toast({
        title: "Erro ao carregar imagens",
        description: e.message,
        variant: "destructive"
      });
    }
  }

  useEffect(() => { 
    refresh(); 
  }, [imovelId]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    
    setBusy(true);
    setUploadProgress(0);
    
    try {
      const files = Array.from(e.target.files);
      const total = files.length;
      
      for (let i = 0; i < total; i++) {
        const file = files[i];
        console.log(`📤 Uploading ${i + 1}/${total}: ${file.name}`);
        
        await uploadImovelImage(imovelId, file);
        setUploadProgress(Math.round(((i + 1) / total) * 100));
      }
      
      await refresh();
      toast({
        title: "Upload concluído",
        description: `${total} ${total === 1 ? 'imagem enviada' : 'imagens enviadas'} com sucesso!`
      });
    } catch (e: any) { 
      toast({
        title: "Erro no upload",
        description: e.message,
        variant: "destructive"
      });
    } finally { 
      setBusy(false); 
      setUploadProgress(0);
      e.target.value = ''; 
    }
  }

  async function onSetCover(id: string) {
    setBusy(true);
    try { 
      await setCover(imovelId, id); 
      await refresh();
      toast({
        title: "Capa definida",
        description: "Imagem de capa alterada com sucesso!"
      });
    } catch (e: any) { 
      toast({
        title: "Erro ao definir capa",
        description: e.message,
        variant: "destructive"
      });
    } finally { 
      setBusy(false); 
    }
  }

  async function onDelete(image: ImovelImage) {
    setBusy(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const resp = await fetch('https://paawojkqrggnuvpnnwrc.supabase.co/functions/v1/images-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          imovel_id: imovelId, 
          image_id: image.id, 
          storage_path: image.storage_path 
        })
      });
      
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(errorText || 'Erro ao deletar imagem');
      }
      
      await refresh();
      toast({
        title: "Imagem removida",
        description: "Imagem deletada com sucesso!"
      });
    } catch (e: any) { 
      toast({
        title: "Erro ao deletar",
        description: e.message,
        variant: "destructive"
      });
    } finally { 
      setBusy(false); 
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Gestão de Imagens
        </CardTitle>
        <CardDescription>
          Envie, organize e gerencie as imagens do imóvel. Defina a imagem de capa que será exibida.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={onUpload}
              disabled={busy}
              className="file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
            />
            {busy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {uploadProgress > 0 ? `${uploadProgress}%` : 'Processando...'}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Formatos aceitos: JPG, PNG, WebP. Múltiplas imagens podem ser selecionadas.
          </p>
        </div>

        {/* Images Grid */}
        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map(img => (
              <div key={img.id} className="group relative">
                <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                  <img 
                    src={img.url} 
                    alt="Imagem do imóvel" 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                    loading="lazy"
                  />
                </div>
                
                {/* Cover Badge */}
                {img.is_cover && (
                  <Badge variant="secondary" className="absolute top-2 left-2 bg-amber-500 text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    Capa
                  </Badge>
                )}
                
                {/* Action Buttons */}
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={img.is_cover ? "default" : "secondary"}
                      onClick={() => onSetCover(img.id)}
                      disabled={busy || img.is_cover}
                      className="flex-1 h-8 text-xs"
                    >
                      {img.is_cover ? (
                        <>
                          <Crown className="h-3 w-3 mr-1" />
                          Capa
                        </>
                      ) : (
                        'Definir capa'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(img)}
                      disabled={busy}
                      className="h-8 px-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <Upload className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Nenhuma imagem enviada
            </h3>
            <p className="text-sm text-muted-foreground">
              Selecione arquivos acima para começar a adicionar imagens ao imóvel
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}