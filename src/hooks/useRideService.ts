import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGoogleMaps } from './useGoogleMaps';
import type { Database } from '@/integrations/supabase/types';

type ServiceType = Database['public']['Enums']['service_type'];

interface CreateRideParams {
  franchiseId: string;
  passengerId: string;
  origin: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  serviceType?: ServiceType;
  promoCode?: string;
}

interface FranchisePricing {
  basePrice: number;
  pricePerKm: number;
  surgePercentage: number;
  surgeFixedAmount: number;
}

export function useRideService() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { getDistance } = useGoogleMaps();

  const getFranchisePricing = useCallback(async (franchiseId: string): Promise<FranchisePricing | null> => {
    try {
      const { data, error } = await supabase
        .from('franchises')
        .select('base_price, price_per_km, surge_percentage, surge_fixed_amount')
        .eq('id', franchiseId)
        .single();

      if (error) throw error;

      return {
        basePrice: Number(data.base_price) || 5,
        pricePerKm: Number(data.price_per_km) || 2,
        surgePercentage: Number(data.surge_percentage) || 0,
        surgeFixedAmount: Number(data.surge_fixed_amount) || 0,
      };
    } catch (error) {
      console.error('Error fetching franchise pricing:', error);
      return null;
    }
  }, []);

  const calculatePrice = useCallback(async (
    franchiseId: string,
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{ price: number; distance: number; duration: number } | null> => {
    setLoading(true);
    try {
      const [pricing, distanceResult] = await Promise.all([
        getFranchisePricing(franchiseId),
        getDistance(origin, destination),
      ]);

      if (!pricing || !distanceResult) return null;

      let price = pricing.basePrice + (distanceResult.distance * pricing.pricePerKm);
      
      // Apply surge pricing
      if (pricing.surgePercentage > 0) {
        price *= (1 + pricing.surgePercentage / 100);
      }
      price += pricing.surgeFixedAmount;

      return {
        price: Math.round(price * 100) / 100,
        distance: Math.round(distanceResult.distance * 100) / 100,
        duration: distanceResult.duration,
      };
    } catch (error) {
      console.error('Error calculating price:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getFranchisePricing, getDistance]);

  const createRide = useCallback(async (params: CreateRideParams): Promise<string | null> => {
    setLoading(true);
    try {
      const priceData = await calculatePrice(
        params.franchiseId,
        { lat: params.origin.lat, lng: params.origin.lng },
        { lat: params.destination.lat, lng: params.destination.lng }
      );

      if (!priceData) {
        toast({ title: 'Erro ao calcular preço', variant: 'destructive' });
        return null;
      }

      const { data, error } = await supabase
        .from('rides')
        .insert({
          franchise_id: params.franchiseId,
          passenger_id: params.passengerId,
          origin_address: params.origin.address,
          origin_lat: params.origin.lat,
          origin_lng: params.origin.lng,
          destination_address: params.destination.address,
          destination_lat: params.destination.lat,
          destination_lng: params.destination.lng,
          distance_km: priceData.distance,
          estimated_price: priceData.price,
          service_type: params.serviceType || 'ride',
          promo_code: params.promoCode,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) throw error;

      toast({ title: 'Corrida solicitada!', description: 'Buscando motoristas...' });
      return data.id;
    } catch (error: any) {
      console.error('Error creating ride:', error);
      toast({ title: 'Erro ao solicitar corrida', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [calculatePrice, toast]);

  const acceptRide = useCallback(async (rideId: string, driverId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('accept_ride', {
        p_ride_id: rideId,
        p_driver_id: driverId,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        toast({ title: 'Não foi possível aceitar', description: result.error, variant: 'destructive' });
        return false;
      }

      toast({ title: 'Corrida aceita!', description: 'Dirija-se ao passageiro.' });
      return true;
    } catch (error: any) {
      console.error('Error accepting ride:', error);
      toast({ title: 'Erro ao aceitar corrida', description: error.message, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const startRide = useCallback(async (rideId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('rides')
        .update({ status: 'in_progress', started_at: new Date().toISOString() })
        .eq('id', rideId);

      if (error) throw error;

      toast({ title: 'Corrida iniciada!' });
      return true;
    } catch (error: any) {
      console.error('Error starting ride:', error);
      toast({ title: 'Erro ao iniciar corrida', description: error.message, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const completeRide = useCallback(async (
    rideId: string,
    finalPrice: number,
    driverRating?: number,
    passengerRating?: number
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('complete_ride', {
        p_ride_id: rideId,
        p_final_price: finalPrice,
        p_driver_rating: driverRating,
        p_passenger_rating: passengerRating,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        toast({ title: 'Erro ao finalizar', description: result.error, variant: 'destructive' });
        return false;
      }

      toast({ title: 'Corrida finalizada!', description: 'Obrigado por viajar conosco!' });
      return true;
    } catch (error: any) {
      console.error('Error completing ride:', error);
      toast({ title: 'Erro ao finalizar corrida', description: error.message, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const cancelRide = useCallback(async (rideId: string, reason?: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('rides')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', rideId);

      if (error) throw error;

      toast({ title: 'Corrida cancelada' });
      return true;
    } catch (error: any) {
      console.error('Error cancelling ride:', error);
      toast({ title: 'Erro ao cancelar corrida', description: error.message, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const rateRide = useCallback(async (
    rideId: string,
    rating: number,
    isDriver: boolean
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const updateData = isDriver
        ? { passenger_rating: rating }
        : { driver_rating: rating };

      const { error } = await supabase
        .from('rides')
        .update(updateData)
        .eq('id', rideId);

      if (error) throw error;

      toast({ title: 'Avaliação enviada!', description: `Você deu ${rating} estrelas.` });
      return true;
    } catch (error: any) {
      console.error('Error rating ride:', error);
      toast({ title: 'Erro ao avaliar', description: error.message, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateDriverLocation = useCallback(async (
    driverId: string,
    lat: number,
    lng: number
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ current_lat: lat, current_lng: lng })
        .eq('id', driverId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating driver location:', error);
      return false;
    }
  }, []);

  return {
    loading,
    calculatePrice,
    createRide,
    acceptRide,
    startRide,
    completeRide,
    cancelRide,
    rateRide,
    updateDriverLocation,
  };
}
