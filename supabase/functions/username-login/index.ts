import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Nome de usuário e senha são obrigatórios.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a Supabase client with the service role key
    // This client has elevated privileges and can query auth.users and public.profiles
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Find the user_id (which is also auth.users.id) from the public.profiles table using the username
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id') // 'id' in profiles is the same as 'id' in auth.users
      .eq('username', username)
      .single();

    if (profileError || !profileData) {
      console.error('Error finding profile by username:', profileError?.message || 'Profile not found');
      return new Response(JSON.stringify({ error: 'Credenciais inválidas.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = profileData.id;

    // 2. Get the email from auth.users using the user_id
    const { data: userData, error: userError } = await adminSupabase.auth.admin.getUserById(userId);

    if (userError || !userData?.user?.email) {
      console.error('Error getting user email from auth.users:', userError?.message || 'User email not found');
      return new Response(JSON.stringify({ error: 'Credenciais inválidas.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const email = userData.user.email;

    // 3. Sign in using the retrieved email and the provided password
    // This will create a session for the user
    const { data: authData, error: signInError } = await adminSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Error during signInWithPassword:', signInError.message);
      return new Response(JSON.stringify({ error: 'Credenciais inválidas.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return the session data to the client
    return new Response(JSON.stringify(authData.session), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error in username-login edge function:', error.message);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});