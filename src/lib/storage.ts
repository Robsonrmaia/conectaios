import { supabase } from '@/integrations/supabase/client';

// Export supabase for use in components
export { supabase };

export type ImovelImage = {
  id: string;
  imovel_id: string;
  url: string;
  storage_path: string;
  position: number;
  is_cover: boolean;
  created_at: string;
};

const BUCKET = 'imoveis';

export function publicPath(imovelId: string, fileName: string) {
  return `public/${imovelId}/${fileName}`;
}

export function publicUrl(path: string) {
  // path ex.: public/<imovel_id>/capa.jpg
  const supabaseUrl = 'https://paawojkqrggnuvpnnwrc.supabase.co';
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
}

export async function uploadImovelImage(imovelId: string, file: File) {
  const name = crypto.randomUUID() + '.' + (file.name.split('.').pop() ?? 'jpg');
  const path = publicPath(imovelId, name);
  
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
    
  if (error) throw error;
  
  const url = publicUrl(path);
  
  // Cria o registro no BD
  const { data, error: dberr } = await supabase
    .from('imovel_images')
    .insert({ 
      imovel_id: imovelId, 
      url, 
      storage_path: path, 
      is_cover: false, 
      position: 0 
    })
    .select()
    .single();
    
  if (dberr) throw dberr;
  return data as ImovelImage;
}

export async function listImovelImages(imovelId: string) {
  const { data, error } = await supabase
    .from('imovel_images')
    .select('*')
    .eq('imovel_id', imovelId)
    .order('is_cover', { ascending: false })
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
    
  if (error) throw error;
  return (data ?? []) as ImovelImage[];
}

export async function setCover(imovelId: string, imageId: string) {
  // Zera capas
  const { error: e1 } = await supabase
    .from('imovel_images')
    .update({ is_cover: false })
    .eq('imovel_id', imovelId);
    
  if (e1) throw e1;
  
  // Define capa
  const { data, error: e2 } = await supabase
    .from('imovel_images')
    .update({ is_cover: true })
    .eq('id', imageId)
    .select()
    .single();
    
  if (e2) throw e2;
  return data as ImovelImage;
}