import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: '🏍️ Falta pouco para você começar na Bibi Motos!',
  invite: '🎉 Você foi convidado para a Bibi Motos!',
  magiclink: '🔑 Seu acesso rápido — Bibi Motos',
  recovery: '🔐 Sua nova senha está aqui — Bibi Motos',
  email_change: '📧 Confirme a alteração do seu email — Bibi Motos',
  reauthentication: '🔒 Seu código de verificação — Bibi Motos',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

const SITE_NAME = "bibimotos"
const ROOT_DOMAIN = "www.bibimotos.com.br"
const FROM_EMAIL = `${SITE_NAME} <noreply@${ROOT_DOMAIN}>`

async function getResendApiKey(): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data } = await supabase
      .from("default_api_keys")
      .select("api_key_encrypted")
      .eq("service_name", "resend")
      .eq("environment", "production")
      .eq("is_active", true)
      .maybeSingle();

    return data?.api_key_encrypted || null;
  } catch {
    return null;
  }
}

async function sendEmailViaResend(
  apiKey: string,
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<{ message_id?: string }> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errorBody}`);
  }

  const result = await response.json();
  return { message_id: result.id };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload = await req.json();

    // Support both direct call and Supabase auth hook format
    const emailType = payload.action_type || payload.data?.action_type || payload.type;
    const email = payload.email || payload.data?.email;
    const confirmationUrl = payload.url || payload.data?.url || payload.confirmation_url;
    const token = payload.token || payload.data?.token;
    const newEmail = payload.new_email || payload.data?.new_email;

    if (!emailType || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing email type or recipient' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing email:', { emailType, email });

    const EmailTemplate = EMAIL_TEMPLATES[emailType];
    if (!EmailTemplate) {
      return new Response(
        JSON.stringify({ error: `Unknown email type: ${emailType}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = await getResendApiKey();
    if (!resendApiKey) {
      console.error('Resend API Key não configurada no painel Super Admin');
      return new Response(
        JSON.stringify({ error: 'Email service not configured. Add Resend API Key in Super Admin settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const templateProps = {
      siteName: SITE_NAME,
      siteUrl: `https://${ROOT_DOMAIN}`,
      recipient: email,
      confirmationUrl: confirmationUrl,
      token: token,
      email: email,
      newEmail: newEmail,
    };

    const html = await renderAsync(React.createElement(EmailTemplate, templateProps));
    const text = await renderAsync(React.createElement(EmailTemplate, templateProps), { plainText: true });

    const subject = EMAIL_SUBJECTS[emailType] || 'Notificação — Bibi Motos';

    const result = await sendEmailViaResend(resendApiKey, email, subject, html, text);

    console.log('Email sent via Resend:', { message_id: result.message_id, emailType, email });

    return new Response(
      JSON.stringify({ success: true, message_id: result.message_id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Email hook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
