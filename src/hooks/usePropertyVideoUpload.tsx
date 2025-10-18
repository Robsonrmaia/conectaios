import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_UPLOADS_PER_PROPERTY = 2;
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

interface VideoUploadResult {
  type: 'upload';
  url: string;
  filename: string;
  size: number;
}

export function usePropertyVideoUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadVideo = async (
    file: File, 
    propertyId: string
  ): Promise<VideoUploadResult> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Validação crítica: propertyId deve existir
      if (!propertyId) {
        throw new Error('ID do imóvel não fornecido. Salve o imóvel antes de adicionar vídeos.');
      }

      // Validações de arquivo
      if (file.size > MAX_VIDEO_SIZE) {
        throw new Error('Vídeo muito grande. Máximo 100MB permitido.');
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Formato não suportado. Use MP4, WEBM ou MOV.');
      }

      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${propertyId}/${timestamp}-${cleanName}`;

      console.log('📤 Uploading video:', fileName, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');

      // Upload com tracking de progresso
      const { data, error } = await supabase.storage
        .from('property-videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('property-videos')
        .getPublicUrl(fileName);

      console.log('✅ Video uploaded:', publicUrl);
      toast.success('Vídeo enviado com sucesso!');

      return {
        type: 'upload',
        url: publicUrl,
        filename: file.name,
        size: file.size
      };

    } catch (error: any) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Erro ao fazer upload do vídeo';
      
      if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
        errorMessage = 'Você não tem permissão para adicionar vídeos a este imóvel. Certifique-se de que o imóvel existe e pertence a você.';
      } else if (error.message?.includes('exceeds maximum')) {
        errorMessage = 'Arquivo muito grande. Máximo 100MB.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteVideo = async (propertyId: string, videoUrl: string) => {
    try {
      // Extrair o path do vídeo da URL
      const urlParts = videoUrl.split('/property-videos/');
      if (urlParts.length < 2) {
        throw new Error('URL de vídeo inválida');
      }
      
      const filePath = urlParts[1];
      const { error } = await supabase.storage
        .from('property-videos')
        .remove([filePath]);

      if (error) throw error;

      toast.success('Vídeo removido com sucesso!');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Erro ao remover vídeo');
      throw error;
    }
  };

  return { 
    uploadVideo, 
    deleteVideo,
    isUploading, 
    uploadProgress 
  };
}
