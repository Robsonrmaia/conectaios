import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePropertyImageUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (
    file: File, 
    bucketName: string = 'property-images',
    options?: { submissionToken?: string; maxRetries?: number }
  ) => {
    const maxRetries = options?.maxRetries || 3;
    let retryCount = 0;

    setIsUploading(true);

    const attemptUpload = async (): Promise<string> => {
      try {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('Arquivo muito grande. Máximo 10MB permitido.');
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error('Tipo de arquivo não permitido. Use JPG, PNG ou WebP.');
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2);
        const fileExt = file.name.split('.').pop() || 'jpg';
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `property-${timestamp}-${randomId}-${cleanFileName}`;
        
        console.log('📤 Uploading image:', fileName, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');

        // Upload to Supabase Storage submissions folder
        const { data, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(`submissions/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        console.log('✅ Upload successful:', data);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(`submissions/${fileName}`);

        console.log('🔗 Public URL generated:', publicUrl);
        
        return publicUrl;

      } catch (error: any) {
        console.error(`Upload attempt ${retryCount + 1} failed:`, error);
        
        if (retryCount < maxRetries - 1) {
          retryCount++;
          console.log(`🔄 Retrying upload (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
          return attemptUpload();
        }
        
        throw error;
      }
    };

    try {
      const publicUrl = await attemptUpload();
      toast.success('Imagem enviada com sucesso!');
      return publicUrl;
    } catch (error: any) {
      console.error('Final upload error:', error);
      const errorMessage = error.message || 'Erro ao fazer upload da imagem';
      
      if (errorMessage.includes('row-level security')) {
        toast.error('Erro de permissão. Verifique se você tem acesso para enviar imagens.');
      } else if (errorMessage.includes('Arquivo muito grande')) {
        toast.error('Arquivo muito grande. Use uma imagem menor que 10MB.');
      } else if (errorMessage.includes('Tipo de arquivo')) {
        toast.error('Tipo de arquivo não permitido. Use JPG, PNG ou WebP.');
      } else {
        toast.error(`Erro no upload: ${errorMessage}`);
      }
      
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadImage,
    isUploading
  };
}