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

    const { peer_user_id, is_group, title, members } = await req.json();

    if (is_group) {
      // Create group thread
      const { data: thread, error: threadError } = await supabaseClient
        .from('chat_threads')
        .insert({
          is_group: true,
          title: title || 'New Group',
          created_by: user.id
        })
        .select()
        .single();

      if (threadError) {
        console.error('Error creating group thread:', threadError);
        return new Response(JSON.stringify({ error: threadError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Add creator as admin
      const participants = [
        { thread_id: thread.id, user_id: user.id, role: 'admin' },
        ...(members || []).map((member_id: string) => ({
          thread_id: thread.id,
          user_id: member_id,
          role: 'member'
        }))
      ];

      const { error: participantsError } = await supabaseClient
        .from('chat_participants')
        .insert(participants);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        return new Response(JSON.stringify({ error: participantsError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ thread_id: thread.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      // Create or find 1:1 thread
      if (!peer_user_id) {
        return new Response(JSON.stringify({ error: 'peer_user_id is required for 1:1 chat' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if thread already exists
      const { data: existingThread } = await supabaseClient
        .from('chat_threads')
        .select(`
          id,
          chat_participants!inner(user_id)
        `)
        .eq('is_group', false)
        .in('chat_participants.user_id', [user.id, peer_user_id])
        .limit(1);

      if (existingThread && existingThread.length > 0) {
        // Check if both users are participants
        const thread = existingThread[0];
        const participantIds = thread.chat_participants.map((p: any) => p.user_id);
        
        if (participantIds.includes(user.id) && participantIds.includes(peer_user_id)) {
          return new Response(JSON.stringify({ thread_id: thread.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Create new 1:1 thread
      const { data: thread, error: threadError } = await supabaseClient
        .from('chat_threads')
        .insert({
          is_group: false,
          created_by: user.id
        })
        .select()
        .single();

      if (threadError) {
        console.error('Error creating 1:1 thread:', threadError);
        return new Response(JSON.stringify({ error: threadError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Add both participants
      const { error: participantsError } = await supabaseClient
        .from('chat_participants')
        .insert([
          { thread_id: thread.id, user_id: user.id, role: 'member' },
          { thread_id: thread.id, user_id: peer_user_id, role: 'member' }
        ]);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        return new Response(JSON.stringify({ error: participantsError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ thread_id: thread.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in chat-create-thread:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});