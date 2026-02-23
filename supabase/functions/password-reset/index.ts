import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const COMTELE_API_KEY = Deno.env.get('COMTELE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!COMTELE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { phone, action, code, newPassword } = await req.json();

    if (action === 'request') {
      // Buscar usuário pelo telefone
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .eq('phone', phone)
        .single();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ success: false, error: 'Telefone não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Gerar código de 6 dígitos
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutos

      // Salvar código no banco (usar uma tabela de tokens ou campo temporário)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          // Usando campos existentes de forma temporária ou criar tabela específica
          // Por enquanto, vamos usar o metadata
        })
        .eq('user_id', profile.user_id);

      // Armazenar código em cache temporário (usando tabela auxiliar ou Redis no futuro)
      // Por simplicidade, vamos criar uma entrada na tabela de analytics para rastrear
      await supabase.from('analytics_events').insert({
        event_type: 'password_reset_request',
        event_data: { 
          code: resetCode, 
          expires_at: expiresAt,
          phone: phone 
        },
        user_id: profile.user_id
      });

      // Formatar telefone
      let formattedPhone = phone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('55')) {
        formattedPhone = '55' + formattedPhone;
      }

      // Enviar SMS via Comtele
      const smsResponse = await fetch('https://api.comtele.com.br/v2/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-key': COMTELE_API_KEY,
        },
        body: JSON.stringify({
          Sender: 'BibiMotos',
          Receivers: formattedPhone,
          Content: `Bibi Motos: Seu código de recuperação é ${resetCode}. Válido por 10 minutos. Não compartilhe.`,
        }),
      });

      const smsData = await smsResponse.json();
      console.log('SMS enviado:', smsData);

      return new Response(
        JSON.stringify({ success: true, message: 'Código enviado por SMS' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'verify') {
      // Verificar código
      // Buscar o profile para obter o user_id do telefone informado
      const { data: verifyProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('phone', phone)
        .single();

      if (!verifyProfile) {
        return new Response(
          JSON.stringify({ success: false, error: 'Telefone não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: events, error: eventError } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'password_reset_request')
        .eq('user_id', verifyProfile.user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (eventError || !events || events.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Código não encontrado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const event = events[0];
      const eventData = event.event_data as { code: string; expires_at: string; phone: string };

      if (eventData.phone !== phone || eventData.code !== code) {
        return new Response(
          JSON.stringify({ success: false, error: 'Código inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (new Date(eventData.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ success: false, error: 'Código expirado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Código válido', userId: event.user_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'reset') {
      // Redefinir senha
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('phone', phone)
        .single();

      if (!profile) {
        return new Response(
          JSON.stringify({ success: false, error: 'Usuário não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        profile.user_id,
        { password: newPassword }
      );

      if (updateError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Erro ao atualizar senha' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Limpar códigos antigos
      await supabase
        .from('analytics_events')
        .delete()
        .eq('event_type', 'password_reset_request')
        .eq('user_id', profile.user_id);

      return new Response(
        JSON.stringify({ success: true, message: 'Senha atualizada com sucesso' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
