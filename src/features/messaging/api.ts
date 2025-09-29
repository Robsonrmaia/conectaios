import { supabase } from '@/integrations/supabase/client'

export async function startOneToOneThread(otherUserId: string) {
  const { data, error } = await supabase.functions.invoke('chat-start-thread', {
    body: { other_user_id: otherUserId },
  })
  if (error) throw new Error(error.message || 'edge_invocation_error')
  if (!data?.thread_id) throw new Error(data?.error || 'thread_not_created')
  return data.thread_id as string
}

export async function searchBrokers(q: string, currentUserId: string) {
  const query = supabase
    .from('brokers')
    .select('user_id, name, email, avatar_url, username', { count: 'exact', head: false })
    .ilike('name', `%${q}%`)
    .neq('user_id', currentUserId)
    .order('name', { ascending: true })

  const { data, error } = await query
  if (error) throw error

  // de-dup (segurança caso venham duplicados por joins/views)
  const uniq = new Map<string, any>()
  for (const b of data ?? []) if (!uniq.has(b.user_id)) uniq.set(b.user_id, b)
  return Array.from(uniq.values())
}