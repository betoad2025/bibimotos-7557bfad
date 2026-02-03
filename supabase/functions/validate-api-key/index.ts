import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidationRequest {
  franchise_id: string;
  service_name: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { franchise_id, service_name }: ValidationRequest = await req.json();

    if (!franchise_id || !service_name) {
      return new Response(
        JSON.stringify({ valid: false, error: "Missing parameters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get the API key for this franchise and service
    const { data: keyData, error: keyError } = await supabase
      .from('franchise_api_keys')
      .select('api_key_encrypted, api_secret_encrypted')
      .eq('franchise_id', franchise_id)
      .eq('service_name', service_name)
      .single();

    if (keyError || !keyData) {
      return new Response(
        JSON.stringify({ valid: false, error: "Chave não encontrada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const apiKey = keyData.api_key_encrypted;
    let valid = false;
    let error = "";

    // Validate based on service type
    switch (service_name) {
      case 'asaas':
        try {
          const response = await fetch("https://api.asaas.com/v3/customers?limit=1", {
            headers: { "access_token": apiKey }
          });
          valid = response.ok;
          if (!valid) error = "Chave Asaas inválida ou sem permissões";
        } catch (e) {
          error = "Erro ao conectar com Asaas";
        }
        break;

      case 'woovi':
        try {
          const response = await fetch("https://api.openpix.com.br/api/v1/account", {
            headers: { "Authorization": apiKey }
          });
          valid = response.ok;
          if (!valid) error = "Chave Woovi/OpenPix inválida";
        } catch (e) {
          error = "Erro ao conectar com Woovi";
        }
        break;

      case 'openai':
        try {
          const response = await fetch("https://api.openai.com/v1/models", {
            headers: { "Authorization": `Bearer ${apiKey}` }
          });
          valid = response.ok;
          if (!valid) error = "Chave OpenAI inválida";
        } catch (e) {
          error = "Erro ao conectar com OpenAI";
        }
        break;

      case 'anthropic':
        try {
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json"
            },
            body: JSON.stringify({
              model: "claude-3-haiku-20240307",
              max_tokens: 10,
              messages: [{ role: "user", content: "Hi" }]
            })
          });
          // Anthropic returns 200 for valid keys (even if quota issues)
          valid = response.status !== 401;
          if (!valid) error = "Chave Anthropic inválida";
        } catch (e) {
          error = "Erro ao conectar com Anthropic";
        }
        break;

      case 'comtele':
        try {
          const response = await fetch(`https://api.comtele.com.br/api/v2/credits`, {
            headers: { "auth-key": apiKey }
          });
          valid = response.ok;
          if (!valid) error = "Chave Comtele inválida";
        } catch (e) {
          error = "Erro ao conectar com Comtele";
        }
        break;

      case 'resend':
        try {
          const response = await fetch("https://api.resend.com/domains", {
            headers: { "Authorization": `Bearer ${apiKey}` }
          });
          valid = response.ok;
          if (!valid) error = "Chave Resend inválida";
        } catch (e) {
          error = "Erro ao conectar com Resend";
        }
        break;

      default:
        error = "Serviço não suportado para validação";
    }

    // Log validation attempt
    await supabase.from('api_key_audit_log').insert({
      franchise_id,
      service_name,
      action: valid ? 'validated' : 'invalidated',
      new_values: { valid, error: error || null }
    });

    return new Response(
      JSON.stringify({ valid, error: valid ? null : error }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ valid: false, error: "Erro interno" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
