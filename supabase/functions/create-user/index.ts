import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      console.log('[create-user] Successfully parsed request body.');
      console.log('[create-user] Parsed request body content:', JSON.stringify(requestBody));
    } catch (jsonError) {
      console.error('[create-user] Error parsing request JSON body:', jsonError instanceof Error ? jsonError.message : String(jsonError));
      return new Response(JSON.stringify({ error: 'Bad Request: Invalid or empty JSON body. Please ensure all required fields are sent correctly.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { email, password, first_name, last_name, role, avatar_url, phone_number, supervisor_id, address } = requestBody;
    console.log('[create-user] Destructured data for new user:', { email, password: password ? '********' : 'N/A', first_name, last_name, role, avatar_url: avatar_url ? 'Present' : 'N/A', phone_number: phone_number ? 'Present' : 'N/A', supervisor_id: supervisor_id ? 'Present' : 'N/A', address: address ? 'Present' : 'N/A' });

    // Adjusted validation: last_name is optional
    if (!email || !password || !first_name || !role) {
      console.error('[create-user] Bad Request: Missing required fields in request body. Received:', { email, password: password ? '********' : 'N/A', first_name, last_name, role });
      return new Response(JSON.stringify({ error: 'Bad Request: Missing required fields (email, password, first_name, role)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('[create-user] Admin Supabase client initialized.');

    let targetUserId: string | null = null;
    let operationType: 'created' | 'updated' = 'created';

    // First, try to get the user by email to check if they already exist
    const { data: existingUserAuth, error: getUserError } = await adminSupabase.auth.admin.getUserByEmail(email);

    if (getUserError && getUserError.message !== 'User not found') {
      console.error('[create-user] Error checking for existing user by email:', getUserError.message);
      return new Response(JSON.stringify({ error: `Error checking for existing user: ${getUserError.message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (existingUserAuth?.user) {
      // User already exists in auth.users
      targetUserId = existingUserAuth.user.id;
      operationType = 'updated';
      console.log(`[create-user] User ${email} already exists (ID: ${targetUserId}). Attempting to update profile.`);

      // Update user_metadata in auth.users
      const { error: updateAuthUserError } = await adminSupabase.auth.admin.updateUserById(targetUserId, {
        email, // Ensure email is also updated if it changed (though it's the lookup key here)
        password, // Update password if provided
        user_metadata: { 
          first_name: first_name || null, 
          last_name: last_name || null, 
          role: role || 'standard', 
          avatar_url: avatar_url || null, 
          phone_number: phone_number || null, 
          supervisor_id: supervisor_id || null, 
          address: address || null 
        },
      });

      if (updateAuthUserError) {
        console.error(`[create-user] Error updating auth.users for ${email} (ID: ${targetUserId}):`, updateAuthUserError.message);
        return new Response(JSON.stringify({ error: `Failed to update existing user in authentication: ${updateAuthUserError.message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Also update the public.profiles table directly, as the trigger might not fire on update
      const { error: updateProfileError } = await adminSupabase
        .from('profiles')
        .update({
          first_name: first_name || null,
          last_name: last_name || null,
          role: role || 'standard',
          avatar_url: avatar_url || null,
          phone_number: phone_number || null,
          supervisor_id: supervisor_id || null,
          address: address || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId);

      if (updateProfileError) {
        console.error(`[create-user] Error updating public.profiles for ${email} (ID: ${targetUserId}):`, updateProfileError.message);
        return new Response(JSON.stringify({ error: `Failed to update existing user profile: ${updateProfileError.message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      console.log(`[create-user] Successfully updated profile for existing user ${email} (ID: ${targetUserId}).`);

    } else {
      // User does not exist, proceed with creation
      console.log(`[create-user] User ${email} not found. Attempting to create new user.`);
      const { data: newUser, error: createUserError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { 
          first_name: first_name || null, 
          last_name: last_name || null, 
          role: role || 'standard', 
          avatar_url: avatar_url || null, 
          phone_number: phone_number || null, 
          supervisor_id: supervisor_id || null, 
          address: address || null 
        },
      });

      if (createUserError) {
        console.error('[create-user] Error creating user with admin.createUser:', createUserError.message); 
        return new Response(JSON.stringify({ error: createUserError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      targetUserId = newUser.user?.id || null;
      console.log('[create-user] New user created successfully:', targetUserId);
    }

    if (!targetUserId) {
      console.error('[create-user] Operation completed, but no user ID was determined.');
      return new Response(JSON.stringify({ error: 'Internal Server Error: User ID not determined after operation.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ message: `User ${operationType} successfully`, userId: targetUserId, operation: operationType }), {
      status: 200, // Changed to 200 OK for both create and update success
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