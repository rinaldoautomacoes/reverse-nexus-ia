import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'; // Using 2.45.0

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
    
    // Client for verifying the *current user's* session (using anon key and user's token)
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false }, // Ensure session is not persisted in Edge Function context
      }
    );

    const { data: { user }, error: userError } = await userSupabase.auth.getUser();

    if (userError || !user) {
      console.error('[create-user] Error getting user from token:', userError?.message);
      console.error('[create-user] Full userSupabase.auth.getUser() error:', JSON.stringify(userError));
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

    if (!email || !first_name || !role) { // Password is not strictly required for updates, only for new creation
      console.error('[create-user] Bad Request: Missing required fields in request body. Received:', { email, first_name, role });
      return new Response(JSON.stringify({ error: 'Bad Request: Missing required fields (email, first_name, role)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Admin client for performing auth.admin operations (using service role key)
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('[create-user] Admin Supabase client initialized.');

    let targetUserId: string | null = null;
    let operationType: 'created' | 'updated' = 'created';

    // 1. Check if user already exists by email
    console.log(`[create-user] Checking for existing user with email: ${email}`);
    const { data: existingUserAuthData, error: getAuthUserError } = await adminSupabase.auth.admin.getUserByEmail(email);

    if (getAuthUserError && getAuthUserError.message !== 'User not found') {
      console.error(`[create-user] Error checking for existing user ${email}:`, getAuthUserError.message);
      throw new Error(`Falha ao verificar usuário existente: ${getAuthUserError.message}`);
    }

    if (existingUserAuthData?.user) {
      // User exists, update their profile
      targetUserId = existingUserAuthData.user.id;
      operationType = 'updated';
      console.log(`[create-user] User ${email} already exists (ID: ${targetUserId}). Attempting to update profile.`);

      try {
        const updateAuthUserOptions: { email: string; password?: string; phone?: string | null; user_metadata: object } = {
          email,
          phone: phone_number || null, // Adicionado o campo 'phone' aqui
          user_metadata: { 
            first_name: first_name || null, 
            last_name: last_name || null, 
            role: role || 'standard', 
            avatar_url: avatar_url || null, 
            phone_number: phone_number || null, 
            supervisor_id: supervisor_id || null, 
            address: address || null 
          },
        };

        // Only include password if it's provided and not empty
        if (password && password.trim() !== '') {
          updateAuthUserOptions.password = password;
        }
        console.log(`[create-user] Updating auth.users for ${email} (ID: ${targetUserId}) with options:`, JSON.stringify(updateAuthUserOptions));

        const { error: updateAuthUserError } = await adminSupabase.auth.admin.updateUserById(targetUserId, updateAuthUserOptions);

        if (updateAuthUserError) {
          console.error(`[create-user] Error updating auth.users for ${email} (ID: ${targetUserId}):`, updateAuthUserError.message);
          throw new Error(`Falha ao atualizar usuário existente na autenticação: ${updateAuthUserError.message}`);
        }
        console.log(`[create-user] user_metadata and phone of auth.users updated successfully for ${email} (ID: ${targetUserId}).`);

      } catch (e) {
        console.error('[create-user] Error caught during updateAuthUserById:', e instanceof Error ? e.message : String(e));
        return new Response(JSON.stringify({ error: `Erro Interno do Servidor durante a atualização do usuário de autenticação: ${e instanceof Error ? e.message : String(e)}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Use upsert for public.profiles to handle cases where auth.users exists but public.profiles doesn't
      try {
        const profileDataToUpsert = {
          id: targetUserId, // Use the existing user's ID
          first_name: first_name || null,
          last_name: last_name || null,
          role: role || 'standard',
          avatar_url: avatar_url || null,
          phone_number: phone_number || null,
          supervisor_id: supervisor_id || null,
          address: address || null,
          updated_at: new Date().toISOString(),
        };
        console.log(`[create-user] Upserting public.profiles for ${email} (ID: ${targetUserId}) with data:`, JSON.stringify(profileDataToUpsert));

        const { error: upsertProfileError } = await adminSupabase
          .from('profiles')
          .upsert(profileDataToUpsert, { onConflict: 'id' }); // Conflict on 'id' will update existing row

        if (upsertProfileError) {
          console.error(`[create-user] Error upserting public.profiles for ${email} (ID: ${targetUserId}):`, upsertProfileError.message);
          throw new Error(`Falha ao upsert perfil de usuário existente: ${upsertProfileError.message}`);
        }
        console.log(`[create-user] public.profiles upserted com sucesso para o usuário existente ${email} (ID: ${targetUserId}).`);

      } catch (e) {
        console.error('[create-user] Error caught during upsert of public.profiles:', e instanceof Error ? e.message : String(e));
        return new Response(JSON.stringify({ error: `Erro Interno do Servidor durante o upsert do perfil: ${e instanceof Error ? e.message : String(e)}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

    } else {
      // User does not exist, proceed with creation
      console.log(`[create-user] User ${email} not found. Attempting to create new user.`);
      if (!password || password.trim() === '') {
        console.error('[create-user] Bad Request: Password is required for new user creation.');
        return new Response(JSON.stringify({ error: 'Bad Request: Password is required for new user creation.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      try {
        const createUserOptions = {
          email,
          password,
          phone: phone_number || null, // Adicionado o campo 'phone' aqui
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
        };
        console.log('[create-user] Creating new user with options:', JSON.stringify(createUserOptions));

        const { data: newUser, error: createUserError } = await adminSupabase.auth.admin.createUser(createUserOptions);

        if (createUserError) {
          console.error('[create-user] Error creating user with admin.createUser:', createUserError.message); 
          throw new Error(createUserError.message);
        }
        targetUserId = newUser.user?.id || null;
        console.log('[create-user] New user created successfully:', targetUserId);

        // Explicitly upsert into public.profiles after creating the auth.users entry
        if (targetUserId) {
          const profileDataToUpsert = {
            id: targetUserId,
            first_name: first_name || null,
            last_name: last_name || null,
            role: role || 'standard',
            avatar_url: avatar_url || null,
            phone_number: phone_number || null,
            supervisor_id: supervisor_id || null,
            address: address || null,
            created_at: new Date().toISOString(), // Set created_at for new profiles
            updated_at: new Date().toISOString(),
          };
          console.log(`[create-user] Upserting public.profiles for new user (ID: ${targetUserId}) with data:`, JSON.stringify(profileDataToUpsert));

          const { error: upsertProfileError } = await adminSupabase
            .from('profiles')
            .upsert(profileDataToUpsert, { onConflict: 'id' }); // Use onConflict 'id' to handle potential race conditions or trigger issues

          if (upsertProfileError) {
            console.error(`[create-user] Error upserting public.profiles for new user (ID: ${targetUserId}):`, upsertProfileError.message);
            throw new Error(`Falha ao upsert perfil para novo usuário: ${upsertProfileError.message}`);
          }
          console.log(`[create-user] public.profiles upserted com sucesso para o novo usuário (ID: ${targetUserId}).`);
        }


      } catch (e) {
        console.error('[create-user] Error caught during createUser:', e instanceof Error ? e.message : String(e));
        return new Response(JSON.stringify({ error: `Erro Interno do Servidor durante a criação do usuário: ${e instanceof Error ? e.message : String(e)}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    if (!targetUserId) {
      console.error('[create-user] Operation completed, but no user ID was determined.');
      return new Response(JSON.stringify({ error: 'Erro Interno do Servidor: ID de usuário não determinado após a operação.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ message: `Usuário ${operationType} com sucesso`, userId: targetUserId, operation: operationType }), {
      status: 200, // Alterado para 200 OK para sucesso de criação e atualização
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[create-user] Unexpected error in Edge Function create-user:', error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ error: 'Erro Interno do Servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});