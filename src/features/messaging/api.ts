import { supabase } from '@/integrations/supabase/client'

export async function startOneToOneThread(otherUserId: string) {
  const { data, error } = await supabase.functions.invoke('messaging/create-or-get', {
    body: { peer_id: otherUserId },
  })
  if (error) throw new Error(error.message || 'edge_invocation_error')
  if (!data?.thread_id) throw new Error(data?.error || 'thread_not_created')
  return data.thread_id as string
}

export async function listThreads() {
  const { data, error } = await supabase.functions.invoke('messaging/list-threads')
  if (error) throw new Error(error.message || 'edge_invocation_error')
  return data || []
}

export async function sendMessage(threadId: string, text: string) {
  const { data, error } = await supabase.functions.invoke('messaging/send', {
    body: { thread_id: threadId, text },
  })
  if (error) throw new Error(error.message || 'edge_invocation_error')
  return data
}

export async function getMessages(threadId: string) {
  const { data, error } = await supabase.functions.invoke('messaging/messages/' + threadId, {
    body: {}
  })
  if (error) throw new Error(error.message || 'edge_invocation_error')
  return data || []
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