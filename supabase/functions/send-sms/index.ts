import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  phone: string;
  message: string;
  type: 'welcome' | 'password_reset' | 'verification' | 'ride_notification' | 'general';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const COMTELE_API_KEY = Deno.env.get('COMTELE_API_KEY');
    
    if (!COMTELE_API_KEY) {
      console.error('COMTELE_API_KEY não configurada');
      return new Response(
        JSON.stringify({ success: false, error: 'Chave da API Comtele não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { phone, message, type }: SMSRequest = await req.json();

    if (!phone || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Telefone e mensagem são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Formata o telefone (remove caracteres especiais e adiciona código do país se necessário)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length === 11 && !formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    } else if (formattedPhone.length === 10 && !formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }

    console.log(`Enviando SMS tipo "${type}" para ${formattedPhone}`);

    // API Comtele - Envio de SMS
    const response = await fetch('https://api.comtele.com.br/v2/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-key': COMTELE_API_KEY,
      },
      body: JSON.stringify({
        Sender: 'BibiMotos',
        Receivers: formattedPhone,
        Content: message,
      }),
    });

    const data = await response.json();
    console.log('Resposta Comtele:', data);

    if (!response.ok || data.Success === false) {
      console.error('Erro ao enviar SMS:', data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.Message || 'Falha ao enviar SMS',
          details: data 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SMS enviado com sucesso',
        details: data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no envio de SMS:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
