import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if admin user already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'admin')
      .limit(1);

    if (existingAdmin && existingAdmin.length > 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Admin user already exists',
        user: existingAdmin[0]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user with email admin already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const adminUser = existingUser.users?.find(user => user.email === 'admin@conectaios.com.br');

    let userId: string;

    if (adminUser) {
      userId = adminUser.id;
      console.log('Admin user already exists in auth, using existing ID:', userId);
    } else {
      // Create admin user in auth
      const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: 'admin@conectaios.com.br',
        password: 'admin123',
        email_confirm: true
      });

      if (authError) {
        console.error('Error creating admin user:', authError);
        throw authError;
      }

      userId = newUser.user!.id;
      console.log('Created new admin user with ID:', userId);
    }

    // Create or update profile with admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: userId,
        nome: 'Administrador',
        role: 'admin'
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating admin profile:', profileError);
      throw profileError;
    }

    console.log('Admin user and profile created successfully');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Admin user created successfully',
      user: profile,
      credentials: {
        email: 'admin@conectaios.com.br',
        password: 'admin123'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-admin-user function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});