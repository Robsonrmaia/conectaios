import { supabase } from '@/integrations/supabase/client';

export async function uploadLogoToStorage() {
  try {
    console.log('Iniciando upload da logo...');
    
    // Fetch the logo from public folder
    const response = await fetch('/logonova.png');
    
    if (!response.ok) {
      console.error('Falha ao buscar logo da pasta public:', response.status);
      return false;
    }
    
    const blob = await response.blob();
    console.log('Blob da logo criado:', blob.size, 'bytes');
    
    // Upload to storage - força sobrescrever se já existir
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload('logonova.png', blob, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Erro ao fazer upload da logo:', error.message);
      
      // Se já existir, tenta deletar e reupload
      if (error.message.includes('already exists')) {
        console.log('Logo já existe, tentando sobrescrever...');
        await supabase.storage
          .from('property-images')
          .remove(['logonova.png']);
          
        const { data: newData, error: newError } = await supabase.storage
          .from('property-images')
          .upload('logonova.png', blob, {
            cacheControl: '3600'
          });
          
        if (newError) {
          console.error('Erro ao fazer reupload:', newError);
          return false;
        }
        
        console.log('Logo recarregada com sucesso:', newData);
        return true;
      }
      
      return false;
    }

    console.log('Logo carregada com sucesso no storage:', data);
    console.log('URL da logo:', `https://hvbdeyuqcliqrmzvyciq.supabase.co/storage/v1/object/public/property-images/logonova.png`);
    return true;
  } catch (error) {
    console.error('Erro ao carregar logo:', error);
    return false;
  }
}