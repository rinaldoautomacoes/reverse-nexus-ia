import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { verify } from 'https://deno.land/x/djwt@v2.8/mod.ts';

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized: Missing Authorization header', { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create a Supabase client with the user's JWT to verify their role
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false },
      }
    );

    const { data: { user }, error: userError } = await userSupabase.auth.getUser();

    if (userError || !user) {
      console.error('Error getting user from token:', userError?.message);
      return new Response('Unauthorized: Invalid token', { status: 401, headers: corsHeaders });
    }

    // Fetch the user's profile to check their role
    const { data: profile, error: profileError } = await userSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      console.warn(`User ${user.id} (role: ${profile?.role}) attempted to create user without admin role.`);
      return new Response('Forbidden: Only administrators can create new users', { status: 403, headers: corsHeaders });
    }

    // If the caller is an admin, proceed to create the new user
    const { email, password, first_name, last_name, role, avatar_url } = await req.json(); // Adicionado avatar_url

    if (!email || !password || !first_name || !last_name || !role) {
      return new Response('Bad Request: Missing required fields (email, password, first_name, last_name, role)', { status: 400, headers: corsHeaders });
    }

    // Create a Supabase client with the service role key
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: newUser, error: createUserError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm email for admin-created users
      user_metadata: { first_name, last_name, role, avatar_url }, // Passa avatar_url para user_metadata
    });

    if (createUserError) {
      console.error('Error creating user:', createUserError.message);
      return new Response(JSON.stringify({ error: createUserError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // The handle_new_user trigger will automatically create the profile in public.profiles
    // with the role and avatar_url from user_metadata.

    return new Response(JSON.stringify({ message: 'User created successfully', user: newUser.user?.id }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error in create-user edge function:', error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});