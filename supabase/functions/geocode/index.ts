import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeocodeRequest {
  action: 'geocode' | 'reverse' | 'autocomplete' | 'directions' | 'distance';
  address?: string;
  lat?: number;
  lng?: number;
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  input?: string;
  sessionToken?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: GeocodeRequest = await req.json();
    let result;

    switch (body.action) {
      case 'geocode': {
        if (!body.address) {
          return new Response(
            JSON.stringify({ error: 'Address is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(body.address)}&key=${apiKey}&language=pt-BR&region=br`;
        const response = await fetch(url);
        result = await response.json();
        break;
      }

      case 'reverse': {
        if (body.lat === undefined || body.lng === undefined) {
          return new Response(
            JSON.stringify({ error: 'Latitude and longitude are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${body.lat},${body.lng}&key=${apiKey}&language=pt-BR&region=br`;
        const response = await fetch(url);
        result = await response.json();
        break;
      }

      case 'autocomplete': {
        if (!body.input) {
          return new Response(
            JSON.stringify({ error: 'Input is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(body.input)}&key=${apiKey}&language=pt-BR&components=country:br`;
        if (body.sessionToken) {
          url += `&sessiontoken=${body.sessionToken}`;
        }
        const response = await fetch(url);
        result = await response.json();
        break;
      }

      case 'directions': {
        if (!body.origin || !body.destination) {
          return new Response(
            JSON.stringify({ error: 'Origin and destination are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${body.origin.lat},${body.origin.lng}&destination=${body.destination.lat},${body.destination.lng}&key=${apiKey}&language=pt-BR&mode=driving`;
        const response = await fetch(url);
        result = await response.json();
        break;
      }

      case 'distance': {
        if (!body.origin || !body.destination) {
          return new Response(
            JSON.stringify({ error: 'Origin and destination are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${body.origin.lat},${body.origin.lng}&destinations=${body.destination.lat},${body.destination.lng}&key=${apiKey}&language=pt-BR&mode=driving`;
        const response = await fetch(url);
        result = await response.json();
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Geocode error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
