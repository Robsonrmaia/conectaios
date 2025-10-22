import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileImage, Upload, X, Loader, Wand2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VirtualStaging } from './VirtualStaging';
import { EnhancedWatermarkManager } from './EnhancedWatermarkManager';
import { Switch } from '@/components/ui/switch';
import { ConectaIOSImageProcessor } from './ConectaIOSImageProcessor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Droplet } from 'lucide-react';

interface PhotoUploaderProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  watermarkEnabled?: boolean;
  onWatermarkEnabledChange?: (enabled: boolean) => void;
  watermarkText?: string;
}

export function PhotoUploader({ 
  photos, 
  onPhotosChange, 
  watermarkEnabled = false, 
  onWatermarkEnabledChange,
  watermarkText = "ConectaIOS" 
}: PhotoUploaderProps) {
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [enhancing, setEnhancing] = useState<string | null>(null);
  const [showVirtualStaging, setShowVirtualStaging] = useState<string | null>(null);
  const [isProcessorOpen, setIsProcessorOpen] = useState(false);
  const [processorType, setProcessorType] = useState<'enhance' | 'staging'>('enhance');
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');

  const MAX_PHOTOS = 20;

  const addPhotoUrl = () => {
    console.log(`🔗 [ADD] Iniciando adição - Input: "${newPhotoUrl.slice(-50)}", Total atual: ${photos.length}/${MAX_PHOTOS}`);
    
    if (photos.length >= MAX_PHOTOS) {
      console.log(`❌ [ADD] Limite atingido: ${photos.length}/${MAX_PHOTOS}`);
      toast({
        title: "Limite atingido",
        description: `Máximo de ${MAX_PHOTOS} fotos permitido`,
        variant: "destructive",
      });
      return;
    }
    
    const trimmedUrl = newPhotoUrl.trim();
    if (trimmedUrl) {
      console.log(`🔗 [ADD] URL válida, processando: ${trimmedUrl.slice(-50)}`);
      
      // Validação básica de URL
      try {
        new URL(trimmedUrl);
      } catch {
        console.error(`❌ [ADD] URL inválida: ${trimmedUrl}`);
        toast({
          title: "URL inválida",
          description: "Por favor, insira uma URL válida",
          variant: "destructive",
        });
        return;
      }
      
      // Criar nova array MANUALMENTE
      const updatedPhotos = [...photos, trimmedUrl];
      console.log(`✅ [ADD] Nova array criada: ${updatedPhotos.length} fotos`);
      console.log('📋 [ADD] Array completo:', updatedPhotos.map((p, i) => `[${i}]: ${p.slice(-30)}`));
      
      try {
        onPhotosChange(updatedPhotos);
        setNewPhotoUrl('');
        console.log('✅ [ADD] Estado atualizado com sucesso');
        
        toast({
          title: "Foto adicionada",
          description: `URL adicionada! Total: ${updatedPhotos.length}/${MAX_PHOTOS}`,
        });
      } catch (error) {
        console.error('❌ [ADD] Erro ao atualizar estado:', error);
        toast({
          title: "Erro",
          description: "Erro ao adicionar foto. Tente novamente.",
          variant: "destructive",
        });
      }
    } else {
      console.log('⚠️ [ADD] URL vazia ou inválida');
      toast({
        title: "URL vazia",
        description: "Por favor, insira uma URL de foto",
        variant: "destructive",
      });
    }
  };

  const removePhoto = (index: number) => {
    console.log(`🗑️ [REMOVE] Iniciando remoção - Índice: ${index}, Total atual: ${photos.length}`);
    console.log('📋 [REMOVE] Array atual:', photos.map((p, i) => `[${i}]: ${p.slice(-30)}`));
    
    // Validação robusta do índice
    if (!Number.isInteger(index) || index < 0 || index >= photos.length) {
      console.error(`❌ [REMOVE] ERRO: Índice inválido ${index} para array de tamanho ${photos.length}`);
      toast({
        title: "Erro ao remover",
        description: `Índice da foto inválido (${index}). Array tem ${photos.length} fotos.`,
        variant: "destructive",
      });
      return;
    }
    
    // Criar nova array MANUALMENTE para evitar problemas de referência
    const updatedPhotos = [];
    for (let i = 0; i < photos.length; i++) {
      if (i !== index) {
        updatedPhotos.push(photos[i]);
      }
    }
    
    console.log(`✅ [REMOVE] Nova array criada: ${updatedPhotos.length} fotos restantes`);
    console.log('📋 [REMOVE] Array final:', updatedPhotos.map((p, i) => `[${i}]: ${p.slice(-30)}`));
    
    // Atualizar estado
    try {
      onPhotosChange(updatedPhotos);
      console.log('✅ [REMOVE] Estado atualizado com sucesso');
      
      toast({
        title: "Foto removida",
        description: `Foto ${index + 1} removida! Restam ${updatedPhotos.length} foto(s).`,
      });
    } catch (error) {
      console.error('❌ [REMOVE] Erro ao atualizar estado:', error);
      toast({
        title: "Erro",
        description: "Erro interno ao remover foto. Recarregue a página.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    
    console.log('📸 Iniciando upload de arquivos:', files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type
    })));
    
    if (photos.length + files.length > MAX_PHOTOS) {
      console.error(`❌ Limite de fotos excedido: ${photos.length + files.length} > ${MAX_PHOTOS}`);
      toast({
        title: "Limite atingido",
        description: `Máximo de ${MAX_PHOTOS} fotos permitido. Você pode adicionar ${MAX_PHOTOS - photos.length} foto(s).`,
        variant: "destructive",
      });
      return;
    }
    
    setUploadedFiles(files);
    setUploading(true);

    try {
      // ✅ FIX: pegar auth.uid() para criar caminho correto
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const uploadedUrls: string[] = [];
      let successCount = 0;
      let errorCount = 0;
      
      for (const file of files) {
        console.log(`📸 Processando arquivo: ${file.name}`);
        
        // Validação de tamanho (5MB)
        if (file.size > 5 * 1024 * 1024) {
          console.error(`❌ Arquivo ${file.name} muito grande:`, file.size);
          toast({
            title: "Arquivo muito grande",
            description: `${file.name} excede 5MB. Arquivo ignorado.`,
            variant: "destructive",
          });
          errorCount++;
          continue;
        }

        // Validação de tipo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          console.error(`❌ Tipo de arquivo não suportado: ${file.type}`);
          toast({
            title: "Tipo não suportado",
            description: `${file.name} não é um tipo de imagem válido.`,
            variant: "destructive",
          });
          errorCount++;
          continue;
        }
        
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2);
        const fileName = `${timestamp}-${randomId}.${fileExt}`;
        
        // ✅ FIX: usar bucket 'imoveis' e estrutura correta de pastas: imoveis/{auth.uid()}/{filename}
        const filePath = `${user.id}/${fileName}`;
        
        console.log(`📸 Fazendo upload para bucket 'imoveis': ${filePath}`);
        
        const { data, error } = await supabase.storage
          .from('imoveis') // ✅ FIX: usar bucket 'imoveis' em vez de 'property-images'
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('❌ Erro no upload:', error);
          toast({
            title: "Erro no upload",
            description: `Falha ao enviar ${file.name}: ${error.message}`,
            variant: "destructive",
          });
          errorCount++;
          continue;
        }

        console.log('✅ Upload realizado com sucesso:', data);

        // ✅ FIX: gerar URL pública usando o caminho correto
        const { data: urlData } = supabase.storage
          .from('imoveis') // ✅ FIX: usar bucket 'imoveis'
          .getPublicUrl(filePath);
        
        console.log('📸 URL pública gerada:', urlData.publicUrl);
        uploadedUrls.push(urlData.publicUrl);
        successCount++;
      }
      
      if (uploadedUrls.length > 0) {
        const updatedPhotos = [...photos, ...uploadedUrls];
        onPhotosChange(updatedPhotos);
        console.log('✅ Fotos atualizadas no estado:', updatedPhotos);
      }
      
      // Mensagens de resultado
      if (successCount > 0 && errorCount === 0) {
        toast({
          title: "Fotos enviadas!",
          description: `${successCount} foto(s) enviada(s) com sucesso!`,
        });
      } else if (successCount > 0 && errorCount > 0) {
        toast({
          title: "Upload parcial",
          description: `${successCount} enviadas, ${errorCount} falharam`,
          variant: "destructive",
        });
      } else if (errorCount > 0) {
        toast({
          title: "Falha no upload",
          description: `Todas as ${errorCount} foto(s) falharam`,
          variant: "destructive",
        });
      }
      
      setUploadedFiles([]);
    } catch (error) {
      console.error('❌ Erro inesperado no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Erro inesperado ao enviar fotos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      console.log('📸 Upload finalizado');
    }
  };

  const handleEnhancePhoto = async (photoUrl: string, index: number) => {
    setEnhancing(photoUrl);
    try {
      // Simulate photo enhancement - in a real app this would call an AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, just add a suffix to indicate it's enhanced
      const enhancedUrl = `${photoUrl}?enhanced=true`;
      const updatedPhotos = [...photos];
      updatedPhotos[index] = enhancedUrl;
      onPhotosChange(updatedPhotos);
      
      toast({
        title: "Foto melhorada!",
        description: "A qualidade da foto foi aprimorada com IA.",
      });
    } catch (error) {
      toast({
        title: "Erro na melhoria",
        description: "Não foi possível melhorar a foto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setEnhancing(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Fotos do Imóvel</Label>
        <div className="flex items-center gap-4">
          {onWatermarkEnabledChange && (
            <div className="flex items-center gap-2">
              <Droplet className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="watermark-enabled" className="text-sm">
                Marca d'água
              </Label>
              <Switch
                id="watermark-enabled"
                checked={watermarkEnabled}
                onCheckedChange={onWatermarkEnabledChange}
              />
            </div>
          )}
          <span className="text-sm text-muted-foreground">
            {photos.length}/{MAX_PHOTOS}
          </span>
        </div>
      </div>
      
      {/* File Upload */}
      <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          id="photo-upload"
          disabled={photos.length >= MAX_PHOTOS}
        />
        <label htmlFor="photo-upload" className={`cursor-pointer ${photos.length >= MAX_PHOTOS ? 'cursor-not-allowed opacity-50' : ''}`}>
          {uploading ? (
            <Loader className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-spin" />
          ) : (
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          )}
          <p className="text-muted-foreground mb-2">
            {uploading ? 'Enviando fotos...' : photos.length >= MAX_PHOTOS ? 'Limite de fotos atingido' : 'Clique para selecionar fotos'}
          </p>
          <p className="text-xs text-muted-foreground">PNG, JPG até 10MB cada</p>
        </label>
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium">{uploadedFiles.length} arquivo(s) selecionado(s)</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted rounded p-2">
                  <FileImage className="h-4 w-4" />
                  <span className="text-xs truncate max-w-20">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* URL Input */}
      <div className="space-y-2">
        <Label>Ou adicione URLs das fotos</Label>
        <div className="flex gap-2">
          <Input
            value={newPhotoUrl}
            onChange={(e) => setNewPhotoUrl(e.target.value)}
            placeholder="https://exemplo.com/foto.jpg"
            className="flex-1"
            disabled={photos.length >= MAX_PHOTOS}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addPhotoUrl();
              }
            }}
          />
          <Button 
            type="button" 
            onClick={addPhotoUrl} 
            disabled={!newPhotoUrl.trim() || photos.length >= MAX_PHOTOS}
          >
            Adicionar
          </Button>
        </div>
      </div>

      {/* Main Content with Tabs */}
      {photos.length > 0 ? (
        <Tabs defaultValue="photos" className="space-y-4">
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4">
            <TabsList className="grid w-full grid-cols-2 min-w-max">
              <TabsTrigger value="photos" className="whitespace-nowrap">Fotos ({photos.length})</TabsTrigger>
              <TabsTrigger value="watermark" disabled={!watermarkEnabled} className="whitespace-nowrap">
                <Droplet className="h-4 w-4 mr-2" />
                Marca d'Água
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="photos" className="space-y-2">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo, index) => (
                <div key={index} className="group relative border rounded-lg overflow-hidden">
                  <div className="aspect-video bg-muted">
                    <img
                      src={photo}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-full flex items-center justify-center">
                      <FileImage className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  
                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedImageUrl(photo);
                        setProcessorType('staging');
                        setIsProcessorOpen(true);
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white"
                    >
                      <Wand2 className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedImageUrl(photo);
                        setProcessorType('enhance');
                        setIsProcessorOpen(true);
                      }}
                      disabled={enhancing === photo}
                      className="bg-white/20 hover:bg-white/30 text-white"
                    >
                      {enhancing === photo ? (
                        <Loader className="h-3 w-3 animate-spin" />
                      ) : (
                        "✨"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePhoto(index)}
                      className="bg-white/20 hover:bg-white/30 text-white"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="watermark">
            {watermarkEnabled && (
              <EnhancedWatermarkManager
                images={photos}
                onWatermarkedImages={(watermarkedImages) => {
                  // Replace original photos with watermarked versions
                  const watermarkedUrls = watermarkedImages.map(img => img.watermarked);
                  onPhotosChange(watermarkedUrls);
                }}
                defaultWatermarkText={watermarkText}
              />
            )}
          </TabsContent>
        </Tabs>
      ) : null}

      {/* Bulk URLs */}
      <div className="space-y-2">
        <Label>Ou cole múltiplas URLs (separadas por vírgula)</Label>
        <Textarea
          placeholder="https://exemplo.com/foto1.jpg, https://exemplo.com/foto2.jpg"
          disabled={photos.length >= MAX_PHOTOS}
          onChange={(e) => {
            const urls = e.target.value
              .split(',')
              .map(url => url.trim())
              .filter(url => url.length > 0);
            
            if (urls.length > 0 && e.target.value.includes(',')) {
              const availableSlots = MAX_PHOTOS - photos.length;
              const urlsToAdd = urls.slice(0, availableSlots);
              
              if (urlsToAdd.length > 0) {
                onPhotosChange([...photos, ...urlsToAdd]);
                e.target.value = '';
                toast({
                  title: "Fotos adicionadas",
                  description: `${urlsToAdd.length} foto(s) adicionada(s) com sucesso!`,
                });
              }
              
              if (urls.length > availableSlots) {
                toast({
                  title: "Limite atingido",
                  description: `Apenas ${urlsToAdd.length} foto(s) foram adicionadas. Limite de ${MAX_PHOTOS} fotos.`,
                  variant: "destructive",
                });
              }
            }
          }}
          rows={3}
        />
      </div>

      {/* Virtual Staging */}
      {showVirtualStaging && (
        <div className="border-t pt-4">
          <VirtualStaging
            imageUrl={showVirtualStaging}
            onStagedImage={(stagedUrl) => {
              // Adicionar a versão com virtual staging à lista
              onPhotosChange([...photos, stagedUrl]);
              setShowVirtualStaging(null);
              toast({
                title: "Virtual Staging Adicionado!",
                description: "A versão mobiliada foi adicionada às fotos.",
              });
            }}
          />
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => setShowVirtualStaging(null)}
            >
              Fechar Virtual Staging
            </Button>
          </div>
        </div>
      )}

      {/* ConectAIOS Image Processor */}
      <ConectaIOSImageProcessor
        isOpen={isProcessorOpen}
        onClose={() => setIsProcessorOpen(false)}
        onImageProcessed={(processedUrl) => {
          onPhotosChange([...photos, processedUrl]);
          setIsProcessorOpen(false);
          
          toast({
            title: "Imagem processada!",
            description: processorType === 'enhance' 
              ? "Imagem com qualidade melhorada adicionada!"
              : "Imagem com móveis adicionada!",
          });
        }}
        type={processorType}
        initialImage={selectedImageUrl}
      />
    </div>
  );
}