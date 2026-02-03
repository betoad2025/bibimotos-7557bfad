import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GetKeyRequest {
  franchise_id: string;
  service_name: string;
  environment?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { franchise_id, service_name, environment = 'production' }: GetKeyRequest = await req.json();

    if (!franchise_id || !service_name) {
      return new Response(
        JSON.stringify({ error: "Missing parameters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Use the get_api_key function which handles fallback to defaults
    const { data, error } = await supabase.rpc('get_api_key', {
      p_franchise_id: franchise_id,
      p_service_name: service_name,
      p_environment: environment
    });

    if (error) {
      console.error("Error getting API key:", error);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve API key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ 
          found: false, 
          message: "No API key configured for this service" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const keyData = data[0];

    return new Response(
      JSON.stringify({
        found: true,
        api_key: keyData.api_key,
        api_secret: keyData.api_secret,
        is_franchise_key: keyData.is_franchise_key,
        metadata: keyData.metadata
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
