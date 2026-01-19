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
      // Log the full userError for debugging
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

    // Adjusted validation: last_name is optional
    if (!email || !password || !first_name || !role) {
      console.error('[create-user] Bad Request: Missing required fields in request body. Received:', { email, password: password ? '********' : 'N/A', first_name, last_name, role });
      return new Response(JSON.stringify({ error: 'Bad Request: Missing required fields (email, password, first_name, role)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Admin client for performing auth.admin operations (using service role key)
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('[create-user] Admin Supabase client initialized.');

    let targetUserId: string | null = null;
    let operationType: 'created' | 'updated' = 'created';

    // --- NOVO RECURSO: Chamada fetch direta para a API de Autenticação Admin do Supabase para verificar usuário existente ---
    console.log(`[create-user] Tentando fetch direto para a API de Autenticação Admin para o usuário ${email}`);
    let existingUserAuthData = null;
    try {
      const authAdminUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/admin/users?email=eq.${encodeURIComponent(email)}`;
      const authAdminResponse = await fetch(authAdminUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') ?? '', // Necessário para algumas chamadas da API Supabase
        },
      });

      if (!authAdminResponse.ok) {
        const errorText = await authAdminResponse.text();
        console.error(`[create-user] Fetch direto para a API de Autenticação Admin falhou com status ${authAdminResponse.status}: ${errorText}`);
        throw new Error(`Falha ao verificar usuário existente via API de Autenticação Admin: ${errorText}`);
      }

      const users = await authAdminResponse.json();
      if (users && users.length > 0) {
        existingUserAuthData = users[0]; // Pega o primeiro usuário se encontrado
        console.log(`[create-user] Usuário existente encontrado via fetch direto: ${existingUserAuthData.id}`);
      } else {
        console.log(`[create-user] Nenhum usuário existente encontrado via fetch direto para o e-mail: ${email}`);
      }
    } catch (e) {
      console.error('[create-user] Erro capturado durante a busca de usuário via API de Autenticação Admin:', e instanceof Error ? e.message : String(e));
      return new Response(JSON.stringify({ error: `Erro Interno do Servidor durante a busca de usuário: ${e instanceof Error ? e.message : String(e)}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    // --- FIM NOVO RECURSO ---

    if (existingUserAuthData?.id) {
      // Usuário já existe em auth.users
      targetUserId = existingUserAuthData.id;
      operationType = 'updated';
      console.log(`[create-user] Usuário ${email} já existe (ID: ${targetUserId}). Tentando atualizar o perfil.`);

      try {
        // Atualiza user_metadata em auth.users
        const { error: updateAuthUserError } = await adminSupabase.auth.admin.updateUserById(targetUserId, {
          email,
          password, // A atualização da senha é opcional, mas incluída se fornecida
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
          console.error(`[create-user] Erro ao atualizar auth.users para ${email} (ID: ${targetUserId}):`, updateAuthUserError.message);
          throw new Error(`Falha ao atualizar usuário existente na autenticação: ${updateAuthUserError.message}`);
        }
        console.log(`[create-user] user_metadata de auth.users atualizado com sucesso para ${email} (ID: ${targetUserId}).`);

      } catch (e) {
        console.error('[create-user] Erro capturado durante updateAuthUserById:', e instanceof Error ? e.message : String(e));
        return new Response(JSON.stringify({ error: `Erro Interno do Servidor durante a atualização do usuário de autenticação: ${e instanceof Error ? e.message : String(e)}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      try {
        // Também atualiza a tabela public.profiles diretamente, pois o trigger pode não ser acionado na atualização
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
          console.error(`[create-user] Erro ao atualizar public.profiles para ${email} (ID: ${targetUserId}):`, updateProfileError.message);
          throw new Error(`Falha ao atualizar perfil de usuário existente: ${updateProfileError.message}`);
        }
        console.log(`[create-user] public.profiles atualizado com sucesso para o usuário existente ${email} (ID: ${targetUserId}).`);

      } catch (e) {
        console.error('[create-user] Erro capturado durante a atualização de public.profiles:', e instanceof Error ? e.message : String(e));
        return new Response(JSON.stringify({ error: `Erro Interno do Servidor durante a atualização do perfil: ${e instanceof Error ? e.message : String(e)}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

    } else {
      // Usuário não existe, prossegue com a criação
      console.log(`[create-user] Usuário ${email} não encontrado. Tentando criar novo usuário.`);
      try {
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
          console.error('[create-user] Erro ao criar usuário com admin.createUser:', createUserError.message); 
          throw new Error(createUserError.message);
        }
        targetUserId = newUser.user?.id || null;
        console.log('[create-user] Novo usuário criado com sucesso:', targetUserId);

      } catch (e) {
        console.error('[create-user] Erro capturado durante createUser:', e instanceof Error ? e.message : String(e));
        return new Response(JSON.stringify({ error: `Erro Interno do Servidor durante a criação do usuário: ${e instanceof Error ? e.message : String(e)}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    if (!targetUserId) {
      console.error('[create-user] Operação concluída, mas nenhum ID de usuário foi determinado.');
      return new Response(JSON.stringify({ error: 'Erro Interno do Servidor: ID de usuário não determinado após a operação.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ message: `Usuário ${operationType} com sucesso`, userId: targetUserId, operation: operationType }), {
      status: 200, // Alterado para 200 OK para sucesso de criação e atualização
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[create-user] Erro inesperado na função Edge create-user:', error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ error: 'Erro Interno do Servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});