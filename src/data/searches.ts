import { supabase } from '@/integrations/supabase/client';

export interface ClientSearchParams {
  property_type?: string;
  listing_type?: string;
  max_price?: number;
  min_bedrooms?: number;
  neighborhood?: string;
  city?: string;
  min_area?: number;
}

export interface ClientSearch {
  id: string;
  user_id: string;
  title?: string;
  params: ClientSearchParams;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function listMySearches(): Promise<ClientSearch[]> {
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('client_searches')
    .select('id,user_id,title,params,is_active,created_at,updated_at')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function saveSearch(payload: { title?: string; params: ClientSearchParams }): Promise<ClientSearch> {
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('client_searches')
    .insert({
      user_id: uid,
      title: payload.title,
      params: payload.params
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSearch(searchId: string): Promise<void> {
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('client_searches')
    .delete()
    .eq('id', searchId)
    .eq('user_id', uid);

  if (error) throw error;
}

export async function updateSearchStats(searchId: string, matchCount: number): Promise<void> {
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('client_searches')
    .update({ 
      params: { match_count: matchCount, last_match_at: new Date().toISOString() }
    })
    .eq('id', searchId)
    .eq('user_id', uid);

  if (error) throw error;
}