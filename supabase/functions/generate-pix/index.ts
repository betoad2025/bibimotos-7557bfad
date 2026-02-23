import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { franchise_id, transaction_id, amount, description, action } = body;

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
      if (gateway === "asaas") {
        // Check with Asaas API
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
      const paymentRes = await fetch("https://api.asaas.com/v3/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: apiKey,
        },
        body: JSON.stringify({
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
          value: Math.round(amount * 100), // OpenPix uses cents
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
