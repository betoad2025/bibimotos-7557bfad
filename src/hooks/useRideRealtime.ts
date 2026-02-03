import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type RideStatus = Database['public']['Enums']['ride_status'];

export interface RideData {
  id: string;
  franchise_id: string;
  passenger_id: string | null;
  driver_id: string | null;
  status: RideStatus;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  distance_km: number | null;
  estimated_price: number | null;
  final_price: number | null;
  driver_rating: number | null;
  passenger_rating: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface DriverInfo {
  id: string;
  name: string;
  avatarUrl: string | null;
  rating: number;
  totalRides: number;
  phone: string | null;
  vehicleModel: string | null;
  vehiclePlate: string | null;
  vehicleColor: string | null;
  currentLat: number | null;
  currentLng: number | null;
}

export interface PassengerInfo {
  id: string;
  name: string;
  avatarUrl: string | null;
  rating: number;
  totalRides: number;
  phone: string | null;
}

export function useRideRealtime(rideId: string | null) {
  const [ride, setRide] = useState<RideData | null>(null);
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [passenger, setPassenger] = useState<PassengerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchRideDetails = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { data: rideData, error } = await supabase
        .from('rides')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setRide(rideData as RideData);

      // Fetch driver info if assigned
      if (rideData.driver_id) {
        const { data: driverData } = await supabase
          .from('drivers')
          .select('*, profiles:user_id(full_name, avatar_url, phone)')
          .eq('id', rideData.driver_id)
          .single();

        if (driverData) {
          const profile = driverData.profiles as any;
          setDriver({
            id: driverData.id,
            name: profile?.full_name || 'Motorista',
            avatarUrl: profile?.avatar_url,
            rating: Number(driverData.rating) || 5,
            totalRides: driverData.total_rides || 0,
            phone: profile?.phone,
            vehicleModel: driverData.vehicle_model,
            vehiclePlate: driverData.vehicle_plate,
            vehicleColor: driverData.vehicle_color,
            currentLat: driverData.current_lat ? Number(driverData.current_lat) : null,
            currentLng: driverData.current_lng ? Number(driverData.current_lng) : null,
          });
        }
      }

      // Fetch passenger info
      if (rideData.passenger_id) {
        const { data: passengerData } = await supabase
          .from('passengers')
          .select('*, profiles:user_id(full_name, avatar_url, phone)')
          .eq('id', rideData.passenger_id)
          .single();

        if (passengerData) {
          const profile = passengerData.profiles as any;
          setPassenger({
            id: passengerData.id,
            name: profile?.full_name || 'Passageiro',
            avatarUrl: profile?.avatar_url,
            rating: Number(passengerData.rating) || 5,
            totalRides: passengerData.total_rides || 0,
            phone: profile?.phone,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching ride details:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!rideId) {
      setRide(null);
      setDriver(null);
      setPassenger(null);
      return;
    }

    fetchRideDetails(rideId);

    // Subscribe to ride changes
    const channel = supabase
      .channel(`ride-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${rideId}`,
        },
        (payload) => {
          console.log('Ride update:', payload);
          if (payload.eventType === 'UPDATE') {
            const newRide = payload.new as RideData;
            setRide(newRide);

            // Fetch driver info if newly assigned
            if (newRide.driver_id && !driver) {
              fetchRideDetails(rideId);
            }

            // Notify on status changes
            if (payload.old && (payload.old as RideData).status !== newRide.status) {
              switch (newRide.status) {
                case 'accepted':
                  toast({ title: '🏍️ Motorista a caminho!' });
                  break;
                case 'in_progress':
                  toast({ title: '🚀 Corrida iniciada!' });
                  break;
                case 'completed':
                  toast({ title: '✅ Corrida finalizada!' });
                  break;
                case 'cancelled':
                  toast({ title: '❌ Corrida cancelada', variant: 'destructive' });
                  break;
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId, fetchRideDetails, toast, driver]);

  return { ride, driver, passenger, loading, refetch: () => rideId && fetchRideDetails(rideId) };
}

export function usePendingRides(franchiseId: string | null, isDriver: boolean = false) {
  const [rides, setRides] = useState<RideData[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPendingRides = useCallback(async () => {
    if (!franchiseId || !isDriver) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('franchise_id', franchiseId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRides((data as RideData[]) || []);
    } catch (error) {
      console.error('Error fetching pending rides:', error);
    } finally {
      setLoading(false);
    }
  }, [franchiseId, isDriver]);

  useEffect(() => {
    if (!franchiseId || !isDriver) return;

    fetchPendingRides();

    // Subscribe to new pending rides
    const channel = supabase
      .channel(`pending-rides-${franchiseId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rides',
          filter: `franchise_id=eq.${franchiseId}`,
        },
        (payload) => {
          const newRide = payload.new as RideData;
          if (newRide.status === 'pending') {
            setRides((prev) => [newRide, ...prev]);
            toast({ title: '🔔 Nova corrida disponível!' });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `franchise_id=eq.${franchiseId}`,
        },
        (payload) => {
          const updatedRide = payload.new as RideData;
          if (updatedRide.status !== 'pending') {
            setRides((prev) => prev.filter((r) => r.id !== updatedRide.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [franchiseId, isDriver, fetchPendingRides, toast]);

  return { rides, loading, refetch: fetchPendingRides };
}
