import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useBroker } from './useBroker';

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { broker, updateBrokerProfile } = useBroker();

  const uploadImage = async (file: File, type: 'avatar' | 'cover' | 'logo') => {
    if (!broker) {
      throw new Error('Broker profile not found');
    }

    setIsUploading(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${broker.id}-${type}-${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(`profiles/${fileName}`, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(`profiles/${fileName}`);

      // Update broker profile based on image type
      const updateData: any = {};
      if (type === 'avatar' || type === 'logo') {
        updateData.avatar_url = publicUrl;
      } else if (type === 'cover') {
        updateData.cover_url = publicUrl;
      }

      await updateBrokerProfile(updateData);

      toast({
        title: "Imagem enviada!",
        description: `${type === 'avatar' ? 'Foto de perfil' : type === 'cover' ? 'Capa' : 'Logo'} atualizada com sucesso.`,
      });

      return publicUrl;
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast({
        title: "Erro",
        description: `Erro ao enviar ${type === 'avatar' ? 'foto de perfil' : type === 'cover' ? 'capa' : 'logo'}. Tente novamente.`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const createFileInput = (type: 'avatar' | 'cover' | 'logo', onSuccess?: (url: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const url = await uploadImage(file, type);
          onSuccess?.(url);
        } catch (error) {
          // Error handling is done in uploadImage
        }
      }
    };
    return input;
  };

  return {
    uploadImage,
    createFileInput,
    isUploading
  };
}