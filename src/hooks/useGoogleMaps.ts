import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface AutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface DirectionsResult {
  distance: number; // in km
  duration: number; // in minutes
  polyline: string;
  steps: { instruction: string; distance: string; duration: string }[];
}

// Haversine formula to calculate straight-line distance between two points
function calculateHaversineDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useGoogleMaps() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocode = useCallback(async (address: string): Promise<Location | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('geocode', {
        body: { action: 'geocode', address },
      });

      if (fnError) throw fnError;

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          address: result.formatted_address,
        };
      }
      return null;
    } catch (err: any) {
      setError(err.message);
      console.error('Geocode error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('geocode', {
        body: { action: 'reverse', lat, lng },
      });

      if (fnError) throw fnError;

      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return null;
    } catch (err: any) {
      setError(err.message);
      console.error('Reverse geocode error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const autocomplete = useCallback(async (input: string, sessionToken?: string): Promise<AutocompleteResult[]> => {
    if (input.length < 3) return [];
    
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('geocode', {
        body: { action: 'autocomplete', input, sessionToken },
      });

      if (fnError) throw fnError;

      if (data.predictions) {
        return data.predictions.map((p: any) => ({
          placeId: p.place_id,
          description: p.description,
          mainText: p.structured_formatting?.main_text || p.description,
          secondaryText: p.structured_formatting?.secondary_text || '',
        }));
      }
      return [];
    } catch (err: any) {
      setError(err.message);
      console.error('Autocomplete error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getDirections = useCallback(async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<DirectionsResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('geocode', {
        body: { action: 'directions', origin, destination },
      });

      if (fnError) throw fnError;

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        return {
          distance: leg.distance.value / 1000, // Convert meters to km
          duration: Math.ceil(leg.duration.value / 60), // Convert seconds to minutes
          polyline: route.overview_polyline.points,
          steps: leg.steps.map((s: any) => ({
            instruction: s.html_instructions.replace(/<[^>]*>/g, ''),
            distance: s.distance.text,
            duration: s.duration.text,
          })),
        };
      }
      
      // Fallback: Calculate straight-line distance
      const straightLineDistance = calculateHaversineDistance(origin, destination);
      const estimatedRoadDistance = straightLineDistance * 1.3; // Road distance is typically 30% more
      const estimatedDuration = Math.ceil(estimatedRoadDistance / 30 * 60); // Assume 30km/h average
      
      return {
        distance: Math.round(estimatedRoadDistance * 100) / 100,
        duration: estimatedDuration,
        polyline: '',
        steps: [],
      };
    } catch (err: any) {
      setError(err.message);
      console.error('Directions error:', err);
      
      // Fallback calculation
      const straightLineDistance = calculateHaversineDistance(origin, destination);
      const estimatedRoadDistance = straightLineDistance * 1.3;
      const estimatedDuration = Math.ceil(estimatedRoadDistance / 30 * 60);
      
      return {
        distance: Math.round(estimatedRoadDistance * 100) / 100,
        duration: estimatedDuration,
        polyline: '',
        steps: [],
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const getDistance = useCallback(async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{ distance: number; duration: number } | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('geocode', {
        body: { action: 'distance', origin, destination },
      });

      if (fnError) throw fnError;

      if (data.rows && data.rows.length > 0 && data.rows[0].elements && data.rows[0].elements[0].status === 'OK') {
        const element = data.rows[0].elements[0];
        return {
          distance: element.distance.value / 1000, // km
          duration: Math.ceil(element.duration.value / 60), // minutes
        };
      }
      
      // Fallback: Calculate straight-line distance
      const straightLineDistance = calculateHaversineDistance(origin, destination);
      const estimatedRoadDistance = straightLineDistance * 1.3;
      const estimatedDuration = Math.ceil(estimatedRoadDistance / 30 * 60);
      
      return {
        distance: Math.round(estimatedRoadDistance * 100) / 100,
        duration: estimatedDuration,
      };
    } catch (err: any) {
      setError(err.message);
      console.error('Distance error:', err);
      
      // Fallback calculation
      const straightLineDistance = calculateHaversineDistance(origin, destination);
      const estimatedRoadDistance = straightLineDistance * 1.3;
      const estimatedDuration = Math.ceil(estimatedRoadDistance / 30 * 60);
      
      return {
        distance: Math.round(estimatedRoadDistance * 100) / 100,
        duration: estimatedDuration,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const getCurrentLocation = useCallback((): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError('Geolocalização não suportada');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError('Não foi possível obter sua localização');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  return {
    loading,
    error,
    geocode,
    reverseGeocode,
    autocomplete,
    getDirections,
    getDistance,
    getCurrentLocation,
  };
}
