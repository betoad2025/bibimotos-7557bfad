import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getApiKey(supabase: any, serviceName: string): Promise<string | null> {
  try {
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

async function sendSMS(supabase: any, phone: string, message: string) {
  const comteleKey = await getApiKey(supabase, "comtele");
  if (!comteleKey) {
    console.error("COMTELE API Key não configurada no painel");
    return false;
  }

  const formattedPhone = phone.replace(/\D/g, "");
  try {
    const response = await fetch("https://sms.comtele.com.br/api/v2/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "auth-key": comteleKey,
      },
      body: JSON.stringify({
        sender: "BibiMotos",
        receivers: formattedPhone,
        content: message,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
}

 async function callOpenAI(apiKey: string, prompt: string, imageUrls: string[]): Promise<string> {
   const messages = [
     {
       role: "user",
       content: [
         { type: "text", text: prompt },
         ...imageUrls.filter(Boolean).map(url => ({
           type: "image_url",
           image_url: { url: url }
         }))
       ]
     }
   ];
 
   const response = await fetch("https://api.openai.com/v1/chat/completions", {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
       "Authorization": `Bearer ${apiKey}`,
     },
     body: JSON.stringify({
       model: "gpt-4o",
       messages: messages,
       response_format: { type: "json_object" },
     }),
   });
 
   const data = await response.json();
   return data.choices?.[0]?.message?.content || "{}";
 }
 
 async function extractDocumentData(supabase: any, imageUrls: string[]): Promise<any> {
   const googleAiKey = await getApiKey(supabase, "google_ai");
   const openaiKey = await getApiKey(supabase, "openai");
   
   if (!googleAiKey && !openaiKey) {
     console.log("Nenhuma API Key de IA configurada, pulando extração");
     return {};
   }
 
   try {
    const prompt = `Analise as imagens de documentos enviadas e extraia as seguintes informações em JSON:
- nome_completo: nome do motorista
- cpf: número do CPF
- cnh_numero: número da CNH
- cnh_categoria: categoria da CNH (A, B, AB, etc)
- cnh_validade: data de validade
- veiculo_placa: placa do veículo se visível
- veiculo_modelo: modelo do veículo se visível
- documento_pago: se o documento de pagamento está em dia (true/false)

Retorne APENAS o JSON, sem explicações.`;

    const parts: any[] = [{ text: prompt }];
    for (const url of imageUrls.filter(Boolean)) {
      parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: await fetchImageAsBase64(url),
        },
      });
    }

     let text = "{}";
     if (openaiKey) {
       text = await callOpenAI(openaiKey, prompt, imageUrls);
     } else if (googleAiKey) {
       const parts: any[] = [{ text: prompt }];
       for (const url of imageUrls.filter(Boolean)) {
         parts.push({
           inline_data: {
             mime_type: "image/jpeg",
             data: await fetchImageAsBase64(url),
           },
         });
       }
 
       const response = await fetch(
         `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleAiKey}`,
         {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
             contents: [{ role: "user", parts }],
             generationConfig: { maxOutputTokens: 1000 },
           }),
         }
       );
 
       const data = await response.json();
       text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
     }
 
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return {};
  } catch (error) {
    console.error("Error extracting document data:", error);
    return {};
  }
}

async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch {
    return "";
  }
}

function generateEmailHTML(driverName: string, extractedData: any, franchiseName: string): string {
  const dataRows = Object.entries(extractedData)
    .map(([key, value]) => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; text-transform: capitalize;">
          ${key.replace(/_/g, ' ')}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
          ${value || 'Não identificado'}
        </td>
      </tr>
    `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <tr><td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🏍️ Bibi Motos</h1>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${franchiseName}</p>
        </td></tr>
        <tr><td style="padding: 24px 32px 0 32px;">
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 16px; text-align: center; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-weight: 700; font-size: 16px;">⚡ AÇÃO NECESSÁRIA</p>
            <p style="margin: 4px 0 0 0; color: #a16207; font-size: 14px;">Novo motorista aguardando aprovação</p>
          </div>
        </td></tr>
        <tr><td style="padding: 32px;">
          <h2 style="margin: 0 0 8px 0; color: #111827; font-size: 22px; font-weight: 700;">${driverName}</h2>
          <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">Finalizou o cadastro e está aguardando sua análise.</p>
          <div style="background-color: #f9fafb; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
            <div style="background-color: #7c3aed; padding: 12px 16px;">
              <h3 style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 600; text-transform: uppercase;">📋 Dados Extraídos por IA</h3>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${dataRows || '<tr><td style="padding: 16px; color: #6b7280; text-align: center;">Nenhum dado extraído</td></tr>'}
            </table>
          </div>
          <div style="text-align: center; margin-top: 32px;">
            <a href="#" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 700; font-size: 16px;">Analisar Cadastro</a>
          </div>
        </td></tr>
        <tr><td style="background-color: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Bibi Motos - Todos os direitos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { driver_id, franchise_id } = await req.json();
    if (!driver_id || !franchise_id) throw new Error("driver_id and franchise_id are required");

    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select(`*, profiles:user_id (full_name, email, phone, avatar_url)`)
      .eq("id", driver_id)
      .single();

    if (driverError || !driver) throw new Error("Driver not found");

    const { data: franchise, error: franchiseError } = await supabase
      .from("franchises")
      .select(`*, cities (name, state), owner:owner_id (full_name, email, phone)`)
      .eq("id", franchise_id)
      .single();

    if (franchiseError || !franchise) throw new Error("Franchise not found");

    const documentUrls = [
      driver.cnh_front_url, driver.cnh_back_url, driver.motorcycle_photo_url,
      driver.motorcycle_plate_photo_url, driver.insurance_document_url,
    ].filter(Boolean);

    const extractedData = await extractDocumentData(supabase, documentUrls);

    await supabase.from("driver_approval_requests").insert({
      driver_id, franchise_id,
      extracted_data: extractedData,
      notification_sent: true,
      notification_sent_at: new Date().toISOString(),
    });

    const driverName = driver.profiles?.full_name || "Novo Motorista";
    const franchiseName = `${franchise.name} - ${franchise.cities?.name}/${franchise.cities?.state}`;
    const ownerPhone = franchise.owner?.phone;
    const ownerEmail = franchise.owner?.email;

    if (ownerPhone) {
      const smsMessage = `🏍️ BIBI MOTOS: Novo motorista ${driverName} aguardando aprovação na sua franquia.`;
      await sendSMS(supabase, ownerPhone, smsMessage);
    }

    const emailHTML = generateEmailHTML(driverName, extractedData, franchiseName);
    console.log("Email HTML generated for:", ownerEmail);

    await supabase.from("analytics_events").insert({
      event_type: "driver_registration_notification",
      franchise_id,
      event_data: { driver_id, driver_name: driverName, owner_email: ownerEmail, extracted_data: extractedData },
    });

    return new Response(JSON.stringify({ success: true, message: "Notification sent", extracted_data: extractedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in notify-driver-registration:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
