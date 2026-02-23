import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getOrCreateAsaasCustomer(apiKey: string, supabase: any, driverId: string): Promise<string> {
  // Get driver -> user -> profile for CPF/name
  const { data: driver } = await supabase
    .from("drivers")
    .select("user_id")
    .eq("id", driverId)
    .single();

  if (!driver) throw new Error("Driver not found");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, cpf, email, phone")
    .eq("user_id", driver.user_id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const cpf = (profile.cpf || "").replace(/\D/g, "");
  const name = profile.full_name || "Motorista";

  // Try to find existing customer by CPF
  if (cpf) {
    const searchRes = await fetch(
      `https://api.asaas.com/v3/customers?cpfCnpj=${cpf}`,
      { headers: { access_token: apiKey } }
    );
    const searchData = await searchRes.json();
    if (searchData.data && searchData.data.length > 0) {
      return searchData.data[0].id;
    }
  }

  // Create new customer
  const createRes = await fetch("https://api.asaas.com/v3/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json", access_token: apiKey },
    body: JSON.stringify({
      name,
      cpfCnpj: cpf || undefined,
      email: profile.email || undefined,
      phone: (profile.phone || "").replace(/\D/g, "") || undefined,
    }),
  });
  const createData = await createRes.json();

  if (!createRes.ok) {
    console.error("Asaas customer creation error:", createData);
    throw new Error(createData.errors?.[0]?.description || "Failed to create Asaas customer");
  }

  return createData.id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { franchise_id, transaction_id, amount, description, action, driver_id } = body;

    if (!franchise_id) {
      return new Response(
        JSON.stringify({ error: "franchise_id is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get franchise gateway config
    const { data: franchise, error: fError } = await supabase
      .from("franchises")
      .select("payment_gateway, payment_api_key, payment_webhook_url")
      .eq("id", franchise_id)
      .single();

    if (fError || !franchise?.payment_api_key) {
      return new Response(
        JSON.stringify({ error: "Gateway not configured for this franchise" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const gateway = franchise.payment_gateway || "asaas";
    const apiKey = franchise.payment_api_key;

    // Check payment status
    if (action === "check_status") {
      const { data: tx } = await supabase
        .from("credit_transactions")
        .select("payment_id")
        .eq("id", transaction_id)
        .single();

      if (!tx?.payment_id) {
        return new Response(
          JSON.stringify({ status: "pending" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (gateway === "asaas") {
        const statusRes = await fetch(
          `https://api.asaas.com/v3/payments/${tx.payment_id}`,
          { headers: { access_token: apiKey } }
        );
        const statusData = await statusRes.json();
        return new Response(
          JSON.stringify({
            status: statusData.status === "RECEIVED" || statusData.status === "CONFIRMED"
              ? "paid" : "pending"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (gateway === "woovi" || gateway === "openpix") {
        const statusRes = await fetch(
          `https://api.openpix.com.br/api/v1/charge/${tx.payment_id}`,
          { headers: { Authorization: apiKey } }
        );
        const statusData = await statusRes.json();
        return new Response(
          JSON.stringify({
            status: statusData.charge?.status === "COMPLETED" ? "paid" : "pending"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ status: "pending" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate PIX
    if (gateway === "asaas") {
      // Get or create Asaas customer (required by API)
      let customerId: string;
      try {
        // Try to get driver_id from transaction if not provided
        let resolvedDriverId = driver_id;
        if (!resolvedDriverId && transaction_id) {
          const { data: tx } = await supabase
            .from("credit_transactions")
            .select("driver_id")
            .eq("id", transaction_id)
            .single();
          resolvedDriverId = tx?.driver_id;
        }
        if (!resolvedDriverId) throw new Error("driver_id required for Asaas");
        customerId = await getOrCreateAsaasCustomer(apiKey, supabase, resolvedDriverId);
      } catch (custError: any) {
        console.error("Customer creation error:", custError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar cliente no Asaas: " + custError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      const paymentRes = await fetch("https://api.asaas.com/v3/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: apiKey,
        },
        body: JSON.stringify({
          customer: customerId,
          billingType: "PIX",
          value: amount,
          description: description || "Créditos Bibi Motos",
          externalReference: transaction_id,
          dueDate: new Date(Date.now() + 30 * 60 * 1000).toISOString().split("T")[0],
        }),
      });

      const paymentData = await paymentRes.json();

      if (!paymentRes.ok) {
        console.error("Asaas error:", paymentData);
        return new Response(
          JSON.stringify({ error: paymentData.errors?.[0]?.description || "Asaas error" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      // Get PIX QR code
      const pixRes = await fetch(
        `https://api.asaas.com/v3/payments/${paymentData.id}/pixQrCode`,
        { headers: { access_token: apiKey } }
      );
      const pixData = await pixRes.json();

      return new Response(
        JSON.stringify({
          pix_code: pixData.payload || pixData.encodedImage,
          payment_id: paymentData.id,
          qr_code_image: pixData.encodedImage,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (gateway === "woovi" || gateway === "openpix") {
      const chargeRes = await fetch("https://api.openpix.com.br/api/v1/charge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify({
          correlationID: transaction_id,
          value: Math.round(amount * 100),
          comment: description || "Créditos Bibi Motos",
        }),
      });

      const chargeData = await chargeRes.json();

      if (!chargeRes.ok) {
        console.error("OpenPix error:", chargeData);
        return new Response(
          JSON.stringify({ error: chargeData.error || "OpenPix error" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({
          pix_code: chargeData.charge?.brCode,
          payment_id: chargeData.charge?.correlationID,
          qr_code_image: chargeData.charge?.qrCodeImage,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unsupported gateway: ${gateway}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
