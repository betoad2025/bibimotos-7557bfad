import { createClient } from "npm:@supabase/supabase-js@2";
import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { InviteEmail } from "../_shared/email-templates/invite.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is authenticated super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check super_admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { franchise_id, lead_id, email, phone, name, notes } = body;

    if (!franchise_id || !email) {
      return new Response(
        JSON.stringify({ error: "franchise_id and email are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get franchise info
    const { data: franchise } = await supabase
      .from("franchises")
      .select("name, cities(name, state)")
      .eq("id", franchise_id)
      .single();

    if (!franchise) {
      return new Response(JSON.stringify({ error: "Franchise not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create invite record
    const { data: invite, error: inviteError } = await supabase
      .from("franchise_invites")
      .insert({
        franchise_id,
        lead_id: lead_id || null,
        email,
        phone: phone || null,
        invited_by: user.id,
        notes: notes || null,
        status: "pending",
      })
      .select()
      .single();

    if (inviteError) {
      // Likely duplicate active invite
      if (inviteError.code === "23505") {
        return new Response(
          JSON.stringify({
            error:
              "Já existe um convite pendente para esta franquia. Cancele o anterior primeiro.",
          }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw inviteError;
    }

    // Generate invite link with token
    const siteUrl = "https://www.bibimotos.com.br";
    const inviteUrl = `${siteUrl}/register?invite=${invite.id}&role=franchise_admin&email=${encodeURIComponent(email)}`;

    // Render branded email
    const cityInfo = (franchise as any).cities;
    const franchiseName = franchise.name;
    const cityName = cityInfo ? `${cityInfo.name}/${cityInfo.state}` : "";

    const html = await renderAsync(
      React.createElement(InviteEmail, {
        siteName: "Bibi Motos",
        siteUrl: siteUrl,
        confirmationUrl: inviteUrl,
      })
    );

    // Send email via Supabase Auth invite (creates user account)
    const { data: authData, error: authError } =
      await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: inviteUrl,
        data: {
          full_name: name || "",
          franchise_invite_id: invite.id,
          franchise_id: franchise_id,
          role: "franchise_admin",
        },
      });

    if (authError) {
      // If user already exists, update the invite to reflect that
      if (authError.message?.includes("already been registered")) {
        // User exists but was shown as lead - find their user_id and do direct transfer
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(
          (u: any) => u.email === email
        );

        if (existingUser) {
          // Update invite as accepted immediately
          await supabase
            .from("franchise_invites")
            .update({
              status: "accepted",
              accepted_at: new Date().toISOString(),
              accepted_by: existingUser.id,
            })
            .eq("id", invite.id);

          // Assign franchise_admin role
          await supabase
            .from("user_roles")
            .upsert(
              { user_id: existingUser.id, role: "franchise_admin" },
              { onConflict: "user_id,role" }
            );

          // Transfer franchise ownership
          await supabase
            .from("franchises")
            .update({ owner_id: existingUser.id })
            .eq("id", franchise_id);

          // Ensure profile exists
          const { data: profileExists } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", existingUser.id)
            .maybeSingle();

          if (!profileExists) {
            await supabase.from("profiles").insert({
              user_id: existingUser.id,
              full_name: name || "",
              email: email,
              phone: phone || null,
              profile_complete: false,
            });
          } else {
            // Force profile completion check
            await supabase
              .from("profiles")
              .update({ profile_complete: false })
              .eq("user_id", existingUser.id);
          }

          return new Response(
            JSON.stringify({
              success: true,
              method: "direct_transfer",
              message: `Usuário já cadastrado. Franquia transferida diretamente para ${email}. O novo dono deverá completar o cadastro no próximo acesso.`,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      // Clean up invite on auth error
      await supabase.from("franchise_invites").delete().eq("id", invite.id);
      throw authError;
    }

    // Update lead status if applicable
    if (lead_id) {
      await supabase
        .from("franchise_leads")
        .update({ status: "invited" })
        .eq("id", lead_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        method: "invite_sent",
        invite_id: invite.id,
        message: `Convite enviado para ${email}. Quando o convidado completar o cadastro, a franquia será transferida automaticamente.`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending franchise invite:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
