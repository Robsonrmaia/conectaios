import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileImage, Upload, X, Loader, Wand2, Play, Video, GripVertical, Crown, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { ConectaIOSImageProcessor } from './ConectaIOSImageProcessor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Droplet } from 'lucide-react';
import { MediaItem } from '@/types/media';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { usePropertyVideoUpload } from '@/hooks/usePropertyVideoUpload';

interface MediaUploaderProps {
  media: MediaItem[];
  onMediaChange: (media: MediaItem[]) => void;
  watermarkEnabled?: boolean;
  onWatermarkEnabledChange?: (enabled: boolean) => void;
  watermarkText?: string;
}

export function MediaUploader({ 
  media, 
  onMediaChange, 
  watermarkEnabled = false, 
  onWatermarkEnabledChange,
  watermarkText = "ConectaIOS" 
}: MediaUploaderProps) {
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isProcessorOpen, setIsProcessorOpen] = useState(false);
  const [processorType, setProcessorType] = useState<'enhance' | 'staging'>('enhance');
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const { uploadVideo, isUploading: isUploadingVideo } = usePropertyVideoUpload();

  const MAX_PHOTOS = 20;
  const MAX_VIDEOS = 2;
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

  const photoCount = media.filter(m => m.type === 'photo').length;
  const uploadedVideoCount = media.filter(m => m.type === 'video' && m.videoType === 'upload').length;

  const addPhotoUrl = () => {
    if (photoCount >= MAX_PHOTOS) {
      toast({
        title: "Limite atingido",
        description: `Máximo de ${MAX_PHOTOS} fotos permitido`,
        variant: "destructive",
      });
      return;
    }
    
    const trimmedUrl = newPhotoUrl.trim();
    if (trimmedUrl) {
      try {
        new URL(trimmedUrl);
        const updatedMedia = [...media, { type: 'photo' as const, url: trimmedUrl }];
        onMediaChange(updatedMedia);
        setNewPhotoUrl('');
        toast({
          title: "Foto adicionada",
          description: `URL adicionada! Total: ${photoCount + 1}/${MAX_PHOTOS}`,
        });
      } catch {
        toast({
          title: "URL inválida",
          description: "Por favor, insira uma URL válida",
          variant: "destructive",
        });
      }
    }
  };

  const addVideoUrl = () => {
    const trimmedUrl = newVideoUrl.trim();
    if (trimmedUrl) {
      try {
        new URL(trimmedUrl);
        const updatedMedia = [...media, { 
          type: 'video' as const, 
          url: trimmedUrl, 
          videoType: 'url' as const 
        }];
        onMediaChange(updatedMedia);
        setNewVideoUrl('');
        toast({
          title: "Vídeo adicionado",
          description: "URL de vídeo adicionada com sucesso!",
        });
      } catch {
        toast({
          title: "URL inválida",
          description: "Por favor, insira uma URL válida de YouTube ou Vimeo",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    
    if (photoCount + files.length > MAX_PHOTOS) {
      toast({
        title: "Limite atingido",
        description: `Máximo de ${MAX_PHOTOS} fotos permitido. Você pode adicionar ${MAX_PHOTOS - photoCount} foto(s).`,
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const uploadedUrls: MediaItem[] = [];
      
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: `${file.name} excede 5MB. Arquivo ignorado.`,
            variant: "destructive",
          });
          continue;
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Tipo não suportado",
            description: `${file.name} não é um tipo de imagem válido.`,
            variant: "destructive",
          });
          continue;
        }
        
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2);
        const fileName = `${timestamp}-${randomId}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('imoveis')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (error) {
          toast({
            title: "Erro no upload",
            description: `Falha ao enviar ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('imoveis')
          .getPublicUrl(filePath);
        
        uploadedUrls.push({ type: 'photo', url: urlData.publicUrl });
      }
      
      if (uploadedUrls.length > 0) {
        const updatedMedia = [...media, ...uploadedUrls];
        onMediaChange(updatedMedia);
        toast({
          title: "Fotos enviadas!",
          description: `${uploadedUrls.length} foto(s) enviada(s) com sucesso!`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Erro inesperado ao enviar fotos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];

    if (uploadedVideoCount >= MAX_VIDEOS) {
      toast({
        title: "Limite atingido",
        description: `Máximo de ${MAX_VIDEOS} vídeos via upload permitido`,
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      toast({
        title: "Arquivo muito grande",
        description: `O vídeo excede 100MB. Tamanho: ${(file.size / 1024 / 1024).toFixed(1)}MB`,
        variant: "destructive",
      });
      return;
    }

    try {
      const propertyId = 'temp-' + Date.now();
      const result = await uploadVideo(file, propertyId);
      
      const updatedMedia = [...media, { 
        type: 'video' as const, 
        url: result.url,
        videoType: 'upload' as const,
        filename: file.name,
        size: file.size
      }];
      onMediaChange(updatedMedia);
    } catch (error) {
      console.error('Erro ao fazer upload de vídeo:', error);
    }
  };

  const removeMedia = (index: number) => {
    if (index < 0 || index >= media.length) return;
    
    const updatedMedia = media.filter((_, i) => i !== index);
    onMediaChange(updatedMedia);
    
    toast({
      title: "Mídia removida",
      description: `${media[index].type === 'photo' ? 'Foto' : 'Vídeo'} removido com sucesso!`,
    });
  };

  const moveToTop = (index: number) => {
    if (index === 0) return;
    const newMedia = [...media];
    const [item] = newMedia.splice(index, 1);
    newMedia.unshift(item);
    onMediaChange(newMedia);
    toast({ 
      title: "Capa definida!", 
      description: `${item.type === 'photo' ? 'Foto' : 'Vídeo'} definido como capa!` 
    });
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newMedia = [...media];
    [newMedia[index - 1], newMedia[index]] = [newMedia[index], newMedia[index - 1]];
    onMediaChange(newMedia);
  };

  const moveDown = (index: number) => {
    if (index === media.length - 1) return;
    const newMedia = [...media];
    [newMedia[index], newMedia[index + 1]] = [newMedia[index + 1], newMedia[index]];
    onMediaChange(newMedia);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(media);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onMediaChange(items);
  };

  return (
    <div className="space-y-4 w-full max-w-6xl mx-auto px-4">
      <div className="flex items-center justify-between">
        <Label>Mídia do Imóvel (Fotos e Vídeos)</Label>
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
            {photoCount}/{MAX_PHOTOS} fotos · {uploadedVideoCount}/{MAX_VIDEOS} vídeos upload
          </span>
        </div>
      </div>
      
      {/* File Upload */}
      <div className="grid grid-cols-1 gap-4 w-full max-w-2xl mx-auto">
        {/* Photo Upload */}
        <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="photo-upload"
            disabled={photoCount >= MAX_PHOTOS}
          />
          <label htmlFor="photo-upload" className={`cursor-pointer ${photoCount >= MAX_PHOTOS ? 'cursor-not-allowed opacity-50' : ''}`}>
            {uploading ? (
              <Loader className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-spin" />
            ) : (
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            )}
            <p className="text-muted-foreground mb-2">
              {uploading ? 'Enviando fotos...' : photoCount >= MAX_PHOTOS ? 'Limite de fotos atingido' : 'Upload de Fotos'}
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG até 5MB</p>
          </label>
        </div>

        {/* Video Upload */}
        <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="hidden"
            id="video-upload"
            disabled={uploadedVideoCount >= MAX_VIDEOS || isUploadingVideo}
          />
          <label htmlFor="video-upload" className={`cursor-pointer ${uploadedVideoCount >= MAX_VIDEOS || isUploadingVideo ? 'cursor-not-allowed opacity-50' : ''}`}>
            {isUploadingVideo ? (
              <Loader className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-spin" />
            ) : (
              <Video className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            )}
            <p className="text-muted-foreground mb-2">
              {isUploadingVideo ? 'Enviando vídeo...' : uploadedVideoCount >= MAX_VIDEOS ? 'Limite de vídeos atingido' : 'Upload de Vídeos'}
            </p>
            <p className="text-xs text-muted-foreground">MP4, até 100MB</p>
          </label>
        </div>
      </div>

      {/* URL Inputs */}
      <div className="grid grid-cols-1 gap-4 w-full max-w-2xl mx-auto">
        <div className="space-y-2 w-full">
          <Label>Ou adicione URL de foto</Label>
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Input
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
              placeholder="https://exemplo.com/foto.jpg"
              disabled={photoCount >= MAX_PHOTOS}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPhotoUrl())}
              className="w-full wrap-any"
            />
            <Button 
              type="button" 
              onClick={addPhotoUrl} 
              disabled={!newPhotoUrl.trim() || photoCount >= MAX_PHOTOS}
              className="w-full sm:w-auto flex-shrink-0"
            >
              Adicionar
            </Button>
          </div>
        </div>

        <div className="space-y-2 w-full">
          <Label>Ou adicione URL de vídeo (YouTube/Vimeo)</Label>
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Input
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVideoUrl())}
              className="w-full wrap-any"
            />
            <Button 
              type="button" 
              onClick={addVideoUrl} 
              disabled={!newVideoUrl.trim()}
              className="w-full sm:w-auto flex-shrink-0"
            >
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      {/* Media List with Drag & Drop */}
      {media.length > 0 && (
        <div className="space-y-2 w-full max-w-full overflow-hidden">
          <Label>Mídia ({media.length})</Label>
          <p className="text-xs text-muted-foreground">
            Arraste para reordenar. A primeira mídia será a capa.
          </p>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="media-list">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2 w-full max-w-4xl mx-auto overflow-x-hidden"
                >
                  {media.map((item, index) => (
                    <Draggable key={index} draggableId={`media-${index}`} index={index}>
                      {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`group relative border rounded-lg overflow-hidden w-full max-w-full ${
                      index === 0 ? 'border-2 border-primary bg-primary/5' : ''
                    } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                  >
                          {index === 0 && (
                            <Badge className="absolute top-2 right-2 z-10 bg-primary">
                              <Crown className="h-3 w-3 mr-1" />
                              CAPA
                            </Badge>
                          )}

                           <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 w-full max-w-full overflow-hidden">
                            {/* Drag Handle */}
                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing flex-shrink-0">
                              <GripVertical className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            </div>

                            {/* Thumbnail */}
                            <div className="relative w-16 h-12 sm:w-24 sm:h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                              {item.type === 'photo' ? (
                                <img src={item.url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <>
                                  {item.thumbnail ? (
                                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-black" />
                                  )}
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <Video className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 overflow-hidden media-card-info">
                              <p className="text-xs sm:text-sm font-medium truncate">
                                {item.type === 'photo' ? 'Foto' : 'Vídeo'} #{index + 1}
                              </p>
                              <p className="text-xs text-muted-foreground truncate break-all">
                                {item.filename || item.url}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 flex-wrap media-card-actions">
                              {index !== 0 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveToTop(index)}
                                  title="Definir como capa"
                                  className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                                >
                                  <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => moveUp(index)}
                                disabled={index === 0}
                                className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                              >
                                <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => moveDown(index)}
                                disabled={index === media.length - 1}
                                className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                              >
                                <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                               {item.type === 'photo' && (
                                <>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedImageUrl(item.url);
                                      setProcessorType('staging');
                                      setIsProcessorOpen(true);
                                    }}
                                    title="Virtual Staging"
                                    className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                                  >
                                    <Wand2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedImageUrl(item.url);
                                      setProcessorType('enhance');
                                      setIsProcessorOpen(true);
                                    }}
                                    title="Melhorar"
                                    className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                                  >
                                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMedia(index)}
                                title="Remover"
                                className="h-8 w-8 p-0 sm:h-9 sm:w-9 text-destructive hover:text-destructive"
                              >
                                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}

      {/* Image Processor Modal */}
      <ConectaIOSImageProcessor
        isOpen={isProcessorOpen}
        onClose={() => setIsProcessorOpen(false)}
        type={processorType}
        initialImage={selectedImageUrl}
        onImageProcessed={(newUrl) => {
          const index = media.findIndex(m => m.url === selectedImageUrl);
          if (index !== -1) {
            const updatedMedia = [...media];
            updatedMedia[index] = { ...updatedMedia[index], url: newUrl };
            onMediaChange(updatedMedia);
          }
          setIsProcessorOpen(false);
        }}
      />
    </div>
  );
}
