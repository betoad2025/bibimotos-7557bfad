import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

 async function getApiKey(serviceName: string): Promise<string | null> {
   try {
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     const { data } = await supabase
       .from("default_api_keys")
       .select("api_key_encrypted")
       .eq("service_name", serviceName)
       .eq("environment", "production")
       .eq("is_active", true)
       .maybeSingle();
 
     return data?.api_key_encrypted || null;
   } catch {
     return null;
   }
 }

function generatePremiumEmailHTML(title: string, content: string, franchiseName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🏍️ Bibi Motos</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${franchiseName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 24px 0; color: #111827; font-size: 24px; font-weight: 700;">${title}</h2>
              <div style="color: #374151; font-size: 16px; line-height: 1.8;">
                ${content.split('\n').map(p => `<p style="margin: 0 0 16px 0;">${p}</p>`).join('')}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px;"><div style="height: 1px; background: linear-gradient(90deg, transparent, #e5e7eb, transparent);"></div></td>
          </tr>
          <tr>
            <td style="padding: 32px; text-align: center;">
              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">Dúvidas? Entre em contato conosco</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} Bibi Motos - Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

 async function callGeminiAI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
   const response = await fetch(
     `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
     {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
         contents: [
           { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
         ],
         generationConfig: { maxOutputTokens: 1000 },
       }),
     }
   );
 
   const data = await response.json();
   return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
 }
 
 async function callOpenAI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
   const response = await fetch("https://api.openai.com/v1/chat/completions", {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
       "Authorization": `Bearer ${apiKey}`,
     },
     body: JSON.stringify({
       model: "gpt-4o",
       messages: [
         { role: "system", content: systemPrompt },
         { role: "user", content: userPrompt },
       ],
       response_format: { type: "json_object" },
     }),
   });
 
   const data = await response.json();
   return data.choices?.[0]?.message?.content || "{}";
 }

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, prompt, content, franchise_name } = await req.json();

     if (action === "generate") {
       const openaiKey = await getApiKey("openai");
       const googleAiKey = await getApiKey("google_ai");
       
       if (!openaiKey && !googleAiKey) {
         throw new Error("Nenhuma API Key de IA configurada (Google ou OpenAI). Acesse o painel Super Admin.");
       }
 
       const systemPrompt = `Você é um especialista em comunicação corporativa para a Bibi Motos, uma plataforma de mototáxi.
Suas mensagens devem ser profissionais mas amigáveis, diretas e engajantes.
IMPORTANTE: Gere um título CHAMATIVO e CURTO (máximo 50 caracteres).
Retorne APENAS um JSON: {"title": "...", "content": "..."}`;

       let text = "{}";
       if (openaiKey) {
         text = await callOpenAI(openaiKey, systemPrompt, `Gere uma notificação/comunicado:\n\n${prompt}`);
       } else if (googleAiKey) {
         text = await callGeminiAI(googleAiKey, systemPrompt, `Gere uma notificação/comunicado:\n\n${prompt}`);
       }
 
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const generated = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify({ success: true, title: generated.title, content: generated.content }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to parse AI response");
    }

    if (action === "modify") {
      const apiKey = await getGoogleAiKey();
      if (!apiKey) {
        throw new Error("Google AI API Key não configurada.");
      }

      const systemPrompt = `Você é um especialista em comunicação corporativa para a Bibi Motos.
Modifique o conteúdo conforme solicitado, mantendo profissionalismo.
Retorne APENAS um JSON: {"title": "...", "content": "..."}`;

      const text = await callGeminiAI(
        apiKey,
        systemPrompt,
        `Conteúdo atual:\nTítulo: ${content.title}\nTexto: ${content.content}\n\nModificação: ${prompt}`
      );
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const modified = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify({ success: true, title: modified.title, content: modified.content }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to parse AI response");
    }

    if (action === "preview_html") {
      const html = generatePremiumEmailHTML(content.title, content.content, franchise_name || "Bibi Motos");
      return new Response(JSON.stringify({ success: true, html }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    console.error("Error in generate-notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
