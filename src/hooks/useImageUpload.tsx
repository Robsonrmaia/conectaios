import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useBroker } from './useBroker';

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { broker, updateBrokerProfile } = useBroker();

  const uploadImage = async (file: File, type: 'avatar' | 'cover' | 'logo') => {
    setIsUploading(true);
    try {
      // Get user session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate filename with user ID
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `public/${user.id}/avatar.${ext}`;

      // Upload to avatars bucket with upsert
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      // Update both profiles.avatar_url and brokers.avatar_url
      if (type === 'avatar') {
        // Update profiles table
        await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        // Update brokers table if broker exists
        if (broker) {
          await updateBrokerProfile({ avatar_url: publicUrl });
        }
      } else if (type === 'cover' && broker) {
        await updateBrokerProfile({ cover_url: publicUrl });
      }

      toast({
        title: "Imagem enviada!",
        description: `${type === 'avatar' ? 'Foto de perfil' : type === 'cover' ? 'Capa' : 'Logo'} atualizada com sucesso.`,
      });

      return publicUrl;
    } catch (error) {
      console.error(`/* DEBUG */ Error uploading ${type}:`, error);
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