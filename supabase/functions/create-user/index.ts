import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Edge Function create-user invoked');

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Unauthorized: Missing Authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token received (first 10 chars):', token.substring(0, 10));
    
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
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    console.log('User authenticated:', user.id, 'Email:', user.email);

    const { data: profile, error: profileError } = await userSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      console.warn(`User ${user.id} (role: ${profile?.role}) attempted to create user without admin role.`);
      return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can create new users' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    console.log('Admin user authorized. Role:', profile.role);

    console.log('Request Content-Type:', req.headers.get('Content-Type'));
    console.log('Request Content-Length:', req.headers.get('Content-Length'));
    
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Successfully parsed request body.');
      console.log('Parsed request body content:', JSON.stringify(requestBody)); // Log the parsed content
    } catch (jsonError) {
      console.error('Error parsing request JSON body:', jsonError instanceof Error ? jsonError.message : String(jsonError));
      // Retorna um erro 400 com uma mensagem mais específica para o frontend
      return new Response(JSON.stringify({ error: 'Bad Request: Invalid or empty JSON body. Please ensure all required fields are sent correctly.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { email, password, first_name, last_name, role, avatar_url, phone_number } = requestBody;
    console.log('Received data for new user:', { email, first_name, last_name, role, avatar_url: avatar_url ? 'Present' : 'N/A', phone_number: phone_number ? 'Present' : 'N/A' });

    if (!email || !password || !first_name || !last_name || !role) {
      console.error('Bad Request: Missing required fields in request body.');
      return new Response(JSON.stringify({ error: 'Bad Request: Missing required fields (email, password, first_name, last_name, role)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('Attempting to create user with admin client...');

    const { data: newUser, error: createUserError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name, role, avatar_url, phone_number },
    });

    if (createUserError) {
      console.error('Error creating user with admin.createUser:', createUserError); 
      return new Response(JSON.stringify({ error: createUserError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('New user created successfully:', newUser.user?.id);
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