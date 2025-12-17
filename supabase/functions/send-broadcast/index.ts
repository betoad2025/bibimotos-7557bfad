import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COMTELE_API_KEY = Deno.env.get("COMTELE_API_KEY");

async function sendSMS(phone: string, message: string): Promise<boolean> {
  if (!COMTELE_API_KEY) return false;

  const formattedPhone = phone.replace(/\D/g, "");
  
  try {
    const response = await fetch("https://sms.comtele.com.br/api/v2/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "auth-key": COMTELE_API_KEY,
      },
      body: JSON.stringify({
        sender: "BibiMotos",
        receivers: formattedPhone,
        content: message.substring(0, 160),
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
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
            <td style="padding: 32px; text-align: center; background-color: #f9fafb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Bibi Motos - Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      broadcast_id,
      franchise_id,
      title,
      content,
      recipient_type,
      recipient_filter,
      selected_user_ids,
      send_email,
      send_sms,
    } = await req.json();

    // Get franchise info
    const { data: franchise } = await supabase
      .from("franchises")
      .select("name")
      .eq("id", franchise_id)
      .single();

    const franchiseName = franchise 
      ? franchise.name
      : "Bibi Motos";

    // Get blocked users
    const { data: blockedUsers } = await supabase
      .from("notification_blocked_users")
      .select("user_id")
      .eq("franchise_id", franchise_id);

    const blockedUserIds = new Set(blockedUsers?.map(b => b.user_id) || []);

    // Build recipient query based on type and filters
    let recipients: any[] = [];

    if (selected_user_ids && selected_user_ids.length > 0) {
      // Specific users selected
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .in("user_id", selected_user_ids);
      
      recipients = profiles || [];
    } else {
      // Filter by recipient type
      if (recipient_type === "drivers" || recipient_type === "all") {
        let driversQuery = supabase
          .from("drivers")
          .select("user_id, profiles:user_id(full_name, email, phone)")
          .eq("franchise_id", franchise_id);

        // Apply filters
        if (recipient_filter?.is_approved !== undefined) {
          driversQuery = driversQuery.eq("is_approved", recipient_filter.is_approved);
        }
        if (recipient_filter?.is_online !== undefined) {
          driversQuery = driversQuery.eq("is_online", recipient_filter.is_online);
        }
        if (recipient_filter?.registration_complete !== undefined) {
          driversQuery = driversQuery.eq("registration_complete", recipient_filter.registration_complete);
        }

        const { data: drivers } = await driversQuery;
        if (drivers) {
          recipients.push(...drivers.map(d => ({
            user_id: d.user_id,
            ...d.profiles,
          })));
        }
      }

      if (recipient_type === "passengers" || recipient_type === "all") {
        const { data: passengers } = await supabase
          .from("passengers")
          .select("user_id, profiles:user_id(full_name, email, phone)")
          .eq("franchise_id", franchise_id);

        if (passengers) {
          recipients.push(...passengers.map(p => ({
            user_id: p.user_id,
            ...p.profiles,
          })));
        }
      }

      if (recipient_type === "merchants" || recipient_type === "all") {
        const { data: merchants } = await supabase
          .from("merchants")
          .select("user_id, profiles:user_id(full_name, email, phone)")
          .eq("franchise_id", franchise_id);

        if (merchants) {
          recipients.push(...merchants.map(m => ({
            user_id: m.user_id,
            ...m.profiles,
          })));
        }
      }
    }

    // Filter out blocked users and duplicates
    const uniqueRecipients = recipients.filter((r, index, self) => 
      r.user_id && 
      !blockedUserIds.has(r.user_id) &&
      index === self.findIndex(t => t.user_id === r.user_id)
    );

    console.log(`Sending to ${uniqueRecipients.length} recipients`);

    let sentCount = 0;
    const htmlContent = generatePremiumEmailHTML(title, content, franchiseName);

    for (const recipient of uniqueRecipients) {
      try {
        // Send SMS if enabled
        if (send_sms && recipient.phone) {
          const smsMessage = `📢 ${title.substring(0, 40)}... - ${content.substring(0, 80)}... - Bibi Motos`;
          await sendSMS(recipient.phone, smsMessage);
        }

        // Log email would be sent (integrate with email service later)
        if (send_email && recipient.email) {
          console.log(`Would send email to: ${recipient.email}`);
          // Here you would integrate with Resend or another email service
        }

        sentCount++;
      } catch (error) {
        console.error(`Error sending to ${recipient.email}:`, error);
      }
    }

    // Update broadcast record
    if (broadcast_id) {
      await supabase
        .from("notification_broadcasts")
        .update({
          sent_count: sentCount,
          status: "sent",
          sent_at: new Date().toISOString(),
          html_content: htmlContent,
        })
        .eq("id", broadcast_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent_count: sentCount,
        total_recipients: uniqueRecipients.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-broadcast:", error);
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
