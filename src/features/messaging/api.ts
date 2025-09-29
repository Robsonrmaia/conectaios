import { supabase } from '@/integrations/supabase/client'

export async function startOneToOneThread(otherUserId: string) {
  const { data: threadId, error } = await supabase.rpc('msg_create_or_get_direct', {
    target_user_id: otherUserId
  })
  if (error) throw new Error(error.message || 'Failed to create thread')
  return threadId as string
}

export async function listThreads() {
  const { data, error } = await supabase
    .from('chat_threads')
    .select(`
      id, created_at, updated_at, title,
      chat_participants!inner(user_id, profiles(id, name, avatar_url, email))
    `)
    .order('updated_at', { ascending: false })
  
  if (error) throw new Error(error.message || 'Failed to fetch threads')
  return data || []
}

export async function sendMessage(threadId: string, text: string) {
  const { data, error } = await supabase.rpc('msg_send_message', {
    thread_id: threadId,
    content: text
  })
  if (error) throw new Error(error.message || 'Failed to send message')
  return data
}

export async function getMessages(threadId: string) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
  
  if (error) throw new Error(error.message || 'Failed to fetch messages')
  return data || []
}

export async function searchBrokers(q: string, currentUserId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, avatar_url')
    .ilike('name', `%${q}%`)
    .neq('id', currentUserId)
    .order('name', { ascending: true })
    .limit(20)

  if (error) throw error

  // Return unique profiles excluding current user
  return (data ?? []).filter(u => u.id !== currentUserId)
}