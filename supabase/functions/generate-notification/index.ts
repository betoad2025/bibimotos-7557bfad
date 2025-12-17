import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                🏍️ Bibi Motos
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                ${franchiseName}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 24px 0; color: #111827; font-size: 24px; font-weight: 700; line-height: 1.3;">
                ${title}
              </h2>
              
              <div style="color: #374151; font-size: 16px; line-height: 1.8;">
                ${content.split('\n').map(p => `<p style="margin: 0 0 16px 0;">${p}</p>`).join('')}
              </div>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent, #e5e7eb, transparent);"></div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px; text-align: center;">
              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
                Dúvidas? Entre em contato conosco
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Este é um email oficial do sistema Bibi Motos.<br>
                © ${new Date().getFullYear()} Bibi Motos - Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Unsubscribe -->
        <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 11px; text-align: center;">
          Você está recebendo este email porque está cadastrado na plataforma Bibi Motos.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, prompt, content, franchise_name } = await req.json();

    if (action === "generate") {
      // Generate notification content with AI
      if (!LOVABLE_API_KEY) {
        throw new Error("AI service not configured");
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Você é um especialista em comunicação corporativa para a Bibi Motos, uma plataforma de mototáxi.
              
Suas mensagens devem ser:
- Profissionais mas amigáveis
- Diretas e claras
- Engajantes e motivadoras
- Sem erros gramaticais

IMPORTANTE: Gere um título CHAMATIVO e CURTO (máximo 50 caracteres) que funcione como hook para o email não ir pro spam e aumentar taxa de abertura.

Retorne APENAS um JSON com este formato:
{
  "title": "Título chamativo aqui",
  "content": "Conteúdo da mensagem aqui, pode ter múltiplos parágrafos separados por \\n"
}`
            },
            {
              role: "user",
              content: `Gere uma notificação/comunicado com base nas seguintes informações:\n\n${prompt}`
            }
          ],
          max_tokens: 1000,
        }),
      });

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "{}";
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const generated = JSON.parse(jsonMatch[0]);
        return new Response(
          JSON.stringify({
            success: true,
            title: generated.title,
            content: generated.content,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      throw new Error("Failed to parse AI response");
    }

    if (action === "modify") {
      // Modify existing content with AI
      if (!LOVABLE_API_KEY) {
        throw new Error("AI service not configured");
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Você é um especialista em comunicação corporativa para a Bibi Motos.
Modifique o conteúdo conforme solicitado, mantendo profissionalismo e clareza.

Retorne APENAS um JSON com este formato:
{
  "title": "Título modificado",
  "content": "Conteúdo modificado"
}`
            },
            {
              role: "user",
              content: `Conteúdo atual:\nTítulo: ${content.title}\nTexto: ${content.content}\n\nModificação solicitada: ${prompt}`
            }
          ],
          max_tokens: 1000,
        }),
      });

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "{}";
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const modified = JSON.parse(jsonMatch[0]);
        return new Response(
          JSON.stringify({
            success: true,
            title: modified.title,
            content: modified.content,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      throw new Error("Failed to parse AI response");
    }

    if (action === "preview_html") {
      // Generate HTML preview
      const html = generatePremiumEmailHTML(
        content.title,
        content.content,
        franchise_name || "Bibi Motos"
      );

      return new Response(
        JSON.stringify({
          success: true,
          html,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    console.error("Error in generate-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
