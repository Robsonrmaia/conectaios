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
    console.log('Chat create thread request received');
    
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
    
    const { peer_user_id, is_group, title, members } = requestBody;

    if (is_group) {
      console.log('Creating group thread with title:', title, 'and members:', members);
      
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
        return new Response(JSON.stringify({ 
          error: 'Failed to create group thread',
          details: threadError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Group thread created:', thread.id);

      // Add creator as admin
      const participants = [
        { thread_id: thread.id, user_id: user.id, role: 'admin' },
        ...(members || []).map((member_id: string) => ({
          thread_id: thread.id,
          user_id: member_id,
          role: 'member'
        }))
      ];

      console.log('Adding participants:', participants.length);

      const { error: participantsError } = await supabaseClient
        .from('chat_participants')
        .insert(participants);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        // Try to rollback the thread creation
        await supabaseClient.from('chat_threads').delete().eq('id', thread.id);
        
        return new Response(JSON.stringify({ 
          error: 'Failed to add participants to group',
          details: participantsError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Group thread created successfully:', thread.id);
      return new Response(JSON.stringify({ thread_id: thread.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      // Create or find 1:1 thread
      if (!peer_user_id) {
        console.log('Missing peer_user_id for 1:1 chat');
        return new Response(JSON.stringify({ error: 'peer_user_id is required for 1:1 chat' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Creating 1:1 thread between users:', user.id, 'and', peer_user_id);

      // First, try to find existing thread by checking all 1:1 threads where both users are participants
      const { data: existingThreads } = await supabaseClient
        .from('chat_threads')
        .select(`
          id,
          chat_participants(user_id)
        `)
        .eq('is_group', false);

      let existingThread = null;
      if (existingThreads) {
        existingThread = existingThreads.find(thread => {
          const participantIds = thread.chat_participants.map((p: any) => p.user_id);
          return participantIds.length === 2 && 
                 participantIds.includes(user.id) && 
                 participantIds.includes(peer_user_id);
        });
      }

      if (existingThread) {
        console.log('Found existing 1:1 thread:', existingThread.id);
        return new Response(JSON.stringify({ thread_id: existingThread.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Creating new 1:1 thread');
      
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
        return new Response(JSON.stringify({ 
          error: 'Failed to create 1:1 thread',
          details: threadError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('1:1 thread created:', thread.id, 'adding participants...');

      // Add both participants
      const { error: participantsError } = await supabaseClient
        .from('chat_participants')
        .insert([
          { thread_id: thread.id, user_id: user.id, role: 'member' },
          { thread_id: thread.id, user_id: peer_user_id, role: 'member' }
        ]);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        // Try to rollback the thread creation
        await supabaseClient.from('chat_threads').delete().eq('id', thread.id);
        
        return new Response(JSON.stringify({ 
          error: 'Failed to add participants to thread',
          details: participantsError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('1:1 thread created successfully:', thread.id);
      return new Response(JSON.stringify({ thread_id: thread.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in chat-create-thread:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});