import { supabase } from '@/integrations/supabase/client';

export async function listMySearches() {
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) throw new Error('User not authenticated');
  
  return supabase
    .from('client_searches')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
}

export async function saveSearch(payload: { title?: string; params: any }) {
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) throw new Error('User not authenticated');
  
  return supabase
    .from('client_searches')
    .insert({ 
      user_id: uid, 
      title: payload.title,
      params: payload.params,
      is_active: true
    });
}

export async function deleteSearch(searchId: string) {
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) throw new Error('User not authenticated');
  
  return supabase
    .from('client_searches')
    .delete()
    .eq('id', searchId)
    .eq('user_id', uid);
}