import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileImage, Upload, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface PhotoUploaderProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

export function PhotoUploader({ photos, onPhotosChange }: PhotoUploaderProps) {
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const addPhotoUrl = () => {
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files));
      // For now, just show files - in a real implementation, we'd upload to storage
      toast({
        title: "Arquivos selecionados",
        description: `${e.target.files.length} arquivo(s) selecionado(s). Funcionalidade de upload será implementada em breve.`,
      });
    }
  };

  return (
    <div className="space-y-4">
      <Label>Fotos do Imóvel</Label>
      
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
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground mb-2">Clique para selecionar fotos</p>
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
          <div className="grid gap-2">
            {photos.map((photo, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border rounded">
                <FileImage className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-sm truncate" title={photo}>
                  {photo}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePhoto(index)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
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