import { supabase } from '@/integrations/supabase/client';

export async function uploadLogoToStorage() {
  try {
    // Fetch the logo from public folder
    const response = await fetch('/logoconectaios.png');
    const blob = await response.blob();
    
    // Upload to storage
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload('logoconectaios.png', blob, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Erro ao fazer upload da logo:', error);
      return false;
    }

    console.log('Logo carregada com sucesso:', data);
    return true;
  } catch (error) {
    console.error('Erro ao carregar logo:', error);
    return false;
  }
}