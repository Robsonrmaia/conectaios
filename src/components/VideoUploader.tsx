import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Video } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { usePropertyVideoUpload } from '@/hooks/usePropertyVideoUpload';

interface VideoUploaderProps {
  propertyId: string;
  currentVideoCount: number;
  onVideoUploaded: (videoData: { url: string; filename: string; size: number }) => void;
}

const MAX_VIDEOS = 2;
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

export function VideoUploader({ propertyId, currentVideoCount, onVideoUploaded }: VideoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadVideo, isUploading } = usePropertyVideoUpload();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validações
    if (currentVideoCount >= MAX_VIDEOS) {
      toast({
        title: 'Limite atingido',
        description: `Máximo de ${MAX_VIDEOS} vídeos por imóvel`,
        variant: 'destructive',
      });
      return;
    }

    if (file.size > MAX_SIZE) {
      toast({
        title: 'Vídeo muito grande',
        description: 'Tamanho máximo: 100MB',
        variant: 'destructive',
      });
      return;
    }

    if (file.type !== 'video/mp4') {
      toast({
        title: 'Formato não suportado',
        description: 'Use apenas MP4 (H.264)',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await uploadVideo(file, propertyId);
      onVideoUploaded(result);
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const canUpload = currentVideoCount < MAX_VIDEOS;

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Video className="h-4 w-4" />
        Vídeos do imóvel ({currentVideoCount}/{MAX_VIDEOS})
      </Label>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4"
        onChange={handleFileSelect}
        disabled={!canUpload || isUploading}
        className="hidden"
        id="video-upload"
      />
      
      <Button
        type="button"
        variant="outline"
        disabled={!canUpload || isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="w-full"
      >
        <Upload className="h-4 w-4 mr-2" />
        {isUploading ? 'Enviando...' : 'Adicionar vídeo (MP4, máx 100MB)'}
      </Button>

      <p className="text-xs text-muted-foreground">
        Formato: MP4 (H.264 + AAC) • Tamanho máximo: 100MB • Limite: 2 vídeos
      </p>
    </div>
  );
}
