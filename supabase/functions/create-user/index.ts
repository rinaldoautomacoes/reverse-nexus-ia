import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to sanitize parts of an email (local part or domain part)
const sanitizeEmailPart = (part: string): string => {
  let sanitized = part
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9.-]/g, '');

  sanitized = sanitized.replace(/^[.-]+|[.-]+$/g, '').replace(/[.]{2,}/g, '.').replace(/[-]{2,}/g, '-');
  return sanitized;
};

// Helper to generate a unique string for emails
const generateUniqueString = (prefix: string = 'gen') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
};

serve(async (req) => {
  console.log('[create-user] Edge Function create-user invoked');

  if (req.method === 'OPTIONS') {
    console.log('[create-user] Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[create-user] Unauthorized: Missing Authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('[create-user] Token received (first 10 chars):', token.substring(0, 10));
    
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
      console.error('[create-user] Error getting user from token:', userError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    console.log('[create-user] User authenticated:', user.id, 'Email:', user.email);

    const { data: profile, error: profileError } = await userSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      console.warn(`[create-user] User ${user.id} (role: ${profile?.role}) attempted to create user without admin role.`);
      return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can create new users' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    console.log('[create-user] Admin user authorized. Role:', profile.role);

    let requestBody;
    try {
      requestBody = await req.json();
      const loggableBody = { ...requestBody, password: requestBody.password ? '********' : 'N/A' };
      console.log('[create-user] Parsed request body content:', JSON.stringify(loggableBody)); 
    } catch (jsonError) {
      console.error('[create-user] Error parsing request JSON body:', jsonError instanceof Error ? jsonError.message : String(jsonError));
      return new Response(JSON.stringify({ error: 'Bad Request: Invalid or empty JSON body. Please ensure all required fields are sent correctly.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let { email, password, first_name, last_name, role, avatar_url, phone_number, supervisor_id } = requestBody;
    console.log('[create-user] Received data for new user:', { email, first_name, last_name, role, avatar_url: avatar_url ? 'Present' : 'N/A', phone_number: phone_number ? 'Present' : 'N/A', supervisor_id: supervisor_id ? 'Present' : 'N/A' });

    if (!first_name || !last_name || !role) {
      console.error('[create-user] Bad Request: Missing required profile fields (first_name, last_name, role)');
      return new Response(JSON.stringify({ error: 'Bad Request: Missing required profile fields (first_name, last_name, role)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Generate email if not provided or invalid
    if (!email || !email.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const sanitizedFirstName = sanitizeEmailPart(first_name);
      const sanitizedLastName = sanitizeEmailPart(last_name);
      const baseEmail = `${sanitizedFirstName}.${sanitizedLastName}`;
      email = `${baseEmail}.${generateUniqueString('TECH')}@logireverseia.com`; // Add unique string to avoid conflicts
      console.log(`[create-user] Email not provided or invalid, generated: ${email}`);
    }

    // Use default password if not provided
    if (!password) {
      password = 'LogiReverseIA@2025';
      console.log('[create-user] Password not provided, using default password.');
    }

    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('[create-user] Attempting to create user with admin client...');
    
    const userMetadataForSupabaseAuth = { 
      first_name, 
      last_name, 
      role, 
      avatar_url, 
      phone_number, 
      supervisor_id: supervisor_id === "" ? null : supervisor_id // Ensure empty string becomes null for UUID column
    };
    console.log('[create-user] User metadata being sent to auth.admin.createUser:', JSON.stringify(userMetadataForSupabaseAuth));

    const { data: newUser, error: createUserError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadataForSupabaseAuth,
    });

    if (createUserError) {
      console.error('[create-user] Error creating user with admin.createUser:', createUserError); 
      return new Response(JSON.stringify({ error: createUserError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[create-user] New user created successfully:', newUser.user?.id);
    return new Response(JSON.stringify({ message: 'User created successfully', user: newUser.user?.id }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[create-user] Unexpected error in create-user edge function:', error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});