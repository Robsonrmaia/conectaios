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
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { thread_id, body, attachments, reply_to_id } = await req.json();

    if (!thread_id) {
      return new Response(JSON.stringify({ error: 'thread_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body && (!attachments || attachments.length === 0)) {
      return new Response(JSON.stringify({ error: 'Message must have body or attachments' }), {
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

    // Insert message
    const { data: message, error: messageError } = await supabaseClient
      .from('chat_messages')
      .insert({
        thread_id,
        sender_id: user.id,
        body: body || null,
        attachments: attachments || [],
        reply_to_id: reply_to_id || null
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return new Response(JSON.stringify({ error: messageError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all participants except sender for notifications
    const { data: participants } = await supabaseClient
      .from('chat_participants')
      .select('user_id')
      .eq('thread_id', thread_id)
      .neq('user_id', user.id)
      .is('left_at', null);

    // Get sender info
    const { data: senderInfo } = await supabaseClient
      .from('conectaios_brokers')
      .select('name')
      .eq('user_id', user.id)
      .single();

    const senderName = senderInfo?.name || 'Unknown User';

    // Create notifications for other participants
    if (participants && participants.length > 0) {
      const notifications = participants.map(p => ({
        user_id: p.user_id,
        type: 'chat:new_message',
        title: `${senderName}`,
        body: body ? (body.length > 50 ? body.substring(0, 50) + '...' : body) : 'Sent an attachment',
        meta: {
          thread_id,
          message_id: message.id,
          sender_id: user.id,
          sender_name: senderName
        }
      }));

      const { error: notificationError } = await supabaseClient
        .from('notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Error creating notifications:', notificationError);
      }
    }

    // Create delivery receipts for other participants
    if (participants && participants.length > 0) {
      const receipts = participants.map(p => ({
        thread_id,
        message_id: message.id,
        user_id: p.user_id,
        status: 'delivered'
      }));

      const { error: receiptError } = await supabaseClient
        .from('chat_receipts')
        .insert(receipts);

      if (receiptError) {
        console.error('Error creating receipts:', receiptError);
      }
    }

    return new Response(JSON.stringify({ message_id: message.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-send-message:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});