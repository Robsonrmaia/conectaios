import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Chat mark read request received');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the session
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user:', user.id);

    const requestBody = await req.json();
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const { thread_id, message_ids } = requestBody;

    if (!thread_id) {
      console.log('Missing thread_id');
      return new Response(JSON.stringify({ error: 'thread_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user is participant of the thread
    const { data: participant } = await supabaseClient
      .from('chat_participants')
      .select('role')
      .eq('thread_id', thread_id)
      .eq('user_id', user.id)
      .is('left_at', null)
      .single();

    if (!participant) {
      return new Response(JSON.stringify({ error: 'Not a participant of this thread' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let query = supabaseClient
      .from('chat_messages')
      .select('id')
      .eq('thread_id', thread_id)
      .neq('sender_id', user.id); // Don't mark own messages as read

    // If specific message IDs provided, filter by them
    if (message_ids && message_ids.length > 0) {
      query = query.in('id', message_ids);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return new Response(JSON.stringify({ error: messagesError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ marked_as_read: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create read receipts
    const receipts = messages.map(msg => ({
      thread_id,
      message_id: msg.id,
      user_id: user.id,
      status: 'read'
    }));

    const { error: receiptError } = await supabaseClient
      .from('chat_receipts')
      .upsert(receipts, {
        onConflict: 'thread_id,message_id,user_id,status',
        ignoreDuplicates: true
      });

    if (receiptError) {
      console.error('Error creating read receipts:', receiptError);
      return new Response(JSON.stringify({ error: receiptError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark notifications as read
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('type', 'chat:new_message')
      .contains('meta', { thread_id });

    if (notificationError) {
      console.error('Error marking notifications as read:', notificationError);
    }

    return new Response(JSON.stringify({ marked_as_read: messages.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-mark-read:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});