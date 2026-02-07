import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseLocationTrackingProps {
  rideId: string;
  driverId: string;
  isActive: boolean;
  intervalMs?: number;
}

export function useLocationTracking({
  rideId,
  driverId,
  isActive,
  intervalMs = 10000, // 10 seconds default
}: UseLocationTrackingProps) {
  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  const logLocation = useCallback(
    async (lat: number, lng: number, speed?: number, heading?: number, accuracy?: number) => {
      // Only log if position changed significantly (more than 10 meters)
      if (lastPositionRef.current) {
        const distance = calculateDistance(
          lastPositionRef.current.lat,
          lastPositionRef.current.lng,
          lat,
          lng
        );
        if (distance < 0.01) return; // Less than 10 meters
      }

      lastPositionRef.current = { lat, lng };

      try {
        await supabase.from("ride_location_logs").insert({
          ride_id: rideId,
          driver_id: driverId,
          lat,
          lng,
          speed: speed || null,
          heading: heading || null,
          accuracy: accuracy || null,
        });

        // Also update driver's current location
        await supabase
          .from("drivers")
          .update({ current_lat: lat, current_lng: lng })
          .eq("id", driverId);
      } catch (error) {
        console.error("Error logging location:", error);
      }
    },
    [rideId, driverId]
  );

  useEffect(() => {
    if (!isActive || !navigator.geolocation) return;

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        logLocation(
          position.coords.latitude,
          position.coords.longitude,
          position.coords.speed || undefined,
          position.coords.heading || undefined,
          position.coords.accuracy || undefined
        );
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isActive, logLocation]);

  return null;
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
