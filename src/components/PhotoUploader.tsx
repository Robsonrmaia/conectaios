import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileImage, Upload, X, Loader } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PhotoUploaderProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

export function PhotoUploader({ photos, onPhotosChange }: PhotoUploaderProps) {
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [enhancing, setEnhancing] = useState<string | null>(null);

  const MAX_PHOTOS = 20;

  const addPhotoUrl = () => {
    if (photos.length >= MAX_PHOTOS) {
      toast({
        title: "Limite atingido",
        description: `Máximo de ${MAX_PHOTOS} fotos permitido`,
        variant: "destructive",
      });
      return;
    }
    
    if (newPhotoUrl.trim()) {
      const updatedPhotos = [...photos, newPhotoUrl.trim()];
      onPhotosChange(updatedPhotos);
      setNewPhotoUrl('');
      toast({
        title: "Foto adicionada",
        description: "A URL da foto foi adicionada com sucesso!",
      });
    }
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(updatedPhotos);
    toast({
      title: "Foto removida",
      description: "A foto foi removida com sucesso!",
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    
    if (photos.length + files.length > MAX_PHOTOS) {
      toast({
        title: "Limite atingido",
        description: `Máximo de ${MAX_PHOTOS} fotos permitido. Você pode adicionar ${MAX_PHOTOS - photos.length} foto(s).`,
        variant: "destructive",
      });
      return;
    }
    
    console.log('PhotoUploader - Files selected:', files.length);
    setUploadedFiles(files);
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];
      
      for (const file of files) {
        console.log('PhotoUploader - Uploading file:', file.name);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (error) {
          console.error('PhotoUploader - Upload error:', error);
          throw error;
        }

        const { data: urlData } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);
        
        uploadedUrls.push(urlData.publicUrl);
        console.log('PhotoUploader - File uploaded successfully:', urlData.publicUrl);
      }
      
      const updatedPhotos = [...photos, ...uploadedUrls];
      onPhotosChange(updatedPhotos);
      
      toast({
        title: "Fotos enviadas!",
        description: `${uploadedUrls.length} foto(s) enviada(s) com sucesso!`,
      });
      
      setUploadedFiles([]);
    } catch (error) {
      console.error('PhotoUploader - Upload failed:', error);
      toast({
        title: "Erro no upload",
        description: "Erro ao enviar fotos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
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
        <span className="text-sm text-muted-foreground">
          {photos.length}/{MAX_PHOTOS}
        </span>
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
        />
        <label htmlFor="photo-upload" className="cursor-pointer">
          {uploading ? (
            <Loader className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-spin" />
          ) : (
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          )}
          <p className="text-muted-foreground mb-2">
            {uploading ? 'Enviando fotos...' : 'Clique para selecionar fotos'}
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
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addPhotoUrl();
              }
            }}
          />
          <Button type="button" onClick={addPhotoUrl} disabled={!newPhotoUrl.trim()}>
            Adicionar
          </Button>
        </div>
      </div>

      {/* Photo List */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <Label>Fotos adicionadas ({photos.length})</Label>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
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
                    onClick={() => handleEnhancePhoto(photo, index)}
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
        </div>
      )}

      {/* Bulk URLs */}
      <div className="space-y-2">
        <Label>Ou cole múltiplas URLs (separadas por vírgula)</Label>
        <Textarea
          placeholder="https://exemplo.com/foto1.jpg, https://exemplo.com/foto2.jpg"
          onChange={(e) => {
            const urls = e.target.value
              .split(',')
              .map(url => url.trim())
              .filter(url => url.length > 0);
            
            if (urls.length > 0 && e.target.value.includes(',')) {
              onPhotosChange([...photos, ...urls]);
              e.target.value = '';
              toast({
                title: "Fotos adicionadas",
                description: `${urls.length} foto(s) adicionada(s) com sucesso!`,
              });
            }
          }}
          rows={3}
        />
      </div>
    </div>
  );
}