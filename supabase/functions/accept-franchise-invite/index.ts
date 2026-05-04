import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// This function is called after a user completes registration via franchise invite.
// It finalizes the transfer: assigns role, sets franchise owner, marks invite accepted.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const body = await req.json();
    const { invite_id } = body;

    if (!invite_id) {
      return new Response(
        JSON.stringify({ error: "invite_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the invite
    const { data: invite, error: inviteError } = await supabase
      .from("franchise_invites")
      .select("*")
      .eq("id", invite_id)
      .eq("status", "pending")
      .single();

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({
          error: "Convite não encontrado ou já utilizado",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify email matches
    if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      return new Response(
        JSON.stringify({
          error:
            "O email da conta não corresponde ao email do convite",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 1. Assign franchise_admin role
    await supabase
      .from("user_roles")
      .upsert(
        { user_id: user.id, role: "franchise_admin" },
        { onConflict: "user_id,role" }
      );

    // 2. Transfer franchise ownership and capture city info for binding
    const { data: franchiseRow } = await supabase
      .from("franchises")
      .select("id, name, cities(name, state)")
      .eq("id", invite.franchise_id)
      .maybeSingle();

    await supabase
      .from("franchises")
      .update({ owner_id: user.id })
      .eq("id", invite.franchise_id);

    // 3. Mark invite as accepted
    await supabase
      .from("franchise_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        accepted_by: user.id,
      })
      .eq("id", invite_id);

    // 4. Update lead status
    if (invite.lead_id) {
      await supabase
        .from("franchise_leads")
        .update({ status: "converted" })
        .eq("id", invite.lead_id);
    }

    // 5. Record in transfer history
    await supabase.from("franchise_transfer_history").insert({
      franchise_id: invite.franchise_id,
      from_owner_id: null,
      to_owner_id: user.id,
      notes: `Transferência via convite. ${invite.notes || ""}`.trim(),
      drivers_count: 0,
      passengers_count: 0,
      merchants_count: 0,
    });

    // 6. Ensure profile completion is required
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const cityName = (franchiseRow as any)?.cities?.name ?? null;
    const stateName = (franchiseRow as any)?.cities?.state ?? null;

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          profile_complete: false,
          ...(cityName ? { city: cityName } : {}),
          ...(stateName ? { state: stateName } : {}),
        })
        .eq("user_id", user.id);
    } else {
      await supabase.from("profiles").insert({
        user_id: user.id,
        full_name: user.user_metadata?.full_name || "",
        email: user.email || "",
        profile_complete: false,
        ...(cityName ? { city: cityName } : {}),
        ...(stateName ? { state: stateName } : {}),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        franchise_id: invite.franchise_id,
        message:
          "Convite aceito! Complete seu cadastro para acessar o dashboard da franquia.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error accepting franchise invite:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
