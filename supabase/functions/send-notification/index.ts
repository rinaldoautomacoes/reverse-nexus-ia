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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized: Missing Authorization header', { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create a Supabase client with the user's JWT
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

    const { collectionId, type } = await req.json();

    if (!collectionId || !type) {
      return new Response('Bad Request: Missing collectionId or type', { status: 400, headers: corsHeaders });
    }

    // Fetch collection/delivery details
    const { data: collection, error: collectionError } = await userSupabase
      .from('coletas')
      .select(`
        parceiro,
        endereco_origem,
        endereco_destino,
        previsao_coleta,
        modelo_aparelho,
        qtd_aparelhos_solicitado,
        type,
        responsible_user_id
      `)
      .eq('id', collectionId)
      .eq('user_id', user.id) // Ensure RLS is respected
      .single();

    if (collectionError || !collection) {
      console.error(`Error fetching ${type} ${collectionId}:`, collectionError?.message);
      return new Response(JSON.stringify({ error: `Could not find ${type} or unauthorized.` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!collection.responsible_user_id) {
      return new Response(JSON.stringify({ message: `No responsible user assigned for this ${type}. Notification skipped.` }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch responsible user's phone number
    const { data: responsibleProfile, error: profileError } = await userSupabase
      .from('profiles')
      .select('first_name, phone_number')
      .eq('id', collection.responsible_user_id)
      .single();

    if (profileError || !responsibleProfile || !responsibleProfile.phone_number) {
      console.warn(`Responsible user ${collection.responsible_user_id} not found or no phone number for notification.`);
      return new Response(JSON.stringify({ message: `Responsible user not found or no phone number for notification. Notification skipped.` }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const appointmentType = collection.type === 'coleta' ? 'coleta' : 'entrega';
    const partnerName = collection.parceiro || 'Cliente';
    const appointmentDate = collection.previsao_coleta ? new Date(collection.previsao_coleta).toLocaleDateString('pt-BR') : 'data não informada';
    const materialType = collection.modelo_aparelho || 'material';
    const quantity = collection.qtd_aparelhos_solicitado || 0;
    const address = collection.endereco_origem || collection.endereco_destino || 'endereço não informado';

    const message = `Olá ${responsibleProfile.first_name},\n\nVocê tem uma nova ${appointmentType} agendada!\n\nDetalhes:\n- Tipo: ${appointmentType.charAt(0).toUpperCase() + appointmentType.slice(1)}\n- Cliente: ${partnerName}\n- Data: ${appointmentDate}\n- Endereço: ${address}\n- Material: ${materialType} (${quantity} unid.)\n\nPor favor, verifique os detalhes na plataforma LogiReverseIA.`;

    // --- SIMULAÇÃO DE ENVIO DE NOTIFICAÇÃO ---
    console.log(`--- NOTIFICAÇÃO PARA ${responsibleProfile.first_name} (${responsibleProfile.phone_number}) ---`);
    console.log(message);
    console.log('----------------------------------------------------');
    // Para integrar com um serviço real de SMS/WhatsApp (ex: Twilio, Vonage),
    // você faria uma requisição HTTP para a API deles aqui.
    // Exemplo (Twilio):
    // await fetch('https://api.twilio.com/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Messages.json', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //     'Authorization': 'Basic ' + btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`)
    //   },
    //   body: new URLSearchParams({
    //     To: responsibleProfile.phone_number,
    //     From: Deno.env.get('TWILIO_PHONE_NUMBER'),
    //     Body: message
    //   }).toString()
    // });

    return new Response(JSON.stringify({ message: `Notification simulated for ${responsibleProfile.first_name} at ${responsibleProfile.phone_number}` }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error in send-notification edge function:', error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});